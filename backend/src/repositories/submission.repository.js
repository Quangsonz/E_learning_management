const BaseRepository = require('./base.repository');
const AssignmentSubmission = require('../models/AssignmentSubmission');

class AssignmentSubmissionRepository extends BaseRepository {
  constructor() {
    super(AssignmentSubmission);
  }

  async findByAssignment(assignmentId) {
    return await this.model.find({ assignment: assignmentId })
      .populate('student', 'name email avatar')
      .sort({ createdAt: -1 });
  }

  async findByStudentAndAssignment(studentId, assignmentId) {
    return await this.model.findOne({ student: studentId, assignment: assignmentId });
  }
}

module.exports = new AssignmentSubmissionRepository();
