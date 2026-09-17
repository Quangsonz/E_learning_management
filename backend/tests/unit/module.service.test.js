const moduleService = require('../../src/services/module.service');
const moduleRepository = require('../../src/repositories/module.repository');
const courseRepository = require('../../src/repositories/course.repository');
const lessonRepository = require('../../src/repositories/lesson.repository');
const enrollmentRepository = require('../../src/repositories/enrollment.repository');
const AppError = require('../../src/utils/appError');

jest.mock('../../src/repositories/module.repository');
jest.mock('../../src/repositories/course.repository');
jest.mock('../../src/repositories/lesson.repository');
jest.mock('../../src/repositories/enrollment.repository');

describe('ModuleService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getModulesByCourse', () => {
    it('should return modules with lessons for a valid course', async () => {
      const mockCourse = { _id: 'c1', instructor: { _id: 't1' } };
      const mockModules = [
        {
          _id: 'm1',
          title: 'Chương 1',
          order: 1,
          lessons: [{ _id: 'l1', title: 'Bài 1', videoUrl: 'https://vid.mp4' }]
        }
      ];

      courseRepository.findById.mockResolvedValue(mockCourse);
      moduleRepository.findByCourseIdWithLessons.mockResolvedValue(mockModules);

      const result = await moduleService.getModulesByCourse('c1', { id: 't1', role: 'teacher' });
      expect(result).toHaveLength(1);
      expect(result[0].lessons[0].videoUrl).toBe('https://vid.mp4');
    });

    it('should strip video URLs for guests / non-enrolled students', async () => {
      const mockCourse = { _id: 'c1', instructor: { _id: 't1' } };
      const mockModules = [
        {
          _id: 'm1',
          title: 'Chương 1',
          order: 1,
          lessons: [{ _id: 'l1', title: 'Bài 1', videoUrl: 'https://vid.mp4' }]
        }
      ];

      courseRepository.findById.mockResolvedValue(mockCourse);
      enrollmentRepository.findByStudentAndCourse.mockResolvedValue(null);
      moduleRepository.findByCourseIdWithLessons.mockResolvedValue(mockModules);

      const result = await moduleService.getModulesByCourse('c1', { id: 's1', role: 'student' });
      expect(result[0].lessons[0].videoUrl).toBeUndefined();
    });

    it('should throw AppError if course does not exist', async () => {
      courseRepository.findById.mockResolvedValue(null);

      await expect(moduleService.getModulesByCourse('nonexistent', null))
        .rejects.toThrow(AppError);
    });
  });

  describe('createModule', () => {
    it('should allow course instructor to create a module', async () => {
      const mockCourse = { _id: 'c1', instructor: { _id: 't1' } };
      courseRepository.findById.mockResolvedValue(mockCourse);
      moduleRepository.findByCourseId.mockResolvedValue([]);
      moduleRepository.create.mockResolvedValue({ _id: 'm1', title: 'Chương mới', order: 1 });

      const result = await moduleService.createModule('c1', { title: 'Chương mới' }, { id: 't1', role: 'teacher' });
      expect(result._id).toBe('m1');
      expect(moduleRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        course: 'c1',
        title: 'Chương mới',
        order: 1
      }));
    });

    it('should reject non-owner teacher from creating a module', async () => {
      const mockCourse = { _id: 'c1', instructor: { _id: 't1' } };
      courseRepository.findById.mockResolvedValue(mockCourse);

      await expect(moduleService.createModule('c1', { title: 'Hack' }, { id: 't2', role: 'teacher' }))
        .rejects.toThrow(AppError);
    });
  });

  describe('deleteModule', () => {
    it('should reject deleting a module that contains lessons if cascade=false', async () => {
      const mockCourse = { _id: 'c1', instructor: { _id: 't1' } };
      courseRepository.findById.mockResolvedValue(mockCourse);
      moduleRepository.findOne.mockResolvedValue({ _id: 'm1', course: 'c1' });
      lessonRepository.countDocuments.mockResolvedValue(3);

      await expect(moduleService.deleteModule('m1', 'c1', false, { id: 't1', role: 'teacher' }))
        .rejects.toThrow(AppError);
    });

    it('should allow deleting a module if cascade=true even when it contains lessons', async () => {
      const mockCourse = { _id: 'c1', instructor: { _id: 't1' } };
      courseRepository.findById.mockResolvedValue(mockCourse);
      moduleRepository.findOne.mockResolvedValue({ _id: 'm1', course: 'c1' });
      lessonRepository.countDocuments.mockResolvedValue(3);
      moduleRepository.findOneAndDelete.mockResolvedValue({ _id: 'm1' });

      const result = await moduleService.deleteModule('m1', 'c1', true, { id: 't1', role: 'teacher' });
      expect(result).toEqual({ _id: 'm1' });
      expect(moduleRepository.findOneAndDelete).toHaveBeenCalledWith({ _id: 'm1', course: 'c1' });
    });
  });

  describe('reorderModules', () => {
    it('should bulk update module orders', async () => {
      const mockCourse = { _id: 'c1', instructor: { _id: 't1' } };
      courseRepository.findById.mockResolvedValue(mockCourse);
      moduleRepository.bulkWrite.mockResolvedValue({ modifiedCount: 2 });

      const result = await moduleService.reorderModules('c1', [{ id: 'm1', order: 2 }, { id: 'm2', order: 1 }], { id: 't1', role: 'teacher' });
      expect(result.message).toContain('thành công');
      expect(moduleRepository.bulkWrite).toHaveBeenCalledTimes(1);
    });
  });
});
