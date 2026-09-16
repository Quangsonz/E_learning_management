const quizService = require('../../src/services/quiz.service');
const quizRepository = require('../../src/repositories/quiz.repository');
const questionRepository = require('../../src/repositories/question.repository');
const resultRepository = require('../../src/repositories/result.repository');
const courseRepository = require('../../src/repositories/course.repository');
const enrollmentRepository = require('../../src/repositories/enrollment.repository');
const xpService = require('../../src/services/xp.service');
const AppError = require('../../src/utils/appError');
const Question = require('../../src/models/Question');
const Result = require('../../src/models/Result');
const userRepository = require('../../src/repositories/user.repository');

jest.mock('../../src/repositories/quiz.repository');
jest.mock('../../src/repositories/question.repository');
jest.mock('../../src/repositories/result.repository');
jest.mock('../../src/repositories/course.repository');
jest.mock('../../src/repositories/enrollment.repository');
jest.mock('../../src/repositories/user.repository');
jest.mock('../../src/services/xp.service');
jest.mock('../../src/models/Question');
jest.mock('../../src/models/Result');

describe('QuizService Unit Tests', () => {
  const mockUser = { id: 'student123', role: 'student' };
  const mockCourseId = 'course456';
  const mockQuizId = 'quiz789';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateEnrollment', () => {
    it('should throw 401 if user is not provided', async () => {
      await expect(quizService.validateEnrollment(mockCourseId, null))
        .rejects.toThrow(AppError);
    });

    it('should allow admin or teacher without checking enrollment repository', async () => {
      await expect(quizService.validateEnrollment(mockCourseId, { id: 'admin1', role: 'admin' }))
        .resolves.toBeUndefined();
      await expect(quizService.validateEnrollment(mockCourseId, { id: 'teach1', role: 'teacher' }))
        .resolves.toBeUndefined();
      expect(enrollmentRepository.findByStudentAndCourse).not.toHaveBeenCalled();
    });

    it('should allow student with completed paymentStatus', async () => {
      enrollmentRepository.findByStudentAndCourse.mockResolvedValue({
        student: mockUser.id,
        course: mockCourseId,
        paymentStatus: 'completed'
      });

      await expect(quizService.validateEnrollment(mockCourseId, mockUser))
        .resolves.toBeUndefined();
      expect(enrollmentRepository.findByStudentAndCourse).toHaveBeenCalledWith(mockUser.id, mockCourseId);
    });

    it('should throw 403 if student is not enrolled', async () => {
      enrollmentRepository.findByStudentAndCourse.mockResolvedValue(null);

      await expect(quizService.validateEnrollment(mockCourseId, mockUser))
        .rejects.toThrow(AppError);
    });

    it('should throw 403 if enrollment paymentStatus is not completed', async () => {
      enrollmentRepository.findByStudentAndCourse.mockResolvedValue({
        student: mockUser.id,
        course: mockCourseId,
        paymentStatus: 'pending'
      });

      await expect(quizService.validateEnrollment(mockCourseId, mockUser))
        .rejects.toThrow(AppError);
    });
  });

  describe('submitQuiz (Standard Quiz)', () => {
    const mockQuiz = {
      _id: mockQuizId,
      course: mockCourseId,
      title: 'Final Exam',
      passingScore: 75
    };

    const mockQuestions = [
      {
        _id: 'q1',
        text: 'What is 2 + 2?',
        points: 10,
        explanation: '2+2=4',
        options: [
          { _id: 'opt1_1', text: '3', isCorrect: false },
          { _id: 'opt1_2', text: '4', isCorrect: true }
        ]
      },
      {
        _id: 'q2',
        text: 'What is capital of France?',
        points: 10,
        explanation: 'Paris is capital',
        options: [
          { _id: 'opt2_1', text: 'Paris', isCorrect: true },
          { _id: 'opt2_2', text: 'London', isCorrect: false }
        ]
      }
    ];

    beforeEach(() => {
      quizRepository.findById.mockResolvedValue(mockQuiz);
      enrollmentRepository.findByStudentAndCourse.mockResolvedValue({
        student: mockUser.id,
        course: mockCourseId,
        paymentStatus: 'completed'
      });
      questionRepository.findByQuiz.mockResolvedValue(mockQuestions);
      resultRepository.findByStudentAndQuiz.mockResolvedValue(null);
      resultRepository.create.mockImplementation(data => Promise.resolve({ _id: 'res123', ...data }));
    });

    it('should grade quiz accurately and award XP when passed', async () => {
      // Student answers q1 correctly, skips q2
      const studentAnswers = [
        { questionId: 'q1', selectedOptionId: 'opt1_2' }
      ];

      const res = await quizService.submitQuiz(mockQuizId, studentAnswers, mockUser);

      expect(res.score).toBe(10);
      expect(res.maxScore).toBe(20);
      expect(res.scorePercentage).toBe(50);
      expect(res.isPassed).toBe(false); // 50% < 75%
      expect(res.passed).toBe(false);
      expect(res.totalQuestions).toBe(2);
      expect(res.correctCount).toBe(1);
      expect(res.wrongCount).toBe(1);
      expect(res.review).toHaveLength(2);
      expect(res.review[0].isCorrect).toBe(true);
      expect(res.review[1].isCorrect).toBe(false);
      expect(xpService.addXP).not.toHaveBeenCalled();
    });

    it('should award QUIZ_MASTER badge on 100% score', async () => {
      const studentAnswers = [
        { questionId: 'q1', selectedOptionId: 'opt1_2' },
        { questionId: 'q2', selectedOptionId: 'opt2_1' }
      ];

      const res = await quizService.submitQuiz(mockQuizId, studentAnswers, mockUser);

      expect(res.score).toBe(20);
      expect(res.maxScore).toBe(20);
      expect(res.scorePercentage).toBe(100);
      expect(res.isPassed).toBe(true);
      expect(res.passed).toBe(true);
      expect(xpService.addXP).toHaveBeenCalledWith(mockUser.id, 'QUIZ_COMPLETE');
      expect(xpService.awardBadge).toHaveBeenCalledWith(mockUser.id, 'QUIZ_MASTER');
    });
  });

  describe('submitSmartQuiz (Practice Quiz Grading Reliability)', () => {
    const mockQuestions = [
      {
        _id: 'sq1',
        text: 'Question 1',
        points: 10,
        options: [
          { _id: 'sopt1_1', text: 'Wrong', isCorrect: false },
          { _id: 'sopt1_2', text: 'Right', isCorrect: true }
        ]
      },
      {
        _id: 'sq2',
        text: 'Question 2',
        points: 10,
        options: [
          { _id: 'sopt2_1', text: 'Right', isCorrect: true },
          { _id: 'sopt2_2', text: 'Wrong', isCorrect: false }
        ]
      },
      {
        _id: 'sq3',
        text: 'Question 3',
        points: 10,
        options: [
          { _id: 'sopt3_1', text: 'Right', isCorrect: true },
          { _id: 'sopt3_2', text: 'Wrong', isCorrect: false }
        ]
      }
    ];

    beforeEach(() => {
      enrollmentRepository.findByStudentAndCourse.mockResolvedValue({
        student: mockUser.id,
        course: mockCourseId,
        paymentStatus: 'completed'
      });
      Question.find.mockResolvedValue(mockQuestions);
      Result.create.mockImplementation(data => Promise.resolve({ _id: 'smartRes123', ...data }));
    });

    it('should grade against all session questionIds even if user only answered 1 question', async () => {
      // Critical test: User had 3 questions, answered only 1 correctly and skipped 2
      const payload = {
        questionIds: ['sq1', 'sq2', 'sq3'],
        answers: [
          { questionId: 'sq1', selectedOptionId: 'sopt1_2' }
        ]
      };

      const res = await quizService.submitSmartQuiz(mockCourseId, payload, mockUser);

      // maxScore must be 30 (not 10!), score must be 10, percentage 33%, NOT passed (33% < 80%)
      expect(res.maxScore).toBe(30);
      expect(res.score).toBe(10);
      expect(res.scorePercentage).toBe(33);
      expect(res.isPassed).toBe(false);
      expect(res.passed).toBe(false);
      expect(res.totalQuestions).toBe(3);
      expect(res.correctCount).toBe(1);
      expect(res.wrongCount).toBe(2);
      expect(Result.create).toHaveBeenCalledWith(expect.objectContaining({
        type: 'practice',
        scorePercentage: 33,
        isPassed: false,
        totalQuestions: 3,
        correctCount: 1
      }));
    });
  });
});
