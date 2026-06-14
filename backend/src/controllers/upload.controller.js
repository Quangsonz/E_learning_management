const uploadService = require('../services/upload.service');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

class UploadController {
  uploadImage = catchAsync(async (req, res, next) => {
    if (!req.file) {
      return next(new AppError('Vui lòng chọn 1 file hình ảnh', 400));
    }

    const imageUrl = await uploadService.uploadImage(req.file.buffer);

    res.status(200).json({
      status: 'success',
      data: {
        url: imageUrl,
      },
    });
  });

  uploadVideo = catchAsync(async (req, res, next) => {
    if (!req.file) {
      return next(new AppError('Vui lòng chọn 1 file video', 400));
    }

    const result = await uploadService.uploadVideo(req.file.buffer);

    res.status(200).json({
      status: 'success',
      data: {
        url: result.url,
        duration: result.duration,
      },
    });
  });
}

module.exports = new UploadController();
