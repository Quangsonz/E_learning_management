const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  module: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', index: true },
  title: { type: mongoose.Schema.Types.Mixed, required: true },
  videoUrl: { type: String, required: true },
  videoPublicId: { type: String, default: null },
  provider: { type: String, enum: ['cloudinary', 'youtube'], default: 'cloudinary' },
  duration: { type: Number, default: 0 }, // Giây
  order: { type: Number, required: true }, // Thứ tự sắp xếp trong module/khóa học
  isFreePreview: { type: Boolean, default: false } // Cho phép học thử miễn phí mà không cần ghi danh
}, { timestamps: true });

// Pre-save hook: tự động phát hiện provider nếu chưa được chỉ định
lessonSchema.pre('save', function() {
  if (this.isModified('videoUrl') || !this.provider) {
    const isYouTube = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/i.test(this.videoUrl);
    this.provider = isYouTube ? 'youtube' : 'cloudinary';
    if (isYouTube) {
      this.videoPublicId = null;
    }
  }
});

// Sắp xếp bài học nhanh chóng khi hiển thị theo khóa và theo module
lessonSchema.index({ course: 1, order: 1 });
lessonSchema.index({ module: 1, order: 1 });
lessonSchema.index({ course: 1, module: 1, order: 1 });
lessonSchema.index({ 'title.vi': 1 });
lessonSchema.index({ 'title.en': 1 });
lessonSchema.index({ title: 1 });

// Cascading delete middleware khi xóa bài giảng
lessonSchema.pre('findOneAndDelete', async function() {
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
});

module.exports = mongoose.model('Lesson', lessonSchema);

