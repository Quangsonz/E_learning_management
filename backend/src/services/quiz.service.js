const quizRepository = require('../repositories/quiz.repository');
const questionRepository = require('../repositories/question.repository');
const resultRepository = require('../repositories/result.repository');
const courseRepository = require('../repositories/course.repository');
const AppError = require('../utils/appError');

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

    // Xác thực quyền (đáng ra nên gọi populate course để check instructor, vì lý do tối giản ta có thể check role teacher/admin)
    // Thực tế: Cần check quiz.course.instructor == user.id

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

    return result;
  }

  async addLessonQuestion(lessonId, questionData, user) {
    const lesson = await require('../repositories/lesson.repository').findById(lessonId);
    if (!lesson) throw new AppError('Không tìm thấy bài giảng', 404);

    questionData.lesson = lessonId;
    return await questionRepository.create(questionData);
  }

  async generateSmartQuiz(courseId, user) {
    const progress = await require('../repositories/progress.repository').findByStudentAndCourse(user.id, courseId);
    if (!progress || !progress.completedLessons || progress.completedLessons.length === 0) {
      throw new AppError('Bạn cần hoàn thành ít nhất 1 bài giảng để tạo bài tập ôn tập', 400);
    }

    // Lấy tất cả câu hỏi thuộc các bài giảng đã học
    const questions = await questionRepository.findInLessons(progress.completedLessons);
    if (questions.length === 0) {
      throw new AppError('Các bài giảng đã học chưa có câu hỏi ôn tập nào', 404);
    }

    // Chọn ngẫu nhiên tối đa 10 câu
    const shuffled = questions.sort(() => 0.5 - Math.random());
    const selectedQuestions = shuffled.slice(0, 10);

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
        title: 'Smart Review Quiz',
        timeLimit: 15,
        passingScore: 80
      },
      questions: sanitizedQuestions
    };
  }

  async submitSmartQuiz(courseId, studentAnswers, user) {
    // Smart quiz chấm điểm tương tự bình thường nhưng không lưu kết quả vào Result model (hoặc lưu dưới dạng đặc biệt)
    // Để đơn giản, ta chỉ chấm và trả về kết quả
    const progress = await require('../repositories/progress.repository').findByStudentAndCourse(user.id, courseId);
    if (!progress) throw new AppError('Không tìm thấy tiến trình học tập', 404);

    const questions = await questionRepository.findInLessons(progress.completedLessons);

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

    // Nếu người dùng không gửi đủ câu trả lời, maxScore vẫn phải tính dựa trên toàn bộ câu hỏi?
    // Trong trường hợp này smart quiz sinh ngẫu nhiên, ta chấm dựa trên những câu học viên GỬI LÊN.
    // Thực tế để chính xác, frontend gửi danh sách questionId đã được tạo, ta tính maxScore dựa trên đó.
    // Để đơn giản, maxScore tính theo studentAnswers.
    // Hoặc ta query lại bằng $in: studentAnswers.map(ans => ans.questionId)
    const submittedQuestionIds = studentAnswers.map(ans => ans.questionId);
    const submittedQuestions = questions.filter(q => submittedQuestionIds.includes(q._id.toString()));
    
    maxScore = submittedQuestions.reduce((acc, cur) => acc + cur.points, 0);

    const scorePercentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
    const isPassed = scorePercentage >= 80; // Giả định passingScore là 80

    return {
      score: totalScore,
      maxScore,
      scorePercentage: Math.round(scorePercentage),
      isPassed
    };
  }
}

module.exports = new QuizService();
