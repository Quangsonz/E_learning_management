const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');
const AppError = require('../utils/appError');

class UploadService {
  /**
   * Upload stream file từ Buffer lên Cloudinary
   * @param {Buffer} fileBuffer
   * @param {String} resourceType ('image' hoặc 'video')
   * @param {String} folder 
   */
  uploadStream(fileBuffer, resourceType, folder) {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: resourceType,
        },
        (error, result) => {
          if (error) {
            console.error(error);
            return reject(new AppError('Tải lên thất bại do lỗi Cloudinary', 500));
          }
          resolve(result);
        }
      );
      streamifier.createReadStream(fileBuffer).pipe(stream);
    });
  }

  async uploadImage(fileBuffer) {
    const result = await this.uploadStream(fileBuffer, 'image', 'elearning/images');
    return result.secure_url;
  }

  async uploadVideo(fileBuffer) {
    const result = await this.uploadStream(fileBuffer, 'video', 'elearning/videos');
    return {
      url: result.secure_url,
      duration: result.duration, // Lấy được độ dài của video
    };
  }
}

module.exports = new UploadService();
