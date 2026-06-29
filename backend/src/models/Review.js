const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true, maxlength: 1000 },
  instructorReply: { type: String, maxlength: 1000, default: null }
}, { timestamps: true });

// Mỗi học viên chỉ được đánh giá 1 lần cho 1 khóa học
reviewSchema.index({ student: 1, course: 1 }, { unique: true });
reviewSchema.index({ course: 1 }); // Phục vụ API lấy danh sách đánh giá của khóa học

module.exports = mongoose.model('Review', reviewSchema);
