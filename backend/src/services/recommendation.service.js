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
      { $lookup: { from: 'categories', localField: 'course.category', foreignField: '_id', as: 'category' } },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: '$course._id',
          title: '$course.title',
          thumbnailUrl: '$course.thumbnailUrl',
          price: '$course.price',
          estimatedPrice: '$course.estimatedPrice',
          discountPercentage: '$course.discountPercentage',
          averageRating: '$course.averageRating',
          category: { _id: '$category._id', name: '$category.name', slug: '$category.slug' },
          instructor: { _id: '$instructor._id', name: '$instructor.name', avatar: '$instructor.avatar' }
        }
      }
    ]);

    // 2. Fallback: Highly rated courses
    const highestRated = await Course.find({ status: 'published' })
      .sort({ averageRating: -1 })
      .limit(4)
      .populate('instructor', 'name avatar')
      .populate('category', 'name slug');

    // 3. Recommended for you (For MVP: we just return random published courses)
    const recommended = await Course.aggregate([
      { $match: { status: 'published' } },
      { $sample: { size: 4 } },
      { $lookup: { from: 'users', localField: 'instructor', foreignField: '_id', as: 'instructorInfo' } },
      { $unwind: '$instructorInfo' },
      { $lookup: { from: 'categories', localField: 'category', foreignField: '_id', as: 'categoryInfo' } },
      { $unwind: { path: '$categoryInfo', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          title: 1,
          thumbnailUrl: 1,
          price: 1,
          estimatedPrice: 1,
          discountPercentage: 1,
          averageRating: 1,
          category: { _id: '$categoryInfo._id', name: '$categoryInfo.name', slug: '$categoryInfo.slug' },
          instructor: { _id: '$instructorInfo._id', name: '$instructorInfo.name', avatar: '$instructorInfo.avatar' }
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
