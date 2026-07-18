const reviewService = require('../services/review.service');
const catchAsync = require('../utils/catchAsync');

class ReviewController {
  createReview = catchAsync(async (req, res, next) => {
    const review = await reviewService.createReview(req.params.courseId, req.user._id, req.body);
    res.status(201).json({
      status: 'success',
      data: { review }
    });
  });

  getCourseReviews = catchAsync(async (req, res, next) => {
    const data = await reviewService.getCourseReviews(req.params.courseId, req.query);
    res.status(200).json({
      status: 'success',
      data
    });
  });

  replyToReview = catchAsync(async (req, res, next) => {
    const { replyText } = req.body;
    const review = await reviewService.replyToReview(req.params.id, req.user, replyText);
    res.status(200).json({
      status: 'success',
      data: { review }
    });
  });

  updateReview = catchAsync(async (req, res, next) => {
    const review = await reviewService.updateReview(req.params.id, req.user._id, req.body);
    res.status(200).json({
      status: 'success',
      data: { review }
    });
  });

  deleteReview = catchAsync(async (req, res, next) => {
    await reviewService.deleteReview(req.params.id, req.user._id);
    res.status(204).json({
      status: 'success',
      data: null
    });
  });
}


module.exports = new ReviewController();
