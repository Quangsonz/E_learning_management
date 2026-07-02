const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  attachmentUrl: { type: String, default: null }, // Link tài liệu hoặc đề bài đính kèm (Cloudinary/Drive)
  maxPoints: { type: Number, default: 100, min: 0 },
  dueDate: { type: Date, required: true }
}, { timestamps: true });

// Index tối ưu hóa truy vấn danh sách bài tập theo khóa học và hạn nộp
assignmentSchema.index({ course: 1, dueDate: 1 });

module.exports = mongoose.model('Assignment', assignmentSchema);
