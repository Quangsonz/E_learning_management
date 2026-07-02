const BaseRepository = require('./base.repository');
const Assignment = require('../models/Assignment');

class AssignmentRepository extends BaseRepository {
  constructor() {
    super(Assignment);
  }

  async findByCourseId(courseId) {
    return await this.model.find({ course: courseId }).sort({ dueDate: 1 });
  }
}

module.exports = new AssignmentRepository();
