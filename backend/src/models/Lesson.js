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

// Cascading delete middleware khi xóa bài giảng
lessonSchema.pre('findOneAndDelete', async function(next) {

  const doc = await this.model.findOne(this.getQuery());
  if (doc) {
    const lessonId = doc._id;
    const Question = mongoose.model('Question');
    const Progress = mongoose.model('Progress');

    // 1. Xóa tất cả các câu hỏi thuộc bài học này
    await Question.deleteMany({ lesson: lessonId });

    // 2. Cập nhật bảng Progress: loại bỏ lessonId khỏi completedLessons và reset lastAccessedLesson nếu trùng
    await Progress.updateMany(
      { completedLessons: lessonId },
      { $pull: { completedLessons: lessonId } }
    );
    await Progress.updateMany(
      { lastAccessedLesson: lessonId },
      { $unset: { lastAccessedLesson: "" } }
    );
  }
  next();
});

module.exports = mongoose.model('Lesson', lessonSchema);

