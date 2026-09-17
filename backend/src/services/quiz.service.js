const quizRepository = require('../repositories/quiz.repository');
const questionRepository = require('../repositories/question.repository');
const resultRepository = require('../repositories/result.repository');
const courseRepository = require('../repositories/course.repository');
const enrollmentRepository = require('../repositories/enrollment.repository');
const AppError = require('../utils/appError');
const xpService = require('./xp.service');

class QuizService {
  async validateEnrollment(courseId, user) {
    if (!user) throw new AppError('Vui lòng đăng nhập để tiếp tục', 401);
    const isTeacherOrAdmin = user.role === 'admin' || user.role === 'teacher';
    if (!isTeacherOrAdmin) {
      const enrollment = await enrollmentRepository.findByStudentAndCourse(user.id, courseId);
      if (!enrollment || enrollment.paymentStatus !== 'completed') {
        throw new AppError('Bạn cần đăng ký khóa học này để tham gia làm bài kiểm tra', 403);
      }
    }
  }

  async createQuiz(courseId, quizData, user) {
    const course = await courseRepository.findById(courseId);
    if (!course) throw new AppError('Không tìm thấy khóa học', 404);

    if (user.role !== 'admin' && course.instructor._id.toString() !== user.id) {
      throw new AppError('Bạn không có quyền tạo Quiz cho khóa học này', 403);
    }

    quizData.course = courseId;
    return await quizRepository.create(quizData);
  }

  async addQuestion(quizId, questionData, user) {
    const quiz = await quizRepository.findById(quizId);
    if (!quiz) throw new AppError('Không tìm thấy Quiz', 404);

    const course = await courseRepository.findById(quiz.course);
    if (!course) throw new AppError('Không tìm thấy khóa học của Quiz này', 404);

    const instructorId = course.instructor && course.instructor._id 
      ? course.instructor._id.toString() 
      : course.instructor ? course.instructor.toString() : '';

    if (user.role !== 'admin' && instructorId !== user.id) {
      throw new AppError('Bạn không có quyền chỉnh sửa câu hỏi của Quiz này', 403);
    }

    questionData.quiz = quizId;
    return await questionRepository.create(questionData);
  }

  async getQuizzesByCourse(courseId, user) {
    const course = await courseRepository.findById(courseId);
    if (!course) throw new AppError('Không tìm thấy khóa học', 404);
    
    const Question = require('../models/Question');
    const Result = require('../models/Result');
    const quizzes = await quizRepository.findByCourse(courseId);
    if (!quizzes || quizzes.length === 0) return [];

    const quizIds = quizzes.map(q => q._id);
    const userId = user?.id || user?._id;

    // Batch query 1: Đếm số câu hỏi của tất cả quizzes trong 1 aggregation
    // Batch query 2: Lấy kết quả làm bài của học viên cho tất cả quizzes cùng lúc
    const [questionCounts, studentResults] = await Promise.all([
      Question.aggregate([
        { $match: { quiz: { $in: quizIds } } },
        { $group: { _id: '$quiz', count: { $sum: 1 } } }
      ]),
      userId ? Result.find({ student: userId, quiz: { $in: quizIds } }).lean() : Promise.resolve([])
    ]);

    const countMap = new Map();
    questionCounts.forEach(item => countMap.set(item._id.toString(), item.count));

    const resultMap = new Map();
    studentResults.forEach(res => resultMap.set(res.quiz.toString(), res));

    return quizzes.map(quiz => {
      const quizObj = quiz.toObject ? quiz.toObject() : { ...quiz };
      const qIdStr = quiz._id.toString();
      quizObj.questionCount = countMap.get(qIdStr) || 0;

      const studentResult = resultMap.get(qIdStr);
      if (studentResult) {
        quizObj.isCompleted = true;
        quizObj.isPassed = studentResult.isPassed;
        quizObj.scorePercentage = studentResult.scorePercentage;
        quizObj.score = studentResult.score;
      } else {
        quizObj.isCompleted = false;
        quizObj.isPassed = false;
        quizObj.scorePercentage = null;
        quizObj.score = null;
      }
      return quizObj;
    });
  }

  async getQuizForStudent(quizId, user) {
    const quiz = await quizRepository.findById(quizId);
    if (!quiz) throw new AppError('Không tìm thấy Quiz', 404);

    if (user) {
      await this.validateEnrollment(quiz.course, user);
    }

    const questions = await questionRepository.findByQuiz(quizId);

    // Ẩn đáp án đúng trước khi gửi cho học viên
    const sanitizedQuestions = questions.map(q => {
      const sanitizedOptions = q.options.map(opt => ({
        _id: opt._id,
        text: opt.text
      }));
      return {
        _id: q._id,
        text: q.text,
        points: q.points,
        options: sanitizedOptions
      };
    });

    const quizObj = quiz.toObject ? quiz.toObject() : { ...quiz };
    quizObj.questionCount = questions.length;
    quizObj.totalQuestions = questions.length;

    return { quiz: quizObj, questions: sanitizedQuestions };
  }

  // HỆ THỐNG AUTO GRADING
  async submitQuiz(quizId, studentAnswers, user) {
    const quiz = await quizRepository.findById(quizId);
    if (!quiz) throw new AppError('Không tìm thấy Quiz', 404);

    await this.validateEnrollment(quiz.course, user);

    const questions = await questionRepository.findByQuiz(quizId);
    const answersList = Array.isArray(studentAnswers) ? studentAnswers : (studentAnswers?.answers || []);
    
    let totalScore = 0;
    let maxScore = 0;
    let correctCount = 0;

    const review = questions.map(question => {
      maxScore += question.points;

      // Tìm câu trả lời của học viên cho câu hỏi này
      const studentAnswer = answersList.find(ans => ans.questionId === question._id.toString());
      const correctOption = question.options.find(opt => opt.isCorrect === true);
      const isCorrect = Boolean(
        correctOption && 
        studentAnswer && 
        studentAnswer.selectedOptionId === correctOption._id.toString()
      );

      if (isCorrect) {
        totalScore += question.points;
        correctCount += 1;
      }

      return {
        questionId: question._id,
        text: question.text,
        points: question.points,
        selectedOptionId: studentAnswer?.selectedOptionId || null,
        correctOptionId: correctOption?._id || null,
        isCorrect,
        explanation: question.explanation
      };
    });

    // Tính phần trăm
    const scorePercentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
    const isPassed = scorePercentage >= quiz.passingScore;

    // Tạo kết quả (Result)
    const resultData = {
      student: user.id,
      quiz: quizId,
      course: quiz.course,
      type: 'standard',
      score: totalScore,
      scorePercentage: Math.round(scorePercentage),
      isPassed,
      totalQuestions: questions.length,
      correctCount
    };

    // Có thể cập nhật nếu làm lại, hoặc tạo mới
    let result = await resultRepository.findByStudentAndQuiz(user.id, quizId);
    if (result) {
      result.score = resultData.score;
      result.scorePercentage = resultData.scorePercentage;
      result.isPassed = resultData.isPassed;
      result.totalQuestions = resultData.totalQuestions;
      result.correctCount = resultData.correctCount;
      await result.save();
    } else {
      result = await resultRepository.create(resultData);
    }

    if (isPassed) {
      await xpService.addXP(user.id, 'QUIZ_COMPLETE');
      if (totalScore === maxScore) {
        await xpService.awardBadge(user.id, 'QUIZ_MASTER');
      }
    }

    // Cập nhật streak & study history
    try {
      const userRepository = require('../repositories/user.repository');
      const student = await userRepository.findById(user.id);
      if (student) {
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        let todayRecord = student.studyHistory?.find(h => h.date === today);
        if (!todayRecord) {
          student.studyHistory = student.studyHistory || [];
          student.studyHistory.push({ date: today, focusMinutes: 5, lessonsCompleted: 0 });
          const yesterdayRecord = student.studyHistory.find(h => h.date === yesterday);
          if (yesterdayRecord) {
            student.studyStreakDays = (student.studyStreakDays || 0) + 1;
          } else if (student.studyStreakDays === 0) {
            student.studyStreakDays = 1;
          }
        }
        await student.save({ validateBeforeSave: false });
      }
    } catch (err) {
      console.error('Failed to update study streak for quiz submission:', err);
    }

    return {
      _id: result._id,
      student: user.id,
      quiz: quizId,
      score: totalScore,
      maxScore,
      scorePercentage: Math.round(scorePercentage),
      isPassed,
      passed: isPassed,
      totalQuestions: questions.length,
      correctCount,
      wrongCount: questions.length - correctCount,
      passingScore: quiz.passingScore,
      review
    };
  }

  async addLessonQuestion(lessonId, questionData, user) {
    const lesson = await require('../repositories/lesson.repository').findById(lessonId);
    if (!lesson) throw new AppError('Không tìm thấy bài giảng', 404);

    const course = await courseRepository.findById(lesson.course);
    if (!course) throw new AppError('Không tìm thấy khóa học của bài giảng này', 404);

    const instructorId = course.instructor && course.instructor._id 
      ? course.instructor._id.toString() 
      : course.instructor ? course.instructor.toString() : '';

    if (user.role !== 'admin' && instructorId !== user.id) {
      throw new AppError('Bạn không có quyền thêm câu hỏi cho bài giảng này', 403);
    }

    questionData.lesson = lessonId;
    return await questionRepository.create(questionData);
  }

  async generateSmartQuiz(courseId, user, limit = 10) {
    await this.validateEnrollment(courseId, user);

    const Quiz = require('../models/Quiz');
    const Lesson = require('../models/Lesson');
    const Question = require('../models/Question');

    // 1. Tìm tất cả quizzes và lessons của khóa học này
    const [quizzes, lessons] = await Promise.all([
      Quiz.find({ course: courseId }),
      Lesson.find({ course: courseId })
    ]);

    const quizIds = quizzes.map(q => q._id);
    const lessonIds = lessons.map(l => l._id);

    // 2. Lấy tất cả câu hỏi thuộc các quizzes hoặc lessons này (hoặc gắn trực tiếp với khóa học)
    const questions = await Question.find({
      $or: [
        { course: courseId },
        { quiz: { $in: quizIds } },
        { lesson: { $in: lessonIds } }
      ]
    });

    if (questions.length === 0) {
      throw new AppError('Khoá học này chưa có câu hỏi trắc nghiệm nào từ giảng viên', 404);
    }

    // 3. Chọn ngẫu nhiên số lượng câu hỏi theo limit
    const shuffled = questions.sort(() => 0.5 - Math.random());
    const targetCount = Number(limit) || 10;
    const selectedQuestions = shuffled.slice(0, targetCount);

    // Ẩn đáp án đúng
    const sanitizedQuestions = selectedQuestions.map(q => {
      const sanitizedOptions = q.options.map(opt => ({
        _id: opt._id,
        text: opt.text
      }));
      return {
        _id: q._id,
        text: q.text,
        points: q.points,
        options: sanitizedOptions
      };
    });

    return {
      quiz: {
        _id: 'smart',
        title: {
          vi: `Bài luyện tập ngẫu nhiên (${selectedQuestions.length} câu hỏi)`,
          en: `Random Practice Quiz (${selectedQuestions.length} Questions)`
        },
        timeLimit: Math.ceil(selectedQuestions.length * 1.5), // 1.5 phút mỗi câu
        passingScore: 80,
        questionCount: selectedQuestions.length,
        totalQuestions: selectedQuestions.length
      },
      questions: sanitizedQuestions
    };
  }

  async submitSmartQuiz(courseId, payload, user) {
    await this.validateEnrollment(courseId, user);

    const Question = require('../models/Question');
    const Result = require('../models/Result');

    const studentAnswers = Array.isArray(payload) ? payload : (payload?.answers || []);
    let sessionQuestionIds = Array.isArray(payload?.questionIds) ? payload.questionIds : [];

    if (sessionQuestionIds.length === 0) {
      sessionQuestionIds = studentAnswers.map(ans => ans.questionId);
    }

    // Load exact questions belonging to this quiz session
    const questions = await Question.find({ _id: { $in: sessionQuestionIds } });
    if (questions.length === 0) {
      throw new AppError('Không tìm thấy danh sách câu hỏi hợp lệ để chấm điểm', 400);
    }

    let totalScore = 0;
    let maxScore = 0;
    let correctCount = 0;

    const review = questions.map(question => {
      maxScore += question.points;
      const studentAnswer = studentAnswers.find(ans => ans.questionId === question._id.toString());
      const correctOption = question.options.find(opt => opt.isCorrect === true);
      const isCorrect = Boolean(
        correctOption && 
        studentAnswer && 
        studentAnswer.selectedOptionId === correctOption._id.toString()
      );

      if (isCorrect) {
        totalScore += question.points;
        correctCount += 1;
      }

      return {
        questionId: question._id,
        text: question.text,
        points: question.points,
        selectedOptionId: studentAnswer?.selectedOptionId || null,
        correctOptionId: correctOption?._id || null,
        isCorrect,
        explanation: question.explanation
      };
    });

    const scorePercentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
    const isPassed = scorePercentage >= 80;

    // Save practice result
    let result = await Result.create({
      student: user.id,
      course: courseId,
      type: 'practice',
      score: totalScore,
      scorePercentage: Math.round(scorePercentage),
      isPassed,
      totalQuestions: questions.length,
      correctCount
    });

    if (isPassed) {
      await xpService.addXP(user.id, 'QUIZ_COMPLETE');
      if (totalScore === maxScore) {
        await xpService.awardBadge(user.id, 'QUIZ_MASTER');
      }
    }

    // Cập nhật streak & study history
    try {
      const userRepository = require('../repositories/user.repository');
      const student = await userRepository.findById(user.id);
      if (student) {
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        let todayRecord = student.studyHistory?.find(h => h.date === today);
        if (!todayRecord) {
          student.studyHistory = student.studyHistory || [];
          student.studyHistory.push({ date: today, focusMinutes: 5, lessonsCompleted: 0 });
          const yesterdayRecord = student.studyHistory.find(h => h.date === yesterday);
          if (yesterdayRecord) {
            student.studyStreakDays = (student.studyStreakDays || 0) + 1;
          } else if (student.studyStreakDays === 0) {
            student.studyStreakDays = 1;
          }
        }
        await student.save({ validateBeforeSave: false });
      }
    } catch (err) {
      console.error('Failed to update study streak for smart quiz:', err);
    }

    return {
      _id: result._id,
      student: user.id,
      course: courseId,
      score: totalScore,
      maxScore,
      scorePercentage: Math.round(scorePercentage),
      isPassed,
      passed: isPassed,
      totalQuestions: questions.length,
      correctCount,
      wrongCount: questions.length - correctCount,
      passingScore: 80,
      review
    };
  }


  async updateQuiz(quizId, updateData, user) {
    const quiz = await quizRepository.findById(quizId);
    if (!quiz) throw new AppError('Không tìm thấy Quiz', 404);

    const course = await courseRepository.findById(quiz.course);
    if (!course) throw new AppError('Không tìm thấy khóa học của Quiz này', 404);

    const instructorId = course.instructor && course.instructor._id 
      ? course.instructor._id.toString() 
      : course.instructor ? course.instructor.toString() : '';

    if (user.role !== 'admin' && instructorId !== user.id) {
      throw new AppError('Bạn không có quyền chỉnh sửa Quiz này', 403);
    }

    return await quizRepository.updateById(quizId, updateData);
  }

  async deleteQuiz(quizId, user) {
    const quiz = await quizRepository.findById(quizId);
    if (!quiz) throw new AppError('Không tìm thấy Quiz', 404);

    const course = await courseRepository.findById(quiz.course);
    if (!course) throw new AppError('Không tìm thấy khóa học của Quiz này', 404);

    const instructorId = course.instructor && course.instructor._id 
      ? course.instructor._id.toString() 
      : course.instructor ? course.instructor.toString() : '';

    if (user.role !== 'admin' && instructorId !== user.id) {
      throw new AppError('Bạn không có quyền xóa Quiz này', 403);
    }

    // Xóa câu hỏi của quiz này
    await require('../models/Question').deleteMany({ quiz: quizId });

    return await quizRepository.deleteById(quizId);
  }

  async updateQuestion(questionId, updateData, user) {
    const question = await questionRepository.findById(questionId);
    if (!question) throw new AppError('Không tìm thấy câu hỏi', 404);

    let courseId;
    if (question.quiz) {
      const quiz = await quizRepository.findById(question.quiz);
      if (!quiz) throw new AppError('Không tìm thấy Quiz liên quan', 404);
      courseId = quiz.course;
    } else if (question.lesson) {
      const lesson = await require('../repositories/lesson.repository').findById(question.lesson);
      if (!lesson) throw new AppError('Không tìm thấy bài giảng liên quan', 404);
      courseId = lesson.course;
    }

    if (!courseId) throw new AppError('Không tìm thấy khóa học liên quan đến câu hỏi này', 404);

    const course = await courseRepository.findById(courseId);
    if (!course) throw new AppError('Không tìm thấy khóa học', 404);

    const instructorId = course.instructor && course.instructor._id 
      ? course.instructor._id.toString() 
      : course.instructor ? course.instructor.toString() : '';

    if (user.role !== 'admin' && instructorId !== user.id) {
      throw new AppError('Bạn không có quyền chỉnh sửa câu hỏi này', 403);
    }

    return await questionRepository.updateById(questionId, updateData);
  }

  async deleteQuestion(questionId, user) {
    const question = await questionRepository.findById(questionId);
    if (!question) throw new AppError('Không tìm thấy câu hỏi', 404);

    let courseId;
    if (question.quiz) {
      const quiz = await quizRepository.findById(question.quiz);
      if (!quiz) throw new AppError('Không tìm thấy Quiz liên quan', 404);
      courseId = quiz.course;
    } else if (question.lesson) {
      const lesson = await require('../repositories/lesson.repository').findById(question.lesson);
      if (!lesson) throw new AppError('Không tìm thấy bài giảng liên quan', 404);
      courseId = lesson.course;
    }

    if (!courseId) throw new AppError('Không tìm thấy khóa học liên quan đến câu hỏi này', 404);

    const course = await courseRepository.findById(courseId);
    if (!course) throw new AppError('Không tìm thấy khóa học', 404);

    const instructorId = course.instructor && course.instructor._id 
      ? course.instructor._id.toString() 
      : course.instructor ? course.instructor.toString() : '';

    if (user.role !== 'admin' && instructorId !== user.id) {
      throw new AppError('Bạn không có quyền xóa câu hỏi này', 403);
    }

    return await questionRepository.deleteById(questionId);
  }

  async getQuizResults(quizId, user) {
    const quiz = await quizRepository.findById(quizId);
    if (!quiz) throw new AppError('Không tìm thấy Quiz', 404);

    if (user.role === 'admin' || user.role === 'teacher') {
      const Result = require('../models/Result');
      return await Result.find({ quiz: quizId }).populate('student', 'name email avatar').sort({ createdAt: -1 });
    }

    const result = await resultRepository.findByStudentAndQuiz(user.id, quizId);
    return result;
  }
  async getQuestionsForTeacher(quizId, user) {
    const quiz = await quizRepository.findById(quizId);
    if (!quiz) throw new AppError('Không tìm thấy Quiz', 404);

    const course = await courseRepository.findById(quiz.course);
    if (!course) throw new AppError('Không tìm thấy khóa học của Quiz này', 404);

    const instructorId = course.instructor && course.instructor._id 
      ? course.instructor._id.toString() 
      : course.instructor ? course.instructor.toString() : '';

    if (user.role !== 'admin' && instructorId !== user.id) {
      throw new AppError('Bạn không có quyền xem câu hỏi và đáp án của Quiz này', 403);
    }

    return await questionRepository.findByQuiz(quizId);
  }

  async getLessonQuestionsForTeacher(lessonId, user) {
    const lesson = await require('../repositories/lesson.repository').findById(lessonId);
    if (!lesson) throw new AppError('Không tìm thấy bài giảng', 404);

    const course = await courseRepository.findById(lesson.course);
    if (!course) throw new AppError('Không tìm thấy khóa học của bài giảng này', 404);

    const instructorId = course.instructor && course.instructor._id 
      ? course.instructor._id.toString() 
      : course.instructor ? course.instructor.toString() : '';

    if (user.role !== 'admin' && instructorId !== user.id) {
      throw new AppError('Bạn không có quyền xem câu hỏi và đáp án của bài giảng này', 403);
    }

    return await questionRepository.findByLesson(lessonId);
  }
}

module.exports = new QuizService();

