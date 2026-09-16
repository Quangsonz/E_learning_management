const searchRepository = require('../repositories/search.repository');

class SearchService {
  /**
   * Performs unified global search across permitted entities based on user role
   * @param {Object} params - { q, type, limit }
   * @param {Object|null} user - Authenticated user or null
   */
  async globalSearch(params = {}, user = null) {
    const q = (params.q || '').trim();
    if (!q) {
      return {
        results: {
          courses: [],
          lessons: [],
          categories: [],
          instructors: [],
          users: [],
          orders: [],
          applications: []
        },
        totalResults: 0
      };
    }

    const type = (params.type || 'all').toLowerCase();
    const limit = parseInt(params.limit, 10) || 6;
    const userRole = user ? user.role : 'guest';

    const searchTasks = {};

    // 1. Courses (All roles have access, filtered by status in repository)
    if (type === 'all' || type === 'courses') {
      searchTasks.courses = searchRepository.searchCourses(q, user, limit);
    }

    // 2. Lessons (All roles have access, filtered by course access in repository)
    if (type === 'all' || type === 'lessons') {
      searchTasks.lessons = searchRepository.searchLessons(q, user, limit);
    }

    // 3. Categories (Public / all roles)
    if (type === 'all' || type === 'categories') {
      searchTasks.categories = searchRepository.searchCategories(q, limit);
    }

    // 4. Instructors (Public / Students)
    if (type === 'all' || type === 'instructors') {
      searchTasks.instructors = searchRepository.searchInstructors(q, limit);
    }

    // 5. Users (Teacher / Admin only)
    if (userRole === 'admin' || userRole === 'teacher') {
      if (type === 'all' || type === 'users') {
        searchTasks.users = searchRepository.searchUsers(q, user, limit);
      }
    }

    // 6. Orders (Admin only)
    if (userRole === 'admin') {
      if (type === 'all' || type === 'orders') {
        searchTasks.orders = searchRepository.searchOrders(q, user, limit);
      }
    }

    // 7. Teacher Applications (Admin only)
    if (userRole === 'admin') {
      if (type === 'all' || type === 'applications') {
        searchTasks.applications = searchRepository.searchTeacherApplications(q, user, limit);
      }
    }

    const taskKeys = Object.keys(searchTasks);
    const taskPromises = Object.values(searchTasks);
    const settledResults = await Promise.all(taskPromises);

    const results = {
      courses: [],
      lessons: [],
      categories: [],
      instructors: [],
      users: [],
      orders: [],
      applications: []
    };

    let totalResults = 0;
    taskKeys.forEach((key, index) => {
      const data = settledResults[index] || [];
      results[key] = data;
      totalResults += data.length;
    });

    return {
      query: q,
      results,
      totalResults
    };
  }
}

module.exports = new SearchService();
