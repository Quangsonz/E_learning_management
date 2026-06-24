const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  completedLessons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' }],
  progressPercentage: { type: Number, default: 0, min: 0, max: 100 },
  // Dashboard fields
  lastAccessedLesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', default: null },
  isCompleted: { type: Boolean, default: false },
  lastStudiedAt: { type: Date, default: null } // Dùng để tính study streak
}, { timestamps: true });

// Chỉ có 1 bản ghi tiến trình duy nhất cho mỗi học viên tại 1 khóa học
progressSchema.index({ student: 1, course: 1 }, { unique: true });

module.exports = mongoose.model('Progress', progressSchema);
