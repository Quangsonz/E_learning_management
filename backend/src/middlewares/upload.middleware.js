const multer = require('multer');
const AppError = require('../utils/appError');

const os = require('os');

// Dùng memory storage cho ảnh & tài liệu nhỏ
const storage = multer.memoryStorage();

// Dùng diskStorage cho Video dung lượng lớn để chống tràn bộ nhớ Heap RAM Node.js
const videoDiskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, os.tmpdir());
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'video-' + uniqueSuffix + '-' + file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_'));
  }
});

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
  limits: {
    fileSize: 5 * 1024 * 1024, // Giới hạn 5MB cho ảnh
    files: 5 // Tối đa 5 file ảnh cùng lúc
  }
});

exports.uploadVideo = multer({
  storage: videoDiskStorage,
  fileFilter: videoFilter,
  limits: {
    fileSize: 500 * 1024 * 1024, // Giới hạn 500MB cho video
    files: 1 // Tối đa 1 video mỗi lần upload
  }
});

// Bộ lọc cho Tài liệu / Assignment (PDF, ZIP, RAR, Word, Image)
const documentFilter = (req, file, cb) => {
  const allowedExtensions = ['.pdf', '.zip', '.rar', '.doc', '.docx', '.png', '.jpg', '.jpeg'];
  const ext = require('path').extname(file.originalname).toLowerCase();
  if (allowedExtensions.includes(ext) || file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new AppError('Chỉ chấp nhận các định dạng file: PDF, ZIP, RAR, DOC, DOCX, PNG, JPG', 400), false);
  }
};

exports.uploadDocument = multer({
  storage: storage,
  fileFilter: documentFilter,
  limits: {
    fileSize: 20 * 1024 * 1024, // Giới hạn 20MB cho tài liệu
    files: 5 // Tối đa 5 tài liệu cùng lúc
  }
});
