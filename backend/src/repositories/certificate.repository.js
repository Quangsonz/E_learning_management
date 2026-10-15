const BaseRepository = require('./base.repository');
const Certificate = require('../models/Certificate');

class CertificateRepository extends BaseRepository {
  constructor() {
    super(Certificate);
  }

  async findByStudentAndCourse(studentId, courseId) {
    return await this.model.findOne({ student: studentId, course: courseId })
      .populate({
        path: 'course',
        select: 'title category instructor thumbnail',
        populate: [
          { path: 'instructor', select: 'name email avatar' },
          { path: 'category', select: 'name' }
        ]
      });
  }

  async findByStudent(studentId) {
    return await this.model.find({ student: studentId }).populate('course', 'title thumbnail');
  }

  async findByCertificateId(certificateId) {
    return await this.model.findOne({ certificateId })
      .populate('student', 'name email')
      .populate({
        path: 'course',
        select: 'title category instructor thumbnail',
        populate: [
          { path: 'instructor', select: 'name email avatar' },
          { path: 'category', select: 'name' }
        ]
      });
  }
}

module.exports = new CertificateRepository();
