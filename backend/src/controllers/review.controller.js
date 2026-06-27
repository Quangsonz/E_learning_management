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
}

module.exports = new ReviewController();
