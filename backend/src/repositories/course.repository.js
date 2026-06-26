const BaseRepository = require('./base.repository');
const Course = require('../models/Course');

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

  async findById(id) {
    return await this.model.findById(id).populate('category', 'name slug').populate('instructor', 'name avatar');
  }
}

module.exports = new CourseRepository();
