const enrollmentRepository = require('../repositories/enrollment.repository');
const courseRepository = require('../repositories/course.repository');
const progressRepository = require('../repositories/progress.repository');
const notificationService = require('./notification.service');
const AppError = require('../utils/appError');
const Order = require('../models/Order');

class EnrollmentService {
  async enrollCourse(courseId, user, options = {}) {
    const course = await courseRepository.findById(courseId);
    if (!course) {
      throw new AppError('Không tìm thấy khóa học', 404);
    }

    // Kiểm tra xem user đã đăng ký khóa này chưa
    const existingEnrollment = await enrollmentRepository.findByStudentAndCourse(user.id, courseId);
    if (existingEnrollment) {
      throw new AppError('Bạn đã đăng ký khóa học này rồi!', 400);
    }

    // 3. Xác định trạng thái thanh toán & Kiểm tra quyền ghi danh
    const coursePrice = Number(course.price) || 0;
    const isFree = coursePrice === 0;
    const isTrustedPayment = options.isFromPayment === true;

    // Nếu khóa học có phí và không phải được gọi từ payment webhook/controller đã xác thực
    if (!isFree && !isTrustedPayment) {
      const existingPaidOrder = await Order.findOne({
        user: user.id,
        course: courseId,
        status: 'paid'
      });
      if (!existingPaidOrder) {
        throw new AppError('Khóa học này yêu cầu thanh toán trước khi đăng ký!', 402, 'PAYMENT_REQUIRED');
      }
    }

    const enrollmentData = {
      student: user.id,
      course: courseId,
      paymentStatus: 'completed'
    };

    const newEnrollment = await enrollmentRepository.create(enrollmentData);

    // 4. Persist Order document chỉ khi chưa có Order từ trước (tránh duplicate với Stripe/VietQR)
    if (!options.existingOrderId) {
      const existingOrder = await Order.findOne({ user: user.id, course: courseId, status: 'paid' });
      if (!existingOrder) {
        await Order.create({
          user: user.id,
          course: courseId,
          amount: coursePrice,
          currency: 'vnd',
          status: 'paid'
        });
      }
    }

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
