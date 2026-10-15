const { v4: uuidv4 } = require('uuid');
const certificateRepository = require('../repositories/certificate.repository');
const progressRepository = require('../repositories/progress.repository');
const courseRepository = require('../repositories/course.repository');
const { generateCertificate } = require('../utils/pdfGenerator');
const AppError = require('../utils/appError');
const QRCode = require('qrcode');
const notificationService = require('./notification.service');
const xpService = require('./xp.service');
const { getLocalizedText } = require('../utils/localizedHelper');

class CertificateService {
  async claimCertificate(courseId, user) {
    const userId = typeof user === 'string' ? user : (user?.id || user?._id || '').toString();
    if (!userId) {
      throw new AppError('Xác thực học viên không hợp lệ', 401);
    }
    const userName = user?.name || 'Học viên E-Learning';

    // 1. Kiểm tra khóa học có tồn tại
    const course = await courseRepository.findById(courseId);
    if (!course) throw new AppError('Không tìm thấy khóa học', 404);

    // 2. Kiểm tra user đã hoàn thành 100% chưa
    const progress = await progressRepository.findByStudentAndCourse(userId, courseId);
    if (!progress || progress.progressPercentage < 100) {
      throw new AppError('Bạn chưa hoàn thành khóa học này. Hãy học hết 100% để nhận chứng chỉ nhé!', 403);
    }

    // 3. Kiểm tra xem chứng chỉ đã được tạo trước đó chưa
    let existingCertificate = await certificateRepository.findByStudentAndCourse(userId, courseId);
    if (existingCertificate) {
      return existingCertificate; // Nếu có rồi thì trả về luôn, không sinh lại PDF nữa
    }

    // 4. Tạo mã ID ngắn cho chứng chỉ (8 ký tự)
    const certId = uuidv4().split('-')[0].toUpperCase();

    // 5. Sinh QR Code Data URL
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const validationUrl = `${frontendUrl}/certificates/verify/${certId}`;
    const qrCodeDataUrl = await QRCode.toDataURL(validationUrl);

    // 6. Sinh PDF và Upload (Sẽ mất vài giây tùy mạng)
    const courseTitleStr = getLocalizedText(course.title, 'vi');
    const pdfUrl = await generateCertificate(userName, courseTitleStr, certId, qrCodeDataUrl);

    // 7. Lưu dữ liệu vào Database
    const newCertificate = await certificateRepository.create({
      student: userId,
      course: courseId,
      certificateUrl: pdfUrl,
      pdfUrl: pdfUrl,
      certificateId: certId,
      validationUrl: validationUrl,
      qrCode: qrCodeDataUrl,
      issueDate: new Date()
    });

    // 8. Gửi Notification
    await notificationService.createNotification({
      recipient: userId,
      title: 'Chứng chỉ hoàn thành!',
      message: `Chúc mừng bạn đã nhận chứng chỉ hoàn thành khóa học "${courseTitleStr}"!`,
      type: 'certificate',
      link: `/certificates/verify/${certId}`
    });

    // 9. Award XP & Badge
    await xpService.addXP(userId, 'COURSE_COMPLETE');
    await xpService.awardBadge(userId, 'COURSE_GRADUATE');

    return newCertificate;
  }

  async getMyCertificates(user) {
    const userId = typeof user === 'string' ? user : (user?.id || user?._id || '').toString();
    return await certificateRepository.findByStudent(userId);
  }

  async verifyCertificate(certificateId) {
    const certificate = await certificateRepository.findByCertificateId(certificateId);
    if (!certificate) {
      throw new AppError('Chứng chỉ này không hợp lệ hoặc không tồn tại trong hệ thống', 404);
    }
    return certificate;
  }
}

module.exports = new CertificateService();
