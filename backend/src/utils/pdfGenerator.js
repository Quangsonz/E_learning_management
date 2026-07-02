const PDFDocument = require('pdfkit');
const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

/**
 * Hàm sinh PDF và upload trực tiếp lên Cloudinary
 * Trả về Promise chứa đường dẫn secure_url của file PDF
 */
exports.generateCertificate = (studentName, courseTitle, certificateId, qrCodeDataUrl) => {
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

      // Nếu có QR Code thì vẽ lên góc dưới bên phải
      if (qrCodeDataUrl) {
        // Tách phần Data URL để lấy buffer (data:image/png;base64,....)
        const qrBase64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, '');
        const qrBuffer = Buffer.from(qrBase64Data, 'base64');
        
        const qrSize = 100;
        doc.image(qrBuffer, doc.page.width - distanceMargin - qrSize - 20, doc.page.height - distanceMargin - qrSize - 20, {
          fit: [qrSize, qrSize]
        });
      }

      // Kết thúc stream (kích hoạt sự kiện doc.on('end'))
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Sinh PDF báo cáo tài chính hàng tháng trực tiếp ghi vào stream phản hồi HTTP (response)
 */
exports.generateFinancialReportPDF = (res, orders, summary, month, year) => {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });

  // Pipe trực tiếp sang HTTP response
  doc.pipe(res);

  // --- HEADER ---
  doc.fontSize(22).fillColor('#0f172a').text('E-LEARNING SYSTEM', { bold: true });
  doc.fontSize(10).fillColor('#64748b').text('Enterprise Learning Management Platform', { oblique: true });
  doc.moveDown(0.5);
  doc.strokeColor('#e2e8f0').lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown(1.5);

  // --- REPORT TITLE ---
  doc.fontSize(16).fillColor('#1e3a8a').text(`MONTHLY FINANCIAL REPORT - ${month}/${year}`, { align: 'center', bold: true });
  doc.moveDown(1.5);

  // --- SUMMARY BLOCKS ---
  doc.fontSize(12).fillColor('#0f172a').text('1. FINANCIAL SUMMARY', { bold: true });
  doc.moveDown(0.5);
  
  const startY = doc.y;
  // Vẽ khung summary
  doc.fillAndStroke('#f8fafc', '#e2e8f0')
     .rect(50, startY, 495, 60)
     .fill();
     
  doc.fillColor('#0f172a');
  doc.fontSize(9).text('Total Revenue:', 70, startY + 12);
  doc.fontSize(13).fillColor('#059669').text(`${Number(summary.totalRevenue || 0).toLocaleString('vi-VN')} VND`, 70, startY + 25, { bold: true });
  
  doc.fillColor('#0f172a');
  doc.fontSize(9).text('Paid Orders:', 250, startY + 12);
  doc.fontSize(13).fillColor('#2563eb').text(`${summary.totalPaidOrders || 0}`, 250, startY + 25, { bold: true });
  
  doc.fillColor('#0f172a');
  doc.fontSize(9).text('Avg. Order Value:', 380, startY + 12);
  doc.fontSize(13).fillColor('#0891b2').text(`${Number(summary.avgOrderValue || 0).toLocaleString('vi-VN')} VND`, 380, startY + 25, { bold: true });
  
  doc.moveDown(5);

  // --- DETAILED TRANSACTIONS ---
  doc.fontSize(12).fillColor('#0f172a').text('2. DETAILED TRANSACTIONS', { bold: true });
  doc.moveDown(0.5);

  // Tiêu đề bảng
  const tableTop = doc.y;
  doc.fontSize(9).fillColor('#475569');
  doc.text('Date', 50, tableTop, { bold: true });
  doc.text('User Email', 120, tableTop, { bold: true });
  doc.text('Course Title', 250, tableTop, { bold: true });
  doc.text('Amount', 420, tableTop, { bold: true });
  doc.text('Status', 500, tableTop, { bold: true });

  doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(50, tableTop + 15).lineTo(545, tableTop + 15).stroke();
  
  let currentY = tableTop + 25;
  orders.forEach((order) => {
    if (currentY > 750) {
      doc.addPage();
      currentY = 50;
      doc.fontSize(9).fillColor('#475569');
      doc.text('Date', 50, currentY, { bold: true });
      doc.text('User Email', 120, currentY, { bold: true });
      doc.text('Course Title', 250, currentY, { bold: true });
      doc.text('Amount', 420, currentY, { bold: true });
      doc.text('Status', 500, currentY, { bold: true });
      doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(50, currentY + 15).lineTo(545, currentY + 15).stroke();
      currentY += 25;
    }

    doc.fontSize(8).fillColor('#334155');
    const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString('vi-VN') : 'N/A';
    doc.text(orderDate, 50, currentY);
    doc.text(order.user?.email || 'N/A', 120, currentY, { width: 120, ellipsis: true });
    doc.text(order.course?.title || 'N/A', 250, currentY, { width: 160, ellipsis: true });
    doc.text(`${Number(order.amount || 0).toLocaleString('vi-VN')} VND`, 420, currentY);
    doc.text(order.status || 'N/A', 500, currentY);

    doc.strokeColor('#f1f5f9').lineWidth(0.5).moveTo(50, currentY + 12).lineTo(545, currentY + 12).stroke();
    currentY += 18;
  });

  // --- FOOTER ---
  const footerY = 780;
  doc.fontSize(8).fillColor('#94a3b8').text('Generated by E-Learning Admin Portal | Internal Use Only', 50, footerY, { align: 'center' });

  // Kết thúc viết file PDF
  doc.end();
};
