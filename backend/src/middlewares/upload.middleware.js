const multer = require('multer');
const AppError = require('../utils/appError');

// Dùng memory storage để lấy file dạng Buffer, sau đó stream thẳng lên Cloudinary
const storage = multer.memoryStorage();

// Bộ lọc cho Hình ảnh (Thumbnail, Avatar)
const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new AppError('Chỉ được phép upload hình ảnh!', 400), false);
  }
};

// Bộ lọc cho Video (Bài giảng)
const videoFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new AppError('Chỉ được phép upload video!', 400), false);
  }
};

exports.uploadImage = multer({
  storage: storage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // Giới hạn 5MB cho ảnh
});

exports.uploadVideo = multer({
  storage: storage,
  fileFilter: videoFilter,
  // Tạm để giới hạn lớn hơn cho Video (vd: 500MB)
  limits: { fileSize: 500 * 1024 * 1024 } 
});
