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
    const lesson = await lessonService.getLessonById(req.params.id, req.params.courseId);

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
}

module.exports = new LessonController();
