const courseService = require('../../src/services/course.service');
const courseRepository = require('../../src/repositories/course.repository');
const AppError = require('../../src/utils/appError');

jest.mock('../../src/repositories/course.repository');

describe('CourseService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCourseById', () => {
    it('should return course details when valid ID is provided', async () => {
      const mockCourse = { _id: 'c1', title: 'React Mastery', status: 'published' };
      courseRepository.findById.mockResolvedValue(mockCourse);

      const result = await courseService.getCourseById('c1');
      expect(result).toEqual(mockCourse);
      expect(courseRepository.findById).toHaveBeenCalledWith('c1');
    });

    it('should throw AppError if course does not exist', async () => {
      courseRepository.findById.mockResolvedValue(null);

      await expect(courseService.getCourseById('c999'))
        .rejects.toThrow(AppError);
    });
  });

  describe('getAllCourses', () => {
    it('should return paginated course list', async () => {
      const mockData = [{ _id: 'c1', title: 'Node.js' }];
      courseRepository.findPaginatedWithStats.mockResolvedValue({ total: 1, data: mockData });

      const result = await courseService.getAllCourses({}, { role: 'admin' });
      expect(result.courses).toEqual(mockData);
      expect(result.total).toBe(1);
      expect(courseRepository.findPaginatedWithStats).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateCourse', () => {
    it('should respect explicitly provided selling price when updating course', async () => {
      const mockCourse = {
        _id: 'c1',
        title: 'React Mastery',
        price: 1290000,
        estimatedPrice: 1677000,
        discountPercentage: 20,
        instructor: { _id: { toString: () => 'teacher1' } }
      };
      courseRepository.findById.mockResolvedValue(mockCourse);
      courseRepository.updateById.mockImplementation((id, data) => Promise.resolve({ ...mockCourse, ...data }));

      // Admin updates selling price to 200,000 without sending discount
      const updated = await courseService.updateCourse('c1', { price: 200000 }, { id: 'admin1', role: 'admin' });
      expect(updated.price).toBe(200000);
      expect(courseRepository.updateById).toHaveBeenCalledWith('c1', expect.objectContaining({ price: 200000 }));
    });

    it('should compute price from estimatedPrice and discountPercentage if price is omitted', async () => {
      const mockCourse = {
        _id: 'c1',
        title: 'React Mastery',
        price: 1290000,
        estimatedPrice: 1677000,
        discountPercentage: 20,
        instructor: { _id: { toString: () => 'teacher1' } }
      };
      courseRepository.findById.mockResolvedValue(mockCourse);
      courseRepository.updateById.mockImplementation((id, data) => Promise.resolve({ ...mockCourse, ...data }));

      const updated = await courseService.updateCourse('c1', { estimatedPrice: 2000000, discountPercentage: 50 }, { id: 'admin1', role: 'admin' });
      expect(updated.price).toBe(1000000);
    });
  });

  describe('deleteCourse', () => {
    it('should throw error if non-owner teacher tries to delete', async () => {
      const mockCourse = { _id: 'c1', instructor: { _id: { toString: () => 'teacher1' } } };
      courseRepository.findById.mockResolvedValue(mockCourse);

      await expect(courseService.deleteCourse('c1', { id: 'teacher2', role: 'teacher' }))
        .rejects.toThrow(AppError);
    });

    it('should allow admin to delete any course', async () => {
      const mockCourse = { _id: 'c1', instructor: { _id: { toString: () => 'teacher1' } } };
      courseRepository.findById.mockResolvedValue(mockCourse);
      courseRepository.deleteById.mockResolvedValue(mockCourse);

      const result = await courseService.deleteCourse('c1', { id: 'adminId', role: 'admin' });
      expect(result).toEqual(mockCourse);
    });
  });
});
