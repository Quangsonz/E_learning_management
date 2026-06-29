const reviewRepository = require('../repositories/review.repository');
const enrollmentRepository = require('../repositories/enrollment.repository');
const courseRepository = require('../repositories/course.repository');
const AppError = require('../utils/appError');
const mongoose = require('mongoose');

class ReviewService {
  async createReview(courseId, studentId, data) {
    // 1. Kiểm tra xem học viên đã mua khóa học này chưa
    const isEnrolled = await enrollmentRepository.findByStudentAndCourse(studentId, courseId);
    if (!isEnrolled) {
      throw new AppError('Bạn phải đăng ký và thanh toán khóa học này mới có thể đánh giá.', 403);
    }

    // 2. Kiểm tra xem học viên đã đánh giá chưa
    const existingReview = await reviewRepository.findByStudentAndCourse(studentId, courseId);
    if (existingReview) {
      throw new AppError('Bạn đã đánh giá khóa học này rồi.', 400);
    }

    // 3. Tạo đánh giá
    const reviewData = {
      student: studentId,
      course: courseId,
      rating: data.rating,
      comment: data.comment
    };

    const newReview = await reviewRepository.create(reviewData);

    // 4. Cập nhật lại averageRating cho khóa học
    await this.updateCourseAverageRating(courseId);

    return newReview;
  }

  async getCourseReviews(courseId, query = {}) {
    const options = {
      limit: parseInt(query.limit) || 10,
      skip: parseInt(query.skip) || 0,
      sort: query.sort ? { [query.sort]: -1 } : { createdAt: -1 }
    };

    const reviews = await reviewRepository.findByCourse(courseId, options);
    
    // Đảm bảo cast đúng sang ObjectId trước khi đưa vào aggregate
    const courseObjId = mongoose.Types.ObjectId.isValid(courseId) ? new mongoose.Types.ObjectId(courseId) : courseId;
    const { averageRating, numReviews } = await reviewRepository.getAverageRating(courseObjId);

    return { reviews, averageRating, numReviews };
  }

  async updateCourseAverageRating(courseId) {
    const courseObjId = mongoose.Types.ObjectId.isValid(courseId) ? new mongoose.Types.ObjectId(courseId) : courseId;
    const stats = await reviewRepository.getAverageRating(courseObjId);
    await courseRepository.update(courseId, { 
      averageRating: stats.averageRating 
    });
  }

  async replyToReview(reviewId, user, replyText) {
    const review = await reviewRepository.findById(reviewId);
    if (!review) throw new AppError('Review not found', 404);

    const course = await courseRepository.findById(review.course);
    if (!course) throw new AppError('Course not found', 404);

    if (user.role !== 'admin' && course.instructor.toString() !== user.id) {
      throw new AppError('Only the course instructor can reply to reviews', 403);
    }

    review.instructorReply = replyText;
    await review.save();
    return review;
  }
}

module.exports = new ReviewService();
