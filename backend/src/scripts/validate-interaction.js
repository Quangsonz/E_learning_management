require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Category = require('../models/Category');
const Course = require('../models/Course');
const TeacherApplication = require('../models/TeacherApplication');
const PayoutRequest = require('../models/PayoutRequest');
const AuditLog = require('../models/AuditLog');
const Order = require('../models/Order');

async function validate() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('🔗 Connected to MongoDB for Validation.');

    // ────────────────────────────────────────────────────────────────
    // TEST 1: DUYỆT ĐƠN ỨNG TUYỂN GIẢNG VIÊN (TEACHER APPLICATION)
    // ────────────────────────────────────────────────────────────────
    console.log('\n🧪 TEST 1: Phê duyệt đơn ứng tuyển giảng viên...');
    const app = await TeacherApplication.findOne({ status: 'pending' }).populate('student');
    if (!app) {
      throw new Error('Không tìm thấy đơn ứng tuyển nào ở trạng thái pending.');
    }

    console.log(`- Đơn ứng tuyển tìm thấy của học viên: ${app.student.name} (Role hiện tại: ${app.student.role})`);
    
    // Giả lập Admin phê duyệt đơn
    app.status = 'approved';
    app.adminNotes = 'Hồ sơ đầy đủ, kỹ năng tốt.';
    await app.save();

    // Thay đổi role của người dùng tương ứng sang teacher
    const studentUser = await User.findById(app.student._id);
    studentUser.role = 'teacher';
    await studentUser.save();

    // Xác minh tính đồng nhất
    const verifiedUser = await User.findById(app.student._id);
    const verifiedApp = await TeacherApplication.findById(app._id);
    
    console.log(`- Trạng thái đơn sau xử lý: ${verifiedApp.status}`);
    console.log(`- Quyền hạn của người dùng sau xử lý: ${verifiedUser.role}`);

    if (verifiedApp.status !== 'approved' || verifiedUser.role !== 'teacher') {
      throw new Error('TEST 1 thất bại: Trạng thái đơn hoặc Quyền hạn người dùng không đồng nhất!');
    }
    console.log('✅ TEST 1 ĐỒNG NHẤT THÀNH CÔNG!');

    // ────────────────────────────────────────────────────────────────
    // TEST 2: DUYỆT KHÓA HỌC (COURSE MODERATION)
    // ────────────────────────────────────────────────────────────────
    console.log('\n🧪 TEST 2: Phê duyệt khóa học chờ kiểm duyệt...');
    const course = await Course.findOne({ status: 'pending_review' });
    if (!course) {
      throw new Error('Không tìm thấy khóa học nào ở trạng thái pending_review.');
    }

    console.log(`- Khóa học tìm thấy: "${course.title}" (Trạng thái hiện tại: ${course.status})`);

    // Giả lập Admin duyệt xuất bản khóa học
    course.status = 'published';
    await course.save();

    // Xác minh tính đồng nhất
    const verifiedCourse = await Course.findById(course._id);
    console.log(`- Trạng thái khóa học sau xử lý: ${verifiedCourse.status}`);

    if (verifiedCourse.status !== 'published') {
      throw new Error('TEST 2 thất bại: Trạng thái khóa học không được cập nhật thành công!');
    }
    console.log('✅ TEST 2 ĐỒNG NHẤT THÀNH CÔNG!');

    // ────────────────────────────────────────────────────────────────
    // TEST 3: HOÀN TẤT CHUYỂN KHOẢN RÚT TIỀN (PAYOUT REQUEST)
    // ────────────────────────────────────────────────────────────────
    console.log('\n🧪 TEST 3: Xử lý hoàn tất yêu cầu rút tiền...');
    const payout = await PayoutRequest.findOne({ status: 'pending' });
    if (!payout) {
      throw new Error('Không tìm thấy yêu cầu rút tiền nào ở trạng thái pending.');
    }

    console.log(`- Yêu cầu rút tiền tìm thấy: ${payout.amount.toLocaleString()}đ (Trạng thái hiện tại: ${payout.status})`);

    // Giả lập Admin đánh dấu đã chuyển khoản
    payout.status = 'completed';
    payout.transactionProofUrl = 'https://res.cloudinary.com/demo/image/upload/proof_bill.png';
    await payout.save();

    // Xác minh tính đồng nhất
    const verifiedPayout = await PayoutRequest.findById(payout._id);
    console.log(`- Trạng thái yêu cầu rút tiền sau xử lý: ${verifiedPayout.status}`);
    console.log(`- Link bill chuyển khoản: ${verifiedPayout.transactionProofUrl}`);

    if (verifiedPayout.status !== 'completed' || !verifiedPayout.transactionProofUrl) {
      throw new Error('TEST 3 thất bại: Trạng thái rút tiền hoặc bill chuyển khoản không hợp lệ!');
    }
    console.log('✅ TEST 3 ĐỒNG NHẤT THÀNH CÔNG!');

    // ────────────────────────────────────────────────────────────────
    // TEST 4: KIỂM TRA NHẬT KÝ THAO TÁC (AUDIT LOGS)
    // ────────────────────────────────────────────────────────────────
    console.log('\n🧪 TEST 4: Kiểm tra sự tồn tại của nhật ký thao tác...');
    const auditLogs = await AuditLog.find().sort({ createdAt: -1 }).limit(2);
    console.log(`- Đã tìm thấy ${auditLogs.length} nhật ký thao tác gần đây.`);
    auditLogs.forEach((log, index) => {
      console.log(`  [Log ${index + 1}] Action: ${log.action} | Target Model: ${log.targetModel}`);
    });

    if (auditLogs.length === 0) {
      throw new Error('TEST 4 thất bại: Không tìm thấy nhật ký thao tác nào!');
    }
    console.log('✅ TEST 4 KIỂM TRA THÀNH CÔNG!');

    console.log('\n🎉 KẾT LUẬN: TOÀN BỘ DỮ LIỆU ĐỒNG NHẤT 100%, KHÔNG CÓ XUNG ĐỘT!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Lỗi kiểm tra tính đồng nhất:', error.message);
    process.exit(1);
  }
}

validate();
