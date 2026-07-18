const quizRepository = require('../repositories/quiz.repository');
const questionRepository = require('../repositories/question.repository');
const resultRepository = require('../repositories/result.repository');
const courseRepository = require('../repositories/course.repository');
const AppError = require('../utils/appError');
const xpService = require('./xp.service');

class QuizService {
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
    
    // Admin/Teacher có thể xem tất cả quizzes
    // Học sinh có thể xem nếu đã enroll, nhưng để đơn giản ta lấy ra list (không kèm đáp án)
    // Thực tế list quizzes không chứa questions, câu hỏi chỉ load khi `getQuizForStudent`
    const quizzes = await quizRepository.findByCourse(courseId);
    return quizzes;
  }

  async getQuizForStudent(quizId) {
    const quiz = await quizRepository.findById(quizId);
    if (!quiz) throw new AppError('Không tìm thấy Quiz', 404);

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

    return { quiz, questions: sanitizedQuestions };
  }

  // HỆ THỐNG AUTO GRADING
  async submitQuiz(quizId, studentAnswers, user) {
    const quiz = await quizRepository.findById(quizId);
    if (!quiz) throw new AppError('Không tìm thấy Quiz', 404);

    const questions = await questionRepository.findByQuiz(quizId);
    
    let totalScore = 0;
    let maxScore = 0;

    // Chấm điểm tự động
    questions.forEach(question => {
      maxScore += question.points;

      // Tìm câu trả lời của học viên cho câu hỏi này
      const studentAnswer = studentAnswers.find(ans => ans.questionId === question._id.toString());
      
      if (studentAnswer) {
        // Tìm option đúng của câu hỏi
        const correctOption = question.options.find(opt => opt.isCorrect === true);
        
        if (correctOption && studentAnswer.selectedOptionId === correctOption._id.toString()) {
          totalScore += question.points;
        }
      }
    });

    // Tính phần trăm
    const scorePercentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
    const isPassed = scorePercentage >= quiz.passingScore;

    // Tạo kết quả (Result)
    const resultData = {
      student: user.id,
      quiz: quizId,
      score: totalScore,
      scorePercentage: Math.round(scorePercentage),
      isPassed
    };

    // Có thể cập nhật nếu làm lại, hoặc tạo mới
    let result = await resultRepository.findByStudentAndQuiz(user.id, quizId);
    if (result) {
      result.score = resultData.score;
      result.scorePercentage = resultData.scorePercentage;
      result.isPassed = resultData.isPassed;
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

    return result;
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

    // 2. Lấy tất cả câu hỏi thuộc các quizzes hoặc lessons này
    const questions = await Question.find({
      $or: [
        { quiz: { $in: quizIds } },
        { lesson: { $in: lessonIds } }
      ]
    });

    if (questions.length === 0) {
      throw new AppError('Khoá học này chưa có câu hỏi trắc nghiệm nào từ giảng viên', 404);
    }

    // 3. Chọn ngẫu nhiên số lượng câu hỏi theo limit
    const shuffled = questions.sort(() => 0.5 - Math.random());
    const selectedQuestions = shuffled.slice(0, Number(limit) || 10);

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
        title: `Random Practice Quiz (${selectedQuestions.length} Questions)`,
        timeLimit: Math.ceil(selectedQuestions.length * 1.5), // 1.5 phút mỗi câu
        passingScore: 80
      },
      questions: sanitizedQuestions
    };
  }

  async submitSmartQuiz(courseId, studentAnswers, user) {
    const Quiz = require('../models/Quiz');
    const Lesson = require('../models/Lesson');
    const Question = require('../models/Question');

    const [quizzes, lessons] = await Promise.all([
      Quiz.find({ course: courseId }),
      Lesson.find({ course: courseId })
    ]);

    const quizIds = quizzes.map(q => q._id);
    const lessonIds = lessons.map(l => l._id);

    const questions = await Question.find({
      $or: [
        { quiz: { $in: quizIds } },
        { lesson: { $in: lessonIds } }
      ]
    });

    let totalScore = 0;
    let maxScore = 0;

    studentAnswers.forEach(ans => {
      const question = questions.find(q => q._id.toString() === ans.questionId);
      if (question) {
        maxScore += question.points;
        const correctOption = question.options.find(opt => opt.isCorrect === true);
        if (correctOption && ans.selectedOptionId === correctOption._id.toString()) {
          totalScore += question.points;
        }
      }
    });

    const submittedQuestionIds = studentAnswers.map(ans => ans.questionId);
    const submittedQuestions = questions.filter(q => submittedQuestionIds.includes(q._id.toString()));
    maxScore = submittedQuestions.reduce((acc, cur) => acc + cur.points, 0);

    const scorePercentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
    const isPassed = scorePercentage >= 80;

    return {
      score: totalScore,
      maxScore,
      scorePercentage: Math.round(scorePercentage),
      isPassed
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
}

module.exports = new QuizService();
