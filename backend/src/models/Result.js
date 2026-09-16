const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  type: { type: String, enum: ['standard', 'practice'], default: 'standard' },
  score: { type: Number, required: true }, // Số điểm tuyệt đối
  scorePercentage: { type: Number, required: true }, // Tính theo %
  isPassed: { type: Boolean, required: true },
  totalQuestions: { type: Number, default: 0 },
  correctCount: { type: Number, default: 0 }
}, { timestamps: true });

// Hỗ trợ tra cứu lịch sử kiểm tra của học viên nhanh chóng
resultSchema.index({ student: 1, quiz: 1 });
resultSchema.index({ student: 1, course: 1, type: 1 });

module.exports = mongoose.model('Result', resultSchema);

