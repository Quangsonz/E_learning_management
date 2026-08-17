const enrollmentRepository = require('../repositories/enrollment.repository');
const courseRepository = require('../repositories/course.repository');
const progressRepository = require('../repositories/progress.repository');
const notificationService = require('./notification.service');
const AppError = require('../utils/appError');
const Order = require('../models/Order');

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

    const newEnrollment = await enrollmentRepository.create(enrollmentData);

    // 4. Persist Order document for revenue tracking (works for both mock and real payments)
    await Order.create({
      user: user.id,
      course: courseId,
      amount: course.price || 0,
      currency: 'vnd',
      status: 'paid'
    });

    // 5. Khởi tạo Tiến độ học tập (Progress)
    await progressRepository.create({
      student: user.id,
      course: courseId,
      progressPercentage: 0
    });

    // 6. Gửi Notification
    await notificationService.createNotification({
      recipient: user.id,
      title: 'Đăng ký khóa học thành công!',
      message: `Bạn đã đăng ký thành công khóa học "${course.title}". Hãy bắt đầu học ngay nhé.`,
      type: 'course',
      link: `/courses/${courseId}/learn`
    });

    return newEnrollment;
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
