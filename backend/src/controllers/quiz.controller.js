const quizService = require('../services/quiz.service');
const catchAsync = require('../utils/catchAsync');

class QuizController {
  createQuiz = catchAsync(async (req, res, next) => {
    // Nested route: /courses/:courseId/quizzes
    const quiz = await quizService.createQuiz(req.params.courseId, req.body, req.user);
    res.status(201).json({ status: 'success', data: { quiz } });
  });

  addQuestion = catchAsync(async (req, res, next) => {
    // Route: /quizzes/:quizId/questions
    const question = await quizService.addQuestion(req.params.quizId, req.body, req.user);
    res.status(201).json({ status: 'success', data: { question } });
  });

  getQuizForTake = catchAsync(async (req, res, next) => {
    const data = await quizService.getQuizForStudent(req.params.quizId);
    res.status(200).json({ status: 'success', data });
  });

  submitQuiz = catchAsync(async (req, res, next) => {
    // client gửi lên mảng answers: [{ questionId, selectedOptionId }]
    const result = await quizService.submitQuiz(req.params.quizId, req.body.answers, req.user);
    
    res.status(200).json({ 
      status: 'success', 
      message: result.isPassed ? 'Chúc mừng bạn đã vượt qua bài thi!' : 'Rất tiếc, bạn chưa đủ điểm qua môn.',
      data: { result } 
    });
  });
}

module.exports = new QuizController();
