const BaseRepository = require('./base.repository');
const Review = require('../models/Review');

class ReviewRepository extends BaseRepository {
  constructor() {
    super(Review);
  }

  async findByCourse(courseId, options = {}) {
    const query = { course: courseId };
    
    let result = this.model.find(query).populate('student', 'name email avatar');
    
    if (options.sort) {
      result = result.sort(options.sort);
    } else {
      result = result.sort({ createdAt: -1 }); // Default sort by newest
    }

    if (options.limit) {
      result = result.limit(options.limit);
    }

    if (options.skip) {
      result = result.skip(options.skip);
    }

    return await result.exec();
  }

  async findByStudentAndCourse(studentId, courseId) {
    return await this.model.findOne({ student: studentId, course: courseId }).exec();
  }

  async getAverageRating(courseId) {
    const result = await this.model.aggregate([
      { $match: { course: courseId } },
      { $group: { _id: '$course', avgRating: { $avg: '$rating' }, numReviews: { $sum: 1 } } }
    ]);
    
    if (result.length > 0) {
      return {
        averageRating: Math.round(result[0].avgRating * 10) / 10,
        numReviews: result[0].numReviews
      };
    }
    return { averageRating: 0, numReviews: 0 };
  }
}

module.exports = new ReviewRepository();
