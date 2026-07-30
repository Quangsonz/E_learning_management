const certificateService = require('../services/certificate.service');
const catchAsync = require('../utils/catchAsync');

class CertificateController {
  claimCertificate = catchAsync(async (req, res, next) => {
    const { courseId } = req.params;

    const certificate = await certificateService.claimCertificate(courseId, req.user);

    res.status(201).json({
      status: 'success',
      data: {
        certificate,
      },
    });
  });

  getMyCertificates = catchAsync(async (req, res, next) => {
    const certificates = await certificateService.getMyCertificates(req.user);

    res.status(200).json({
      status: 'success',
      results: certificates.length,
      data: {
        certificates,
      },
    });
  });

  verifyCertificate = catchAsync(async (req, res, next) => {
    const { certificateId } = req.params;

    const certificate = await certificateService.verifyCertificate(certificateId);

    res.status(200).json({
      status: 'success',
      data: {
        isValid: true,
        certificate,
      },
    });
  });

  downloadCertificatePDF = catchAsync(async (req, res, next) => {
    const { certificateId } = req.params;
    const certificate = await certificateService.verifyCertificate(certificateId);

    // If Cloudinary or direct external URL exists, redirect
    if (certificate.pdfUrl && certificate.pdfUrl.startsWith('https://res.cloudinary.com')) {
      return res.redirect(certificate.pdfUrl);
    }

    const { setupPDFFont, removeVietnameseTones } = require('../utils/pdfGenerator');

    // Dynamic PDF Kit stream generation
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ layout: 'landscape', size: 'A4', margin: 50 });

    const hasTTF = setupPDFFont(doc);
    const clean = (str) => hasTTF ? str : removeVietnameseTones(str);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="Certificate-${certificateId}.pdf"`);

    doc.pipe(res);

    const studentName = certificate.student?.name || 'Hoc vien E-Learning';
    const courseTitle = certificate.course?.title || 'Khoa hoc Chuyen nghiep';

    // Draw Certificate Border
    const margin = 50;
    doc.fillAndStroke('#021c27')
       .lineWidth(16)
       .rect(margin, margin, doc.page.width - margin * 2, doc.page.height - margin * 2)
       .stroke();

    doc.moveDown(2);
    doc.fontSize(40).fillColor('#0f172a').text(clean('CHỨNG NHẬN HOÀN THÀNH'), { align: 'center' });
    doc.moveDown(0.8);
    doc.fontSize(18).fillColor('#475569').text(clean('Chứng nhận này được trân trọng trao cho học viên'), { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(32).fillColor('#4f46e5').text(clean(studentName), { align: 'center' });
    doc.moveDown(0.8);
    doc.fontSize(18).fillColor('#475569').text(clean('Đã hoàn thành xuất sắc khóa học'), { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(24).fillColor('#059669').text(clean(courseTitle), { align: 'center' });
    doc.moveDown(1.5);
    doc.fontSize(12).fillColor('#64748b').text(clean(`Mã chứng chỉ: ${certificate.certificateId}`), { align: 'center' });
    doc.text(clean(`Ngày cấp: ${new Date(certificate.issueDate || certificate.createdAt).toLocaleDateString('vi-VN')}`), { align: 'center' });

    doc.end();
  });
}

module.exports = new CertificateController();
