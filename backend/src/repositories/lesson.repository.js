const BaseRepository = require('./base.repository');
const Lesson = require('../models/Lesson');

class LessonRepository extends BaseRepository {
  constructor() {
    super(Lesson);
  }

  // Override đềElấy bài giảng theo Course ID và sắp xếp theo order
  async findByCourseId(courseId) {
    return await this.model.find({ course }).sort({ order: 1 });
  }
}

module.exports = new LessonRepository();
