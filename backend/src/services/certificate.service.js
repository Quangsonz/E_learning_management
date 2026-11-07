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

    // 6. Sinh PDF (tùy chọn backup lên Cloudinary nếu cần)
    const courseTitleStr = getLocalizedText(course.title, 'vi');
    let backendPdfUrl = `/api/certificates/${certId}/pdf`;
    try {
      await generateCertificate(userName, courseTitleStr, certId, qrCodeDataUrl);
    } catch (uploadErr) {
      console.warn('[CertificateService] Cloudinary background sync skipped, serving via internal API route:', uploadErr.message);
    }

    // 7. Lưu dữ liệu vào Database với endpoint tải PDF an toàn từ hệ thống
    const newCertificate = await certificateRepository.create({
      student: userId,
      course: courseId,
      certificateUrl: backendPdfUrl,
      pdfUrl: backendPdfUrl,
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
    const certificates = await certificateRepository.findByStudent(userId);
    return certificates.map(cert => {
      const c = cert.toObject ? cert.toObject() : cert;
      c.pdfUrl = `/api/certificates/${c.certificateId}/pdf`;
      c.certificateUrl = `/api/certificates/${c.certificateId}/pdf`;
      return c;
    });
  }

  async verifyCertificate(certificateId) {
    const certificate = await certificateRepository.findByCertificateId(certificateId);
    if (!certificate) {
      throw new AppError('Chứng chỉ này không hợp lệ hoặc không tồn tại trong hệ thống', 404);
    }
    const certObj = certificate.toObject ? certificate.toObject() : certificate;
    certObj.pdfUrl = `/api/certificates/${certificate.certificateId}/pdf`;
    certObj.certificateUrl = `/api/certificates/${certificate.certificateId}/pdf`;
    return certObj;
  }
}

module.exports = new CertificateService();
