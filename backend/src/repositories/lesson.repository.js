const BaseRepository = require('./base.repository');
const Lesson = require('../models/Lesson');

class LessonRepository extends BaseRepository {
  constructor() {
    super(Lesson);
  }

  // Override để lấy bài giảng theo Course ID và sắp xếp theo order
  async findByCourseId(courseId) {
    if (!courseId) return [];
    return await this.model.find({ course: courseId }).sort({ order: 1 }).lean();
  }
}

module.exports = new LessonRepository();
