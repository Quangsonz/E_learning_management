const BaseRepository = require('./base.repository');
const Progress = require('../models/Progress');

class ProgressRepository extends BaseRepository {
  constructor() {
    super(Progress);
  }

  async findByStudentAndCourse(studentId, courseId) {
    if (!studentId || !courseId) return null;
    return await this.model.findOne({ student: studentId, course: courseId });
  }

  async findByStudent(studentId) {
    if (!studentId) return [];
    return await this.model.find({ student: studentId }).populate('course', 'title thumbnailUrl price status');
  }
}

module.exports = new ProgressRepository();
