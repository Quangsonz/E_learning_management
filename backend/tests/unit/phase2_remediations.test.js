const mongoose = require('mongoose');
const progressService = require('../../src/services/progress.service');
const userController = require('../../src/controllers/user.controller');
const enrollmentService = require('../../src/services/enrollment.service');

// Mock Repositories & Models
jest.mock('../../src/repositories/progress.repository', () => ({
  findByStudentAndCourse: jest.fn(),
  create: jest.fn(),
}));
jest.mock('../../src/repositories/lesson.repository', () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  findById: jest.fn(),
}));
jest.mock('../../src/repositories/course.repository', () => ({
  findById: jest.fn(),
}));
jest.mock('../../src/repositories/enrollment.repository', () => ({
  findByStudentAndCourse: jest.fn(),
  create: jest.fn(),
}));
jest.mock('../../src/repositories/user.repository', () => ({
  findById: jest.fn(),
  getTopUsersByXP: jest.fn(),
}));
jest.mock('../../src/repositories/certificate.repository', () => ({
  findByStudentAndCourse: jest.fn(),
  findByCertificateId: jest.fn(),
  create: jest.fn(),
}));
jest.mock('../../src/models/Course', () => ({
  findById: jest.fn(),
}));
jest.mock('../../src/models/Order', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
}));
jest.mock('../../src/models/User', () => ({
  findById: jest.fn(),
}));
jest.mock('../../src/services/xp.service', () => ({
  addXP: jest.fn().mockResolvedValue(true),
  awardBadge: jest.fn().mockResolvedValue(true),
}));
jest.mock('../../src/services/notification.service', () => ({
  createNotification: jest.fn().mockResolvedValue(true),
}));

const progressRepository = require('../../src/repositories/progress.repository');
const lessonRepository = require('../../src/repositories/lesson.repository');
const courseRepository = require('../../src/repositories/course.repository');
const enrollmentRepository = require('../../src/repositories/enrollment.repository');
const userRepository = require('../../src/repositories/user.repository');
const Course = require('../../src/models/Course');
const User = require('../../src/models/User');

describe('Phase 2 Business Logic Remediations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ProgressService - Lesson Completion & Clamping', () => {
    it('should clamp progressPercentage to 100 when completedLessons count exceeds active lessons', async () => {
      const courseId = new mongoose.Types.ObjectId().toString();
      const lessonId1 = new mongoose.Types.ObjectId();
      const lessonId2 = new mongoose.Types.ObjectId();
      const orphanLessonId = new mongoose.Types.ObjectId();

      courseRepository.findById.mockResolvedValue({ _id: courseId, title: 'Node Course' });
      lessonRepository.findOne.mockResolvedValue({ _id: lessonId2, course: courseId });
      enrollmentRepository.findByStudentAndCourse.mockResolvedValue({ paymentStatus: 'completed' });

      // Only lessonId1 and lessonId2 currently exist in DB
      lessonRepository.find.mockResolvedValue([
        { _id: lessonId1 },
        { _id: lessonId2 }
      ]);

      const mockProgress = {
        student: 'user123',
        course: courseId,
        completedLessons: [lessonId1, orphanLessonId], // contains orphan lesson
        progressPercentage: 50,
        save: jest.fn().mockResolvedValue(true)
      };

      progressRepository.findByStudentAndCourse.mockResolvedValue(mockProgress);

      const result = await progressService.markLessonComplete(courseId, lessonId2.toString(), { id: 'user123', role: 'student' });

      // Orphan lesson should be filtered out, leaving [lessonId1, lessonId2]
      expect(result.completedLessons.map(l => l.toString())).toEqual([lessonId1.toString(), lessonId2.toString()]);
      expect(result.progressPercentage).toBe(100);
      expect(result.isCompleted).toBe(true);
      expect(result.lastStudiedAt).toBeInstanceOf(Date);
      expect(mockProgress.save).toHaveBeenCalled();
    });

    it('should not duplicate completedLessons if lesson is already marked complete', async () => {
      const courseId = new mongoose.Types.ObjectId().toString();
      const lessonId = new mongoose.Types.ObjectId();

      courseRepository.findById.mockResolvedValue({ _id: courseId });
      lessonRepository.findOne.mockResolvedValue({ _id: lessonId, course: courseId });
      enrollmentRepository.findByStudentAndCourse.mockResolvedValue({ paymentStatus: 'completed' });
      lessonRepository.find.mockResolvedValue([{ _id: lessonId }]);

      const mockProgress = {
        student: 'user123',
        course: courseId,
        completedLessons: [lessonId],
        progressPercentage: 100,
        save: jest.fn().mockResolvedValue(true)
      };

      progressRepository.findByStudentAndCourse.mockResolvedValue(mockProgress);

      const result = await progressService.markLessonComplete(courseId, lessonId.toString(), { id: 'user123', role: 'student' });

      expect(result.completedLessons.length).toBe(1);
      expect(result.progressPercentage).toBe(100);
    });
  });

  describe('UserController - Wishlist ObjectId vs String handling', () => {
    it('should correctly remove course from wishlist when wishlist has ObjectIds and request sends String ID', async () => {
      const courseIdObj = new mongoose.Types.ObjectId();
      const courseIdStr = courseIdObj.toString();

      const mockUser = {
        _id: 'user123',
        wishlist: [courseIdObj],
        save: jest.fn().mockResolvedValue(true)
      };

      userRepository.findById.mockResolvedValue(mockUser);

      const req = {
        user: { id: 'user123' },
        body: { courseId: courseIdStr }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      await userController.toggleWishlist(req, res, next);

      expect(mockUser.wishlist.length).toBe(0);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        status: 'success',
        data: expect.objectContaining({ isAdded: false })
      }));
    });

    it('should correctly add course to wishlist when not present and course exists', async () => {
      const courseIdStr = new mongoose.Types.ObjectId().toString();

      const mockUser = {
        _id: 'user123',
        wishlist: [],
        save: jest.fn().mockResolvedValue(true)
      };

      userRepository.findById.mockResolvedValue(mockUser);
      Course.findById.mockResolvedValue({ _id: courseIdStr, title: 'Sample Course' });

      const req = {
        user: { id: 'user123' },
        body: { courseId: courseIdStr }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      await userController.toggleWishlist(req, res, next);

      expect(mockUser.wishlist).toContain(courseIdStr);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        status: 'success',
        data: expect.objectContaining({ isAdded: true })
      }));
    });

    it('should return clean wishlist filtering out null items', async () => {
      const courseObj = { _id: new mongoose.Types.ObjectId(), title: 'Valid Course' };
      const mockUser = {
        wishlist: [courseObj, null] // null reference
      };

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockUser)
      };

      User.findById.mockReturnValue(mockQuery);

      const req = { user: { id: 'user123' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      await userController.getWishlist(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: {
          wishlist: [courseObj]
        }
      });
    });
  });

  describe('EnrollmentService - Idempotent Progress Creation', () => {
    it('should not throw error if progress record already exists upon enrollment', async () => {
      const courseId = new mongoose.Types.ObjectId().toString();
      courseRepository.findById.mockResolvedValue({ _id: courseId, price: 0 });
      enrollmentRepository.findByStudentAndCourse.mockResolvedValue(null);
      enrollmentRepository.create.mockResolvedValue({ _id: 'enroll123' });

      // Progress already exists
      progressRepository.findByStudentAndCourse.mockResolvedValue({
        _id: 'progress123',
        progressPercentage: 0
      });

      const result = await enrollmentService.enrollCourse(courseId, { id: 'user123' });

      expect(result).toBeDefined();
      expect(progressRepository.create).not.toHaveBeenCalled();
    });
  });
});
