const BaseRepository = require('./base.repository');
const Course = require('../models/Course');
const mongoose = require('mongoose');

class CourseRepository extends BaseRepository {
  constructor() {
    super(Course);
  }

  async findBySlug(slug) {
    return await this.model.findOne({ slug });
  }

  // Override hàm find để tự động populate category và instructor nếu cần
  async find(query = {}) {
    return await this.model.find(query).populate('category', 'name slug').populate('instructor', 'name avatar');
  }

  async findPaginated(query = {}, skip = 0, limit = 10, sortStr = '-createdAt') {
    const total = await this.model.countDocuments(query);
    const data = await this.model.find(query)
      .populate('category', 'name slug')
      .populate('instructor', 'name avatar')
      .skip(skip)
      .limit(limit)
      .sort(sortStr);
    return { total, data };
  }

  /**
   * Phiên bản tối ưu của findPaginated: đếm lessons và students trong 1 aggregation
   * thay vì N+1 queries riêng lẻ cho từng khóa học.
   */
  async findPaginatedWithStats(query = {}, skip = 0, limit = 10, sortStr = '-createdAt') {
    const total = await this.model.countDocuments(query);

    // Chuyển sortStr (e.g. '-createdAt') sang MongoDB sort object
    const sortObj = {};
    const sortField = sortStr.startsWith('-') ? sortStr.slice(1) : sortStr;
    sortObj[sortField] = sortStr.startsWith('-') ? -1 : 1;

    const data = await this.model.aggregate([
      { $match: query },
      { $sort: sortObj },
      { $skip: skip },
      { $limit: limit },
      // JOIN category để lấy tên và slug
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'category',
          pipeline: [{ $project: { name: 1, slug: 1 } }]
        }
      },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
      // JOIN instructor để lấy tên và avatar
      {
        $lookup: {
          from: 'users',
          localField: 'instructor',
          foreignField: '_id',
          as: 'instructor',
          pipeline: [{ $project: { name: 1, avatar: 1 } }]
        }
      },
      { $unwind: { path: '$instructor', preserveNullAndEmptyArrays: true } },
      // Đếm số bài giảng thuộc khóa học
      {
        $lookup: {
          from: 'lessons',
          localField: '_id',
          foreignField: 'course',
          as: '_lessons'
        }
      },
      // Đếm số học viên đã thanh toán xong
      {
        $lookup: {
          from: 'enrollments',
          let: { courseId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$course', '$$courseId'] },
                    { $eq: ['$paymentStatus', 'completed'] }
                  ]
                }
              }
            }
          ],
          as: '_enrollments'
        }
      },
      {
        $addFields: {
          lessonsCount: { $size: '$_lessons' },
          studentsCount: { $size: '$_enrollments' }
        }
      },
      // Loại bỏ các field trung gian không cần trả về
      { $project: { _lessons: 0, _enrollments: 0 } }
    ]);

    return { total, data };
  }

  async findById(id) {
    return await this.model.findById(id).populate('category', 'name slug').populate('instructor', 'name avatar');
  }
}

module.exports = new CourseRepository();
