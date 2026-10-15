const mongoose = require('mongoose');
const authMiddleware = require('../../src/middlewares/auth.middleware');
const { requireRole } = require('../../src/middlewares/roleMiddleware');
const courseService = require('../../src/services/course.service');
const moduleService = require('../../src/services/module.service');
const authService = require('../../src/services/auth.service');
const AppError = require('../../src/utils/appError');

// Mock Repositories & Models
jest.mock('../../src/repositories/user.repository');
jest.mock('../../src/repositories/course.repository');
jest.mock('../../src/repositories/module.repository');
jest.mock('../../src/repositories/enrollment.repository');
jest.mock('../../src/models/User');

const userRepository = require('../../src/repositories/user.repository');
const courseRepository = require('../../src/repositories/course.repository');
const moduleRepository = require('../../src/repositories/module.repository');
const enrollmentRepository = require('../../src/repositories/enrollment.repository');
const User = require('../../src/models/User');

describe('Phase 3 - RBAC, Security & Privilege Escalation Audit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    userRepository.findByEmail = jest.fn();
    userRepository.findById = jest.fn();
    courseRepository.findById = jest.fn();
    courseRepository.updateById = jest.fn();
    moduleRepository.findByCourseIdWithLessons = jest.fn();
    enrollmentRepository.findByStudentAndCourse = jest.fn();
    User.findById = jest.fn();
  });

  describe('1. Inactive & Suspended Account Enforcement', () => {
    it('should reject suspended user (isActive: false) with 403 in protect middleware', async () => {
      const jwt = require('jsonwebtoken');
      jest.spyOn(jwt, 'verify').mockImplementation((token, secret, cb) => {
        cb(null, { id: 'user_suspended_1' });
      });

      User.findById.mockResolvedValue({
        _id: 'user_suspended_1',
        isActive: false
      });

      const req = {
        headers: { authorization: 'Bearer mock_token_suspended' }
      };
      const res = {};
      const next = jest.fn();

      await authMiddleware.protect(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      const errorPassed = next.mock.calls[0][0];
      expect(errorPassed.statusCode).toBe(403);
      expect(errorPassed.message).toContain('tạm ngưng');
    });

    it('should reject login attempt for suspended account with 403 ACCOUNT_SUSPENDED', async () => {
      const mockUser = {
        _id: 'user_suspended_1',
        email: 'suspended@demo.com',
        password: 'hashed_password',
        isActive: false,
        correctPassword: jest.fn().mockResolvedValue(true)
      };

      userRepository.findByEmail.mockResolvedValue(mockUser);

      const res = {};
      await expect(authService.login('suspended@demo.com', 'ValidPass123!', res))
        .rejects.toThrow(AppError);

      try {
        await authService.login('suspended@demo.com', 'ValidPass123!', res);
      } catch (err) {
        expect(err.statusCode).toBe(403);
        expect(err.code).toBe('ACCOUNT_SUSPENDED');
      }
    });
  });

  describe('2. Role-Based Access Control (RBAC) Barrier', () => {
    it('should block student from accessing admin-only routes with 403', () => {
      const adminGuard = requireRole('admin');
      const req = {
        user: { id: 'student_1', role: 'student' }
      };
      const res = {};
      const next = jest.fn();

      adminGuard(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].statusCode).toBe(403);
    });

    it('should allow admin to access admin-only routes', () => {
      const adminGuard = requireRole('admin');
      const req = {
        user: { id: 'admin_1', role: 'admin' }
      };
      const res = {};
      const next = jest.fn();

      adminGuard(req, res, next);

      expect(next).toHaveBeenCalledWith(); // called next() without error
    });
  });

  describe('3. Cross-Instructor Privilege Escalation Prevention', () => {
    it('should prevent teacher from modifying another teacher\'s course with 403', async () => {
      const courseId = new mongoose.Types.ObjectId().toString();
      courseRepository.findById.mockResolvedValue({
        _id: courseId,
        instructor: new mongoose.Types.ObjectId('65e000000000000000000001'),
        status: 'draft'
      });

      const user = { id: '65e000000000000000000002', role: 'teacher' }; // different teacher

      await expect(courseService.updateCourse(courseId, { title: 'Hacked Title' }, user))
        .rejects.toThrow(AppError);

      try {
        await courseService.updateCourse(courseId, { title: 'Hacked Title' }, user);
      } catch (err) {
        expect(err.statusCode).toBe(403);
        expect(err.message).toContain('Bạn không có quyền chỉnh sửa khóa học của người khác');
      }
    });

    it('should prevent teacher from self-publishing course without admin approval', async () => {
      const teacherId = '65e000000000000000000001';
      const courseId = new mongoose.Types.ObjectId().toString();
      courseRepository.findById.mockResolvedValue({
        _id: courseId,
        instructor: { _id: teacherId },
        status: 'draft'
      });

      const user = { id: teacherId, role: 'teacher' };

      await expect(courseService.updateCourse(courseId, { status: 'published' }, user))
        .rejects.toThrow(AppError);

      try {
        await courseService.updateCourse(courseId, { status: 'published' }, user);
      } catch (err) {
        expect(err.statusCode).toBe(403);
        expect(err.message).toContain('Chỉ Admin mới có quyền duyệt và xuất bản khóa học');
      }
    });
  });

  describe('4. Content Redaction for Non-Enrolled Users', () => {
    it('should strip video URLs from non-enrolled students on locked lessons', async () => {
      const courseId = new mongoose.Types.ObjectId().toString();
      courseRepository.findById.mockResolvedValue({
        _id: courseId,
        instructor: { _id: 'teacher_1' }
      });

      enrollmentRepository.findByStudentAndCourse.mockResolvedValue(null); // Not enrolled

      moduleRepository.findByCourseIdWithLessons.mockResolvedValue([
        {
          _id: 'mod_1',
          title: 'Module 1',
          lessons: [
            {
              _id: 'lesson_free',
              title: 'Bài học thử',
              isFreePreview: true,
              videoUrl: 'https://cloudinary.com/video1.mp4'
            },
            {
              _id: 'lesson_locked',
              title: 'Bài học nâng cao',
              isFreePreview: false,
              videoUrl: 'https://cloudinary.com/video2.mp4',
              videoPublicId: 'pub_id_2'
            }
          ]
        }
      ]);

      const studentUser = { id: 'student_guest', role: 'student' };
      const modules = await moduleService.getModulesByCourse(courseId, studentUser);

      const lessons = modules[0].lessons;
      // Free preview lesson keeps videoUrl
      expect(lessons[0].videoUrl).toBe('https://cloudinary.com/video1.mp4');
      // Locked lesson has videoUrl stripped
      expect(lessons[1].videoUrl).toBeUndefined();
      expect(lessons[1].videoPublicId).toBeUndefined();
    });
  });
});
