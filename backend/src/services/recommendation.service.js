const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');

class RecommendationService {
  async getRecommendations(userId) {
    // 1. Trending courses (Top enrolled recently)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const trending = await Enrollment.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: '$course', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 4 },
      { $lookup: { from: 'courses', localField: '_id', foreignField: '_id', as: 'course' } },
      { $unwind: '$course' },
      { $match: { 'course.status': 'published' } },
      { $lookup: { from: 'users', localField: 'course.instructor', foreignField: '_id', as: 'instructor' } },
      { $unwind: '$instructor' },
      {
        $project: {
          _id: '$course._id',
          title: '$course.title',
          thumbnail: '$course.thumbnailUrl',
          price: '$course.price',
          averageRating: '$course.averageRating',
          instructor: { _id: '$instructor._id', name: '$instructor.name' }
        }
      }
    ]);

    // 2. Fallback: Highly rated courses
    const highestRated = await Course.find({ status: 'published' })
      .sort({ averageRating: -1 })
      .limit(4)
      .populate('instructor', 'name avatar');

    // 3. Recommended for you (For MVP: we just return random published courses)
    // A real engine would use user.preferences or collaborative filtering
    const recommended = await Course.aggregate([
      { $match: { status: 'published' } },
      { $sample: { size: 4 } },
      { $lookup: { from: 'users', localField: 'instructor', foreignField: '_id', as: 'instructorInfo' } },
      { $unwind: '$instructorInfo' },
      {
        $project: {
          _id: 1,
          title: 1,
          thumbnailUrl: 1,
          price: 1,
          averageRating: 1,
          instructor: { _id: '$instructorInfo._id', name: '$instructorInfo.name' }
        }
      }
    ]);

    return {
      trending: trending.length > 0 ? trending : highestRated,
      recommended: recommended
    };
  }
}

module.exports = new RecommendationService();
