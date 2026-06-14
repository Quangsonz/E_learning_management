const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  score: { type: Number, required: true }, // Số điểm tuyệt đối
  scorePercentage: { type: Number, required: true }, // Tính theo %
  isPassed: { type: Boolean, required: true }
}, { timestamps: true });

// Hỗ trợ tra cứu lịch sử kiểm tra của học viên nhanh chóng
resultSchema.index({ student: 1, quiz: 1 });

module.exports = mongoose.model('Result', resultSchema);
