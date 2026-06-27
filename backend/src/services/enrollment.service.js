const enrollmentRepository = require('../repositories/enrollment.repository');
const courseRepository = require('../repositories/course.repository');
const AppError = require('../utils/appError');

class EnrollmentService {
  async enrollCourse(courseId, user) {
    const course = await courseRepository.findById(courseId);
    if (!course) {
      throw new AppError('Không tìm thấy khóa học', 404);
    }

    // Kiểm tra xem user đã đăng ký khóa này chưa
    const existingEnrollment = await enrollmentRepository.findByStudentAndCourse(user.id, courseId);
    if (existingEnrollment) {
      throw new AppError('Bạn đã đăng ký khóa học này rồi!', 400);
    }

    // Xác định trạng thái thanh toán
    // Tạm thời bỏ qua cổng thanh toán, mặc định cho phép học viên truy cập ngay (completed)
    const paymentStatus = 'completed';

    const enrollmentData = {
      student: user.id,
      course: courseId,
      paymentStatus
    };

    return await enrollmentRepository.create(enrollmentData);
  }

  async unenrollCourse(courseId, user) {
    const enrollment = await enrollmentRepository.findByStudentAndCourse(user.id, courseId);
    
    if (!enrollment) {
      throw new AppError('Bạn chưa đăng ký khóa học này', 400);
    }

    await enrollmentRepository.deleteById(enrollment._id);
    return true;
  }

  async getMyEnrollments(user) {
    return await enrollmentRepository.findByStudent(user.id);
  }
}

module.exports = new EnrollmentService();
