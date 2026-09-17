const mongoose = require('mongoose');
const User = require('../../src/models/User');
const Course = require('../../src/models/Course');
const Certificate = require('../../src/models/Certificate');
const authService = require('../../src/services/auth.service');
const enrollmentService = require('../../src/services/enrollment.service');
const courseService = require('../../src/services/course.service');
const xpService = require('../../src/services/xp.service');
const AppError = require('../../src/utils/appError');

describe('Security Audit Remediation Tests', () => {
  describe('1. Password Invalidation & Token Revocation', () => {
    it('should report changedPasswordAfter as true when token iat is before passwordChangedAt', async () => {
      const user = new User({
        name: 'Test Token',
        email: 'token@example.com',
        password: 'password123',
        passwordChangedAt: new Date(Date.now() - 5000) // Changed 5s ago
      });

      const tokenIatOlder = Math.floor((Date.now() - 10000) / 1000); // Issued 10s ago
      const tokenIatNewer = Math.floor((Date.now() + 1000) / 1000);

      expect(user.changedPasswordAfter(tokenIatOlder)).toBe(true);
      expect(user.changedPasswordAfter(tokenIatNewer)).toBe(false);
    });
  });

  describe('2. Account Suspension Protection', () => {
    it('should throw ACCOUNT_SUSPENDED 403 on login if user isActive is false', async () => {
      const user = await User.create({
        name: 'Suspended User',
        email: 'suspended@example.com',
        password: 'password123',
        isActive: false
      });

      const mockRes = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      await expect(
        authService.login('suspended@example.com', 'password123', mockRes)
      ).rejects.toMatchObject({
        statusCode: 403,
        errorCode: 'ACCOUNT_SUSPENDED'
      });
    });
  });

  describe('3. Paid Course Enrollment Bypass Prevention', () => {
    it('should block free enrollment on a course with price > 0 when isFromPayment is not true', async () => {
      const instructor = await User.create({
        name: 'Instructor One',
        email: 'inst1@example.com',
        password: 'password123',
        role: 'teacher'
      });

      const student = await User.create({
        name: 'Student One',
        email: 'stud1@example.com',
        password: 'password123',
        role: 'student'
      });

      const dummyCategory = new mongoose.Types.ObjectId();

      const paidCourse = await Course.create({
        title: 'Paid Advanced JavaScript',
        description: 'Detailed description for test course',
        category: dummyCategory,
        instructor: instructor._id,
        price: 500000,
        status: 'published'
      });

      // Attempt free enrollment on paid course without payment flag
      await expect(
        enrollmentService.enrollCourse(paidCourse._id.toString(), { id: student._id.toString() })
      ).rejects.toMatchObject({
        statusCode: 402
      });
    });
  });

  describe('4. Draft Course IDOR Protection', () => {
    it('should prevent non-owners and non-admins from viewing draft courses', async () => {
      const dummyCategory = new mongoose.Types.ObjectId();

      const instructor = await User.create({
        name: 'Instructor Draft',
        email: 'inst_draft@example.com',
        password: 'password123',
        role: 'teacher'
      });

      const draftCourse = await Course.create({
        title: 'Secret Draft Course',
        description: 'Secret draft course description',
        category: dummyCategory,
        instructor: instructor._id,
        price: 0,
        status: 'draft'
      });

      const outsiderUser = { id: new mongoose.Types.ObjectId().toString(), role: 'student' };

      // Anonymous access should throw 404
      await expect(
        courseService.getCourseById(draftCourse._id.toString(), null)
      ).rejects.toMatchObject({
        statusCode: 404
      });

      // Another user access should throw 404
      await expect(
        courseService.getCourseById(draftCourse._id.toString(), outsiderUser)
      ).rejects.toMatchObject({
        statusCode: 404
      });

      // Course owner should succeed
      const ownerAccess = await courseService.getCourseById(
        draftCourse._id.toString(),
        { id: instructor._id.toString(), role: 'teacher' }
      );
      expect(ownerAccess._id.toString()).toBe(draftCourse._id.toString());
    });
  });

  describe('5. XP Deduct Mechanism', () => {
    it('should correctly deduct XP and never drop below 0', async () => {
      const user = await User.create({
        name: 'XP Student',
        email: 'xpstudent@example.com',
        password: 'password123',
        xp: 20,
        level: 1
      });

      await xpService.deductXP(user._id, 15);
      let updatedUser = await User.findById(user._id);
      expect(updatedUser.xp).toBe(5);

      // Deducting more than available XP should clamp at 0
      await xpService.deductXP(user._id, 100);
      updatedUser = await User.findById(user._id);
      expect(updatedUser.xp).toBe(0);
    });
  });

  describe('6. Certificate Duplicate Prevention', () => {
    it('should reject duplicate certificates for the same student and course', async () => {
      const studentId = new mongoose.Types.ObjectId();
      const courseId = new mongoose.Types.ObjectId();

      await Certificate.create({
        student: studentId,
        course: courseId,
        certificateId: 'CERT-001'
      });

      // Attempt to create second certificate for the same student and course
      await expect(
        Certificate.create({
          student: studentId,
          course: courseId,
          certificateId: 'CERT-002'
        })
      ).rejects.toThrow();
    });
  });
});
