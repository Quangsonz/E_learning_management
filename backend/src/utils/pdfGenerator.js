const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

const { getLocalizedText } = require('./localizedHelper');

function removeVietnameseTones(str) {
  if (!str) return '';
  if (typeof str === 'object') {
    str = getLocalizedText(str, 'vi');
  }
  str = String(str);
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
  str = str.replace(/đ/g, 'd');
  str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, 'A');
  str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, 'E');
  str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, 'I');
  str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, 'O');
  str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, 'U');
  str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, 'Y');
  str = str.replace(/Đ/g, 'D');
  return str;
}

function setupPDFFont(doc) {
  const fontCandidates = [
    'C:\\Windows\\Fonts\\arial.ttf',
    'C:\\Windows\\Fonts\\segoeui.ttf',
    'C:\\Windows\\Fonts\\times.ttf',
    '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
  ];

  for (const fontPath of fontCandidates) {
    if (fs.existsSync(fontPath)) {
      try {
        doc.font(fontPath);
        return true;
      } catch (err) {}
    }
  }
  return false;
}

function renderLuxuryCertificate(doc, { studentName, courseTitle, certificateId, qrCodeDataUrl, issueDate }) {
  const w = doc.page.width;
  const h = doc.page.height;
  const hasTTF = setupPDFFont(doc);
  const clean = (str) => hasTTF ? str : removeVietnameseTones(str);

  // 1. Warm Luxury Ivory/Parchment Background
  doc.save();
  doc.rect(0, 0, w, h).fillColor('#FDFCF9').fill();

  // 2. Multi-tier Royal Borders
  // Outer Navy Border
  doc.lineWidth(3).strokeColor('#0F172A').rect(26, 26, w - 52, h - 52).stroke();
  // Gold Accent Border
  doc.lineWidth(1.5).strokeColor('#C5A059').rect(33, 33, w - 66, h - 66).stroke();
  // Thin Inner Slate Border
  doc.lineWidth(0.5).strokeColor('#E2E8F0').rect(38, 38, w - 76, h - 76).stroke();

  // Corner Ornaments (Guilloche / Diamonds at all 4 corners)
  const drawCornerFlourish = (cx, cy, dirX, dirY) => {
    doc.save();
    doc.lineWidth(1.2).strokeColor('#C5A059');
    doc.moveTo(cx, cy).lineTo(cx + dirX * 32, cy).stroke();
    doc.moveTo(cx, cy).lineTo(cx, cy + dirY * 32).stroke();
    doc.polygon(
      [cx + dirX * 4, cy],
      [cx, cy + dirY * 4],
      [cx - dirX * 4, cy],
      [cx, cy - dirY * 4]
    ).fillColor('#C5A059').fill();
    doc.restore();
  };

  drawCornerFlourish(38, 38, 1, 1);
  drawCornerFlourish(w - 38, 38, -1, 1);
  drawCornerFlourish(38, h - 38, 1, -1);
  drawCornerFlourish(w - 38, h - 38, -1, -1);

  // Top Crest Emblem
  const centerX = w / 2;
  doc.save();
  // Small gold star in header
  doc.polygon(
    [centerX, 50],
    [centerX + 3, 56],
    [centerX + 9, 56],
    [centerX + 4, 60],
    [centerX + 6, 66],
    [centerX, 62],
    [centerX - 6, 66],
    [centerX - 4, 60],
    [centerX - 9, 56],
    [centerX - 3, 56]
  ).fillColor('#C5A059').fill();
  doc.restore();

  // Organization Header
  doc.fontSize(10).fillColor('#64748B').text(clean('E - L E A R N I N G   A C A D E M Y   S Y S T E M'), 0, 72, { align: 'center' });
  doc.fontSize(7.5).fillColor('#94A3B8').text(clean('INTERNATIONAL ACCREDITED CREDENTIAL PROGRAM'), 0, 86, { align: 'center' });

  // Divider line under crest
  doc.lineWidth(0.8).strokeColor('#C5A059');
  doc.moveTo(centerX - 110, 100).lineTo(centerX + 110, 100).stroke();
  doc.polygon([centerX, 98], [centerX + 2.5, 100], [centerX, 102], [centerX - 2.5, 100]).fillColor('#C5A059').fill();

  // Main Header: CHỨNG CHỈ TỐT NGHIỆP
  doc.fontSize(27).fillColor('#0F172A').text(clean('CHỨNG CHỈ TỐT NGHIỆP'), 0, 114, { align: 'center' });
  doc.fontSize(10).fillColor('#C5A059').text(clean('CERTIFICATE OF ACADEMIC ACHIEVEMENT'), 0, 146, { align: 'center' });

  // Subtitle
  doc.fontSize(11).fillColor('#64748B').text(clean('Chứng nhận này được trân trọng trao tặng cho'), 0, 170, { align: 'center' });

  // Student Name (Prominent & Majestic)
  doc.fontSize(32).fillColor('#1E3A8A').text(clean(studentName || 'Học viên E-Learning'), 0, 192, { align: 'center' });

  // Golden underline accent for student name
  const nameLineWidth = 180;
  doc.lineWidth(1).strokeColor('#C5A059');
  doc.moveTo(centerX - nameLineWidth, 232).lineTo(centerX + nameLineWidth, 232).stroke();
  doc.polygon([centerX, 230], [centerX + 3, 232], [centerX, 234], [centerX - 3, 232]).fillColor('#C5A059').fill();

  // Achievement Description
  doc.fontSize(11).fillColor('#475569').text(
    clean('Đã hoàn thành xuất sắc toàn diện chương trình đào tạo chuyên sâu và vượt qua đồ án tốt nghiệp:'),
    80,
    246,
    { align: 'center', width: w - 160 }
  );

  // Course Title Box
  const resolvedCourseTitle = courseTitle ? (typeof courseTitle === 'object' ? getLocalizedText(courseTitle, 'vi') : courseTitle) : 'Khóa học Chuyên nghiệp';
  doc.save();
  const boxWidth = Math.min(540, w - 160);
  const boxX = (w - boxWidth) / 2;
  doc.roundedRect(boxX, 276, boxWidth, 42, 6).fillColor('#F1F5F9').fill();
  doc.roundedRect(boxX, 276, boxWidth, 42, 6).lineWidth(0.8).strokeColor('#CBD5E1').stroke();
  doc.restore();

  doc.fontSize(17).fillColor('#065F46').text(clean(resolvedCourseTitle), boxX + 10, 288, {
    align: 'center',
    width: boxWidth - 20
  });

  // Footer: 3 Columns
  // --- COLUMN 1: Academic Director Signature (Left) ---
  const col1X = 75;
  const footerY = 355;

  // Signature flourish line
  doc.save();
  doc.lineWidth(1.2).strokeColor('#1E293B');
  doc.moveTo(col1X + 15, footerY + 38)
     .bezierCurveTo(col1X + 45, footerY + 15, col1X + 75, footerY + 50, col1X + 120, footerY + 28)
     .bezierCurveTo(col1X + 140, footerY + 18, col1X + 160, footerY + 45, col1X + 185, footerY + 32)
     .stroke();
  doc.restore();

  // Signature rule
  doc.lineWidth(0.8).strokeColor('#94A3B8').moveTo(col1X, footerY + 55).lineTo(col1X + 200, footerY + 55).stroke();
  doc.fontSize(9.5).fillColor('#0F172A').text(clean('TS. NGUYỄN VĂN AN'), col1X, footerY + 62, { width: 200, align: 'center' });
  doc.fontSize(7.5).fillColor('#64748B').text(clean('GIÁM ĐỐC HỌC THUẬT & ĐÀO TẠO'), col1X, footerY + 75, { width: 200, align: 'center' });
  doc.fontSize(7.5).fillColor('#94A3B8').text(clean('E-Learning Academy System'), col1X, footerY + 86, { width: 200, align: 'center' });

  // --- COLUMN 2: Gold Wax Seal (Center) ---
  const sealX = centerX;
  const sealY = footerY + 45;
  const sealR = 36;

  doc.save();
  // Seal shadow
  doc.circle(sealX, sealY + 2, sealR).fillColor('#FDE68A').fill();
  // Outer gold scalloped ring
  doc.circle(sealX, sealY, sealR).fillColor('#C5A059').fill();
  doc.circle(sealX, sealY, sealR - 3).lineWidth(1).strokeColor('#FFF').stroke();
  doc.circle(sealX, sealY, sealR - 6).fillColor('#D97706').fill();
  doc.circle(sealX, sealY, sealR - 8).lineWidth(0.8).strokeColor('#FDE68A').stroke();
  
  // Star in seal
  doc.polygon(
    [sealX, sealY - 14],
    [sealX + 3.5, sealY - 6],
    [sealX + 12, sealY - 6],
    [sealX + 5, sealY - 1],
    [sealX + 8, sealY + 7],
    [sealX, sealY + 2],
    [sealX - 8, sealY + 7],
    [sealX - 5, sealY - 1],
    [sealX - 12, sealY - 6],
    [sealX - 3.5, sealY - 6]
  ).fillColor('#FFF').fill();

  doc.fontSize(6).fillColor('#FFF').text(clean('VERIFIED'), sealX - 25, sealY + 7, { width: 50, align: 'center' });
  doc.fontSize(4.8).fillColor('#FDE68A').text(clean('OFFICIAL SEAL'), sealX - 25, sealY + 16, { width: 50, align: 'center' });

  // Ribbon tails beneath seal
  doc.polygon([sealX - 10, sealY + sealR - 4], [sealX - 18, sealY + sealR + 24], [sealX - 10, sealY + sealR + 18], [sealX - 2, sealY + sealR + 24], [sealX - 2, sealY + sealR - 4]).fillColor('#B45309').fill();
  doc.polygon([sealX + 2, sealY + sealR - 4], [sealX + 2, sealY + sealR + 24], [sealX + 10, sealY + sealR + 18], [sealX + 18, sealY + sealR + 24], [sealX + 10, sealY + sealR - 4]).fillColor('#D97706').fill();
  doc.restore();

  // --- COLUMN 3: QR Code & Verification (Right) ---
  const col3X = w - 75 - 190;
  
  if (qrCodeDataUrl) {
    try {
      const qrBase64 = qrCodeDataUrl.replace(/^data:image\/\w+;base64,/, '');
      const qrBuffer = Buffer.from(qrBase64, 'base64');
      const qrSize = 68;
      doc.save();
      doc.roundedRect(col3X + 60, footerY + 2, qrSize + 8, qrSize + 8, 4).fillColor('#FFF').fill();
      doc.roundedRect(col3X + 60, footerY + 2, qrSize + 8, qrSize + 8, 4).lineWidth(0.8).strokeColor('#CBD5E1').stroke();
      doc.image(qrBuffer, col3X + 64, footerY + 6, { fit: [qrSize, qrSize] });
      doc.restore();
    } catch (e) {}
  }

  const dateStr = issueDate ? new Date(issueDate).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN');
  doc.fontSize(7.5).fillColor('#0F172A').text(clean(`MÃ SỐ: ${certificateId}`), col3X, footerY + 78, { width: 200, align: 'center' });
  doc.fontSize(7).fillColor('#64748B').text(clean(`NGÀY CẤP: ${dateStr}`), col3X, footerY + 88, { width: 200, align: 'center' });
  doc.fontSize(6.5).fillColor('#059669').text(clean('✓ CHỨNG THỰC BẢN QUYỀN SỐ'), col3X, footerY + 98, { width: 200, align: 'center' });

  doc.restore();
}

exports.renderLuxuryCertificate = renderLuxuryCertificate;
exports.setupPDFFont = setupPDFFont;
exports.removeVietnameseTones = removeVietnameseTones;

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
        margin: 0
      });

      // Thu thập dữ liệu chunk vào một mảng Buffer
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);

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

      // VẼ GIAO DIỆN CHỨNG CHỈ LÊN PDF
      renderLuxuryCertificate(doc, { studentName, courseTitle, certificateId, qrCodeDataUrl });

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
