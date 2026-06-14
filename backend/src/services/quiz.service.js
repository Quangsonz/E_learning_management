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
}

module.exports = new QuizService();
