const BaseRepository = require('./base.repository');
const Progress = require('../models/Progress');

class ProgressRepository extends BaseRepository {
  constructor() {
    super(Progress);
  }

  async findByStudentAndCourse(studentId, courseId) {
    return await this.model.findOne({ student: studentId, course: courseId });
  }

  async findByStudent(studentId) {
    return await this.model.find({ student: studentId }).populate('course', 'title thumbnailUrl');
  }
}

module.exports = new ProgressRepository();
