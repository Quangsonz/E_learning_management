const { getLocalizedText } = require('../../src/utils/localizedHelper');
const { removeVietnameseTones } = require('../../src/utils/pdfGenerator');
const lessonService = require('../../src/services/lesson.service');
const lessonRepository = require('../../src/repositories/lesson.repository');
const courseRepository = require('../../src/repositories/course.repository');
const lessonController = require('../../src/controllers/lesson.controller');
const AppError = require('../../src/utils/appError');

jest.mock('../../src/repositories/lesson.repository');
jest.mock('../../src/repositories/course.repository');
jest.mock('../../src/repositories/module.repository');
jest.mock('../../src/repositories/enrollment.repository');

describe('Phase 1 Remediations - Critical Bug Fixes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('F-04: getLocalizedText and Title Sanitization', () => {
    it('should return string as-is for normal string values', () => {
      expect(getLocalizedText('Khóa học Node.js')).toBe('Khóa học Node.js');
    });

    it('should return empty string for null or undefined', () => {
      expect(getLocalizedText(null)).toBe('');
      expect(getLocalizedText(undefined)).toBe('');
    });

    it('should parse and extract correct language from localized objects', () => {
      const localizedObj = { vi: 'Lập trình React.js', en: 'React.js Programming' };
      expect(getLocalizedText(localizedObj, 'vi')).toBe('Lập trình React.js');
      expect(getLocalizedText(localizedObj, 'en')).toBe('React.js Programming');
    });

    it('should fallback to Vietnamese if requested language is missing', () => {
      const localizedObj = { vi: 'Khóa học duy nhất' };
      expect(getLocalizedText(localizedObj, 'fr')).toBe('Khóa học duy nhất');
    });

    it('should parse serialized JSON strings containing localized titles', () => {
      const jsonStr = JSON.stringify({ vi: 'Khóa học JSON', en: 'JSON Course' });
      expect(getLocalizedText(jsonStr, 'vi')).toBe('Khóa học JSON');
    });

    it('should not produce "[object Object]" in removeVietnameseTones when given an object', () => {
      const localizedObj = { vi: 'Khóa học Đồ án Tốt nghiệp', en: 'Graduation Project Course' };
      const result = removeVietnameseTones(localizedObj);
      expect(result).not.toContain('[object Object]');
      expect(result).toBe('Khoa hoc Do an Tot nghiep');
    });
  });

  describe('F-01: lessonService.reorderLessons bulkWrite $set Operator', () => {
    it('should invoke bulkWrite with $set atomic operator', async () => {
      const mockCourse = { _id: 'course-123', instructor: { _id: 'teacher-1' } };
      courseRepository.findById.mockResolvedValue(mockCourse);
      lessonRepository.bulkWrite.mockResolvedValue({ modifiedCount: 2 });

      const orderedLessons = [
        { id: 'lesson-1', order: 1, moduleId: 'mod-1' },
        { id: 'lesson-2', order: 2, module: 'mod-1' }
      ];

      const result = await lessonService.reorderLessons('course-123', orderedLessons, { id: 'teacher-1', role: 'teacher' });
      expect(result.message).toContain('thành công');
      expect(lessonRepository.bulkWrite).toHaveBeenCalledTimes(1);

      // Verify that $set was strictly used
      expect(lessonRepository.bulkWrite).toHaveBeenCalledWith([
        {
          updateOne: {
            filter: { _id: 'lesson-1', course: 'course-123' },
            update: { $set: { order: 1, module: 'mod-1' } }
          }
        },
        {
          updateOne: {
            filter: { _id: 'lesson-2', course: 'course-123' },
            update: { $set: { order: 2, module: 'mod-1' } }
          }
        }
      ]);
    });
  });

  describe('F-02: lessonController.reorderLessons AppError handling', () => {
    it('should call next with AppError when lessons payload is invalid', async () => {
      const req = {
        params: { courseId: 'c1' },
        body: { lessons: 'invalid-non-array' },
        user: { id: 't1', role: 'teacher' }
      };
      const res = {};
      const next = jest.fn();

      await lessonController.reorderLessons(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const passedError = next.mock.calls[0][0];
      expect(passedError).toBeInstanceOf(AppError);
      expect(passedError.statusCode).toBe(400);
      expect(passedError.message).toBe('Invalid lessons data');
    });
  });
});
