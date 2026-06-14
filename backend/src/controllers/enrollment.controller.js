const enrollmentService = require('../services/enrollment.service');
const catchAsync = require('../utils/catchAsync');

class EnrollmentController {
  enrollCourse = catchAsync(async (req, res, next) => {
    // Client gửi ID khóa học qua body
    const { courseId } = req.body;
    
    const enrollment = await enrollmentService.enrollCourse(courseId, req.user);

    res.status(201).json({
      status: 'success',
      data: {
        enrollment,
      },
    });
  });

  unenrollCourse = catchAsync(async (req, res, next) => {
    // Client truyền ID khóa học qua URL param
    const { courseId } = req.params;

    await enrollmentService.unenrollCourse(courseId, req.user);

    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

  getMyEnrollments = catchAsync(async (req, res, next) => {
    const enrollments = await enrollmentService.getMyEnrollments(req.user);

    res.status(200).json({
      status: 'success',
      results: enrollments.length,
      data: {
        enrollments,
      },
    });
  });
}

module.exports = new EnrollmentController();
