const BaseRepository = require('./base.repository');
const Enrollment = require('../models/Enrollment');

class EnrollmentRepository extends BaseRepository {
  constructor() {
    super(Enrollment);
  }

  // Lấy chi tiết một đăng ký dựa trên học viên và khóa học
  async findByStudentAndCourse(studentId, courseId) {
    return await this.model.findOne({ student: studentId, course: courseId });
  }

  // Lấy tất cả khóa học mà học viên đã đăng ký
  async findByStudent(studentId) {
    return await this.model.find({ student: studentId }).populate('course');
  }

  // Lấy tất cả học viên của một khóa học
  async findByCourse(courseId) {
    return await this.model.find({ course: courseId }).populate('student', 'name email avatar');
  }
}

module.exports = new EnrollmentRepository();
