const PDFDocument = require('pdfkit');
const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

/**
 * Hàm sinh PDF và upload trực tiếp lên Cloudinary
 * Trả về Promise chứa đường dẫn secure_url của file PDF
 */
exports.generateCertificate = (studentName, courseTitle, certificateId) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        layout: 'landscape',
        size: 'A4',
      });

      // Thu thập dữ liệu chunk vào một mảng Buffer
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);

        // Upload buffer PDF này lên Cloudinary với resource_type là raw hoặc image
        // File pdf có thể lưu dạng image để dễ preview trên web
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'elearning/certificates',
            resource_type: 'image', 
            format: 'pdf',
          },
          (error, result) => {
            if (error) {
              console.error('Lỗi khi upload PDF lên Cloudinary:', error);
              return reject(error);
            }
            resolve(result.secure_url);
          }
        );

        streamifier.createReadStream(pdfData).pipe(stream);
      });

      // ----------------------------------------------------
      // VẼ GIAO DIỆN CHỨNG CHỈ LÊN PDF
      // ----------------------------------------------------
      const distanceMargin = 50;
      doc.fillAndStroke('#021c27')
         .lineWidth(20)
         .rect(distanceMargin, distanceMargin, doc.page.width - distanceMargin * 2, doc.page.height - distanceMargin * 2)
         .stroke();

      // Tiêu đề
      doc.moveDown(3);
      doc.fontSize(50).fillColor('#000').text('CHỨNG NHẬN HOÀN THÀNH', { align: 'center' });
      
      doc.moveDown(1);
      doc.fontSize(20).text('Chứng nhận này được cấp cho học viên', { align: 'center' });
      
      doc.moveDown(0.5);
      doc.fontSize(40).fillColor('#007bff').text(studentName, { align: 'center' });
      
      doc.moveDown(1);
      doc.fontSize(20).fillColor('#000').text('Đã hoàn thành xuất sắc khóa học', { align: 'center' });
      
      doc.moveDown(0.5);
      doc.fontSize(30).fillColor('#28a745').text(courseTitle, { align: 'center' });
      
      doc.moveDown(2);
      doc.fontSize(12).fillColor('#666').text(`Mã chứng chỉ: ${certificateId}`, { align: 'center' });
      
      const dateStr = new Date().toLocaleDateString('vi-VN');
      doc.text(`Ngày cấp: ${dateStr}`, { align: 'center' });

      // Kết thúc stream (kích hoạt sự kiện doc.on('end'))
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};
