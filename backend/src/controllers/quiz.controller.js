const quizService = require('../services/quiz.service');
const catchAsync = require('../utils/catchAsync');

class QuizController {
  createQuiz = catchAsync(async (req, res, next) => {
    const courseId = req.params.courseId || req.body.course;
    const quiz = await quizService.createQuiz(courseId, req.body, req.user);
    res.status(201).json({ status: 'success', data: { quiz } });
  });

  addQuestion = catchAsync(async (req, res, next) => {
    // Route: /quizzes/:quizId/questions
    const question = await quizService.addQuestion(req.params.quizId, req.body, req.user);
    res.status(201).json({ status: 'success', data: { question } });
  });

  getQuizzesByCourse = catchAsync(async (req, res, next) => {
    // Route: /course/:courseId/quizzes (will be added)
    const quizzes = await quizService.getQuizzesByCourse(req.params.courseId, req.user);
    res.status(200).json({ status: 'success', data: { quizzes } });
  });

  getQuestionsForTeacher = catchAsync(async (req, res, next) => {
    const questions = await require('../repositories/question.repository').findByQuiz(req.params.quizId);
    res.status(200).json({ status: 'success', data: { questions } });
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

  generateSmartQuiz = catchAsync(async (req, res, next) => {
    const data = await quizService.generateSmartQuiz(req.params.courseId, req.user, req.query.limit);
    res.status(200).json({ status: 'success', data });
  });

  submitSmartQuiz = catchAsync(async (req, res, next) => {
    const result = await quizService.submitSmartQuiz(req.params.courseId, req.body.answers, req.user);
    res.status(200).json({
      status: 'success',
      message: result.isPassed ? 'Chúc mừng bạn đã vượt qua bài ôn tập!' : 'Bạn cần cố gắng hơn!',
      data: { result }
    });
  });

  addLessonQuestion = catchAsync(async (req, res, next) => {
    const question = await quizService.addLessonQuestion(req.params.lessonId, req.body, req.user);
    res.status(201).json({ status: 'success', data: { question } });
  });

  getLessonQuestionsForTeacher = catchAsync(async (req, res, next) => {
    const questions = await require('../repositories/question.repository').findByLesson(req.params.lessonId);
    res.status(200).json({ status: 'success', data: { questions } });
  });

  updateQuiz = catchAsync(async (req, res, next) => {
    const quiz = await quizService.updateQuiz(req.params.id, req.body, req.user);
    res.status(200).json({ status: 'success', data: { quiz } });
  });

  deleteQuiz = catchAsync(async (req, res, next) => {
    await quizService.deleteQuiz(req.params.id, req.user);
    res.status(204).json({ status: 'success', data: null });
  });

  updateQuestion = catchAsync(async (req, res, next) => {
    const question = await quizService.updateQuestion(req.params.id, req.body, req.user);
    res.status(200).json({ status: 'success', data: { question } });
  });

  deleteQuestion = catchAsync(async (req, res, next) => {
    await quizService.deleteQuestion(req.params.id, req.user);
    res.status(204).json({ status: 'success', data: null });
  });
}

module.exports = new QuizController();
