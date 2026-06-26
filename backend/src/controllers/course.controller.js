const courseService = require('../services/course.service');
const catchAsync = require('../utils/catchAsync');

class CourseController {
  getAllCourses = catchAsync(async (req, res, next) => {
    // Truyền user object nếu đã đăng nhập để service phân tích quyền lấy Draft/Published
    const user = req.user || null;
    
    let query = { ...req.query };
    // Nếu client request route lấy khóa học của tôi (My Courses)
    if (req.route.path === '/my-courses' && user) {
      query.instructor = user.id;
    }

    const result = await courseService.getAllCourses(query, user);

    res.status(200).json({
      status: 'success',
      results: result.courses.length,
      data: {
        courses: result.courses,
        total: result.total,
        page: result.page,
        totalPages: result.totalPages
      },
    });
  });

  getCourse = catchAsync(async (req, res, next) => {
    const course = await courseService.getCourseById(req.params.id);

    res.status(200).json({
      status: 'success',
      data: {
        course,
      },
    });
  });

  createCourse = catchAsync(async (req, res, next) => {
    const newCourse = await courseService.createCourse(req.body, req.user);

    res.status(201).json({
      status: 'success',
      data: {
        course: newCourse,
      },
    });
  });

  updateCourse = catchAsync(async (req, res, next) => {
    const updatedCourse = await courseService.updateCourse(req.params.id, req.body, req.user);

    res.status(200).json({
      status: 'success',
      data: {
        course: updatedCourse,
      },
    });
  });

  deleteCourse = catchAsync(async (req, res, next) => {
    await courseService.deleteCourse(req.params.id, req.user);

    res.status(204).json({
      status: 'success',
      data: null,
    });
  });
}

module.exports = new CourseController();
