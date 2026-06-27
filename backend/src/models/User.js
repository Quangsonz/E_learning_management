const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Tên không được để trống'], trim: true },
  email: { 
    type: String, 
    required: [true, 'Email không được để trống'], 
    unique: true, 
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Vui lòng cung cấp email hợp lệ']
  },
  password: { type: String, required: true, minlength: 6, select: false },
  role: { type: String, enum: ['student', 'teacher', 'admin'], default: 'student' },
  avatar: { type: String, default: 'default-avatar.png' },
  
  // Auth Extra Fields
  isVerified: { type: Boolean, default: false },
  verificationToken: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  refreshToken: String,
  // Dashboard / Learning Profile fields
  studyStreakDays: { type: Number, default: 0 }, // Số ngày học liên tiếp
  preferences: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }], // Sở thích danh mục để gợi ý
  totalFocusMinutes: { type: Number, default: 0 }, // Tổng thời gian học (phút)
  xp: { type: Number, default: 0 }, // Điểm kinh nghiệm
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }] // Khóa học yêu thích
}, { timestamps: true });

// Tối ưu hóa truy vấn đăng nhập và lấy người dùng theo vai trò
userSchema.index({ role: 1 });
userSchema.index({ xp: -1 }); // Tối ưu hoá truy vấn Leaderboard


// Middleware: Mã hóa password trước khi save
userSchema.pre('save', async function() {
  // Chỉ mã hóa nếu password bị thay đổi (tạo mới hoặc update password)
  if (!this.isModified('password')) return;
  
  // Hash với cost là 12
  this.password = await bcrypt.hash(this.password, 12);
});

// Instance Method: Kiểm tra password
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Instance Method: Tạo token reset password
userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');

  // Mã hóa token và lưu vào db
  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  // Token có giá trị 10 phút
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

// Instance Method: Tạo token verify email
userSchema.methods.createEmailVerificationToken = function() {
  const verifyToken = crypto.randomBytes(32).toString('hex');

  this.verificationToken = crypto.createHash('sha256').update(verifyToken).digest('hex');

  return verifyToken;
};

module.exports = mongoose.model('User', userSchema);
