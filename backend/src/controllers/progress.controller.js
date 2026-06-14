const progressService = require('../services/progress.service');
const catchAsync = require('../utils/catchAsync');

class ProgressController {
  markComplete = catchAsync(async (req, res, next) => {
    const { courseId, lessonId } = req.params;

    const progress = await progressService.markLessonComplete(courseId, lessonId, req.user);

    res.status(200).json({
      status: 'success',
      data: {
        progress,
      },
    });
  });

  getCourseProgress = catchAsync(async (req, res, next) => {
    const { courseId } = req.params;

    const progress = await progressService.getCourseProgress(courseId, req.user);

    res.status(200).json({
      status: 'success',
      data: {
        progress,
      },
    });
  });

  getLearningStatistics = catchAsync(async (req, res, next) => {
    const statistics = await progressService.getLearningStatistics(req.user);

    res.status(200).json({
      status: 'success',
      data: {
        statistics,
      },
    });
  });
}

module.exports = new ProgressController();
