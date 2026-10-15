const enrollmentRepository = require('../repositories/enrollment.repository');
const courseRepository = require('../repositories/course.repository');
const progressRepository = require('../repositories/progress.repository');
const notificationService = require('./notification.service');
const AppError = require('../utils/appError');
const Order = require('../models/Order');
const { getLocalizedText } = require('../utils/localizedHelper');

const extractUserId = (user) => {
  if (!user) return '';
  if (typeof user === 'string') return user;
  if (user._id) return user._id.toString();
  if (typeof user.id === 'string') return user.id;
  if (typeof user.toString === 'function') return user.toString();
  return '';
};

class EnrollmentService {
  async enrollCourse(courseId, user, options = {}) {
    const studentId = extractUserId(user);
    if (!studentId) {
      throw new AppError('Xác thực học viên không hợp lệ', 401);
    }

    const course = await courseRepository.findById(courseId);
    if (!course) {
      throw new AppError('Không tìm thấy khóa học', 404);
    }

    // Kiểm tra xem user đã đăng ký khóa này chưa
    const existingEnrollment = await enrollmentRepository.findByStudentAndCourse(studentId, courseId);
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
        user: studentId,
        course: courseId,
        status: 'paid'
      });
      if (!existingPaidOrder) {
        throw new AppError('Khóa học này yêu cầu thanh toán trước khi đăng ký!', 402, 'PAYMENT_REQUIRED');
      }
    }

    const enrollmentData = {
      student: studentId,
      course: courseId,
      paymentStatus: 'completed'
    };

    const newEnrollment = await enrollmentRepository.create(enrollmentData);

    // 4. Persist Order document chỉ khi chưa có Order từ trước (tránh duplicate với Stripe/VietQR)
    if (!options.existingOrderId) {
      const existingOrder = await Order.findOne({ user: studentId, course: courseId, status: 'paid' });
      if (!existingOrder) {
        await Order.create({
          user: studentId,
          course: courseId,
          amount: coursePrice,
          currency: 'vnd',
          status: 'paid'
        });
      }
    }

    // 5. Khởi tạo Tiến độ học tập (Progress) nếu chưa có bản ghi (tránh lỗi E11000 duplicate key)
    let progress = await progressRepository.findByStudentAndCourse(studentId, courseId);
    if (!progress) {
      await progressRepository.create({
        student: studentId,
        course: courseId,
        progressPercentage: 0,
        completedLessons: []
      });
    }

    // 6. Gửi Notification
    const courseTitleStr = getLocalizedText(course.title, 'vi');
    await notificationService.createNotification({
      recipient: studentId,
      title: 'Đăng ký khóa học thành công!',
      message: `Bạn đã đăng ký thành công khóa học "${courseTitleStr}". Hãy bắt đầu học ngay nhé.`,
      type: 'course',
      link: `/courses/${courseId}/learn`
    });

    return newEnrollment;
  }

  async unenrollCourse(courseId, user) {
    const studentId = extractUserId(user);
    const enrollment = await enrollmentRepository.findByStudentAndCourse(studentId, courseId);
    
    if (!enrollment) {
      throw new AppError('Bạn chưa đăng ký khóa học này', 400);
    }

    await enrollmentRepository.deleteById(enrollment._id);
    return true;
  }

  async getMyEnrollments(user) {
    const studentId = extractUserId(user);
    return await enrollmentRepository.findByStudent(studentId);
  }
}

module.exports = new EnrollmentService();
