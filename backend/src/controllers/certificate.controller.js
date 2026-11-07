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

    const { renderLuxuryCertificate } = require('../utils/pdfGenerator');

    // Dynamic PDF Kit stream generation (Direct stream to client, avoid Cloudinary 401 ACL block)
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ layout: 'landscape', size: 'A4', margin: 0 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="Certificate-${certificateId}.pdf"`);

    doc.pipe(res);

    const studentName = certificate.student?.name || 'Hoc vien E-Learning';
    const courseTitle = certificate.course?.title || 'Khoa hoc Chuyen nghiep';

    renderLuxuryCertificate(doc, {
      studentName,
      courseTitle,
      certificateId: certificate.certificateId,
      qrCodeDataUrl: certificate.qrCode,
      issueDate: certificate.issueDate || certificate.createdAt
    });

    doc.end();
  });
}

module.exports = new CertificateController();
