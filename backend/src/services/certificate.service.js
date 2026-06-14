const { v4: uuidv4 } = require('uuid');
const certificateRepository = require('../repositories/certificate.repository');
const progressRepository = require('../repositories/progress.repository');
const courseRepository = require('../repositories/course.repository');
const { generateCertificate } = require('../utils/pdfGenerator');
const AppError = require('../utils/appError');

class CertificateService {
  async claimCertificate(courseId, user) {
    // 1. Kiểm tra khóa học có tồn tại
    const course = await courseRepository.findById(courseId);
    if (!course) throw new AppError('Không tìm thấy khóa học', 404);

    // 2. Kiểm tra user đã hoàn thành 100% chưa
    const progress = await progressRepository.findByStudentAndCourse(user.id, courseId);
    if (!progress || progress.progressPercentage < 100) {
      throw new AppError('Bạn chưa hoàn thành khóa học này. Hãy học hết 100% để nhận chứng chỉ nhé!', 403);
    }

    // 3. Kiểm tra xem chứng chỉ đã được tạo trước đó chưa
    let existingCertificate = await certificateRepository.findByStudentAndCourse(user.id, courseId);
    if (existingCertificate) {
      return existingCertificate; // Nếu có rồi thì trả về luôn, không sinh lại PDF nữa
    }

    // 4. Tạo mã ID ngắn cho chứng chỉ (8 ký tự)
    const certId = uuidv4().split('-')[0].toUpperCase();

    // 5. Sinh PDF và Upload (Sẽ mất vài giây tùy mạng)
    const pdfUrl = await generateCertificate(user.name, course.title, certId);

    // 6. Lưu dữ liệu vào Database
    const newCertificate = await certificateRepository.create({
      student: user.id,
      course: courseId,
      certificateUrl: pdfUrl,
      certificateId: certId,
      issuedAt: new Date()
    });

    return newCertificate;
  }

  async getMyCertificates(user) {
    return await certificateRepository.findByStudent(user.id);
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
