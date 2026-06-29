const lessonService = require('../services/lesson.service');
const catchAsync = require('../utils/catchAsync');

class LessonController {
  getLessons = catchAsync(async (req, res, next) => {
    // req.params.courseId có từ nested route
    const lessons = await lessonService.getLessonsByCourse(req.params.courseId, req.user);

    res.status(200).json({
      status: 'success',
      results: lessons.length,
      data: {
        lessons,
      },
    });
  });

  getLesson = catchAsync(async (req, res, next) => {
    const lesson = await lessonService.getLessonById(req.params.id, req.params.courseId, req.user);

    res.status(200).json({
      status: 'success',
      data: {
        lesson,
      },
    });
  });

  createLesson = catchAsync(async (req, res, next) => {
    const newLesson = await lessonService.createLesson(req.params.courseId, req.body, req.user);

    res.status(201).json({
      status: 'success',
      data: {
        lesson: newLesson,
      },
    });
  });

  updateLesson = catchAsync(async (req, res, next) => {
    const updatedLesson = await lessonService.updateLesson(req.params.id, req.params.courseId, req.body, req.user);

    res.status(200).json({
      status: 'success',
      data: {
        lesson: updatedLesson,
      },
    });
  });

  deleteLesson = catchAsync(async (req, res, next) => {
    await lessonService.deleteLesson(req.params.id, req.params.courseId, req.user);

    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

  reorderLessons = catchAsync(async (req, res, next) => {
    // req.body should be { lessons: [{ id, order }, ...] }
    const { lessons } = req.body;
    if (!lessons || !Array.isArray(lessons)) {
      return next(new AppError('Invalid lessons data', 400));
    }

    const result = await lessonService.reorderLessons(req.params.courseId, lessons, req.user);

    res.status(200).json({
      status: 'success',
      message: result.message,
    });
  });
}

module.exports = new LessonController();
