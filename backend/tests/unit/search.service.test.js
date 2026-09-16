const searchService = require('../../src/services/search.service');
const searchRepository = require('../../src/repositories/search.repository');

jest.mock('../../src/repositories/search.repository');

describe('SearchService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('globalSearch - Empty query', () => {
    it('should return empty results if query is empty or whitespace', async () => {
      const result = await searchService.globalSearch({ q: '   ' }, null);
      expect(result.totalResults).toBe(0);
      expect(result.results.courses).toEqual([]);
      expect(searchRepository.searchCourses).not.toHaveBeenCalled();
    });
  });

  describe('globalSearch - Role-Based Security Boundaries', () => {
    it('should allow student to search courses, lessons, categories, instructors but block admin entities', async () => {
      searchRepository.searchCourses.mockResolvedValue([{ _id: 'c1', title: 'React' }]);
      searchRepository.searchLessons.mockResolvedValue([{ _id: 'l1', title: 'Intro' }]);
      searchRepository.searchCategories.mockResolvedValue([{ _id: 'cat1', name: 'Web' }]);
      searchRepository.searchInstructors.mockResolvedValue([{ _id: 'inst1', name: 'Teacher A' }]);

      const studentUser = { id: 's1', role: 'student' };
      const result = await searchService.globalSearch({ q: 'react' }, studentUser);

      expect(result.totalResults).toBe(4);
      expect(result.results.courses).toHaveLength(1);
      expect(result.results.lessons).toHaveLength(1);
      expect(result.results.categories).toHaveLength(1);
      expect(result.results.instructors).toHaveLength(1);

      // Student must NOT access users, orders, or teacher applications
      expect(result.results.users).toEqual([]);
      expect(result.results.orders).toEqual([]);
      expect(result.results.applications).toEqual([]);
      expect(searchRepository.searchUsers).not.toHaveBeenCalled();
      expect(searchRepository.searchOrders).not.toHaveBeenCalled();
      expect(searchRepository.searchTeacherApplications).not.toHaveBeenCalled();
    });

    it('should allow admin to search all entities including users, orders, applications', async () => {
      searchRepository.searchCourses.mockResolvedValue([{ _id: 'c1' }]);
      searchRepository.searchLessons.mockResolvedValue([]);
      searchRepository.searchCategories.mockResolvedValue([]);
      searchRepository.searchInstructors.mockResolvedValue([]);
      searchRepository.searchUsers.mockResolvedValue([{ _id: 'u1', name: 'User 1' }]);
      searchRepository.searchOrders.mockResolvedValue([{ _id: 'o1', amount: 500000 }]);
      searchRepository.searchTeacherApplications.mockResolvedValue([{ _id: 'a1', specialty: 'AI' }]);

      const adminUser = { id: 'adm1', role: 'admin' };
      const result = await searchService.globalSearch({ q: 'test' }, adminUser);

      expect(searchRepository.searchUsers).toHaveBeenCalledWith('test', adminUser, 6);
      expect(searchRepository.searchOrders).toHaveBeenCalledWith('test', adminUser, 6);
      expect(searchRepository.searchTeacherApplications).toHaveBeenCalledWith('test', adminUser, 6);
      expect(result.results.users).toHaveLength(1);
      expect(result.results.orders).toHaveLength(1);
      expect(result.results.applications).toHaveLength(1);
    });

    it('should filter by specific entity type when type param is specified', async () => {
      searchRepository.searchCourses.mockResolvedValue([{ _id: 'c1', title: 'React' }]);

      const result = await searchService.globalSearch({ q: 'react', type: 'courses' }, null);

      expect(searchRepository.searchCourses).toHaveBeenCalled();
      expect(searchRepository.searchLessons).not.toHaveBeenCalled();
      expect(searchRepository.searchCategories).not.toHaveBeenCalled();
      expect(result.results.courses).toHaveLength(1);
      expect(result.results.lessons).toHaveLength(0);
    });
  });
});
