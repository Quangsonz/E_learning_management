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
}

module.exports = new CertificateController();
