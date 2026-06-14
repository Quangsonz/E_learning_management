const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  title: { type: String, required: true, trim: true },
  videoUrl: { type: String, required: true },
  duration: { type: Number, default: 0 }, // Giây
  order: { type: Number, required: true } // Thứ tự sắp xếp trong khóa học
}, { timestamps: true });

// Sắp xếp bài học nhanh chóng khi hiển thị theo khóa
lessonSchema.index({ course: 1, order: 1 });

module.exports = mongoose.model('Lesson', lessonSchema);
