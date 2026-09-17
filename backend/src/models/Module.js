const mongoose = require('mongoose');

const moduleSchema = new mongoose.Schema({
  course: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Course', 
    required: [true, 'Khóa học là trường bắt buộc'], 
    index: true 
  },
  title: { 
    type: mongoose.Schema.Types.Mixed, 
    required: [true, 'Tiêu đề chương học là trường bắt buộc'] 
  },
  description: { 
    type: mongoose.Schema.Types.Mixed, 
    default: '' 
  },
  order: { 
    type: Number, 
    required: true, 
    default: 0 
  }
}, { timestamps: true });

// Compound index để lấy và sắp xếp các chương nhanh chóng theo từng khóa học
moduleSchema.index({ course: 1, order: 1 });
moduleSchema.index({ 'title.vi': 1 });
moduleSchema.index({ 'title.en': 1 });

// Cascading delete middleware khi xóa chương học
moduleSchema.pre('findOneAndDelete', async function() {
  const doc = await this.model.findOne(this.getQuery());
  if (doc) {
    const moduleId = doc._id;
    const Lesson = mongoose.model('Lesson');
    const Question = mongoose.model('Question');
    const Progress = mongoose.model('Progress');

    // Tìm tất cả bài học thuộc module này
    const lessons = await Lesson.find({ module: moduleId });
    const lessonIds = lessons.map(l => l._id);

    if (lessonIds.length > 0) {
      await Question.deleteMany({ lesson: { $in: lessonIds } });
      await Progress.updateMany(
        { completedLessons: { $in: lessonIds } },
        { $pull: { completedLessons: { $in: lessonIds } } }
      );
      await Progress.updateMany(
        { lastAccessedLesson: { $in: lessonIds } },
        { $unset: { lastAccessedLesson: '' } }
      );
      await Lesson.deleteMany({ module: moduleId });
    }
  }
});

moduleSchema.pre('deleteMany', async function() {
  const query = this.getQuery();
  const docs = await this.model.find(query);
  const moduleIds = docs.map(d => d._id);
  if (moduleIds.length > 0) {
    const Lesson = mongoose.model('Lesson');
    const Question = mongoose.model('Question');
    const Progress = mongoose.model('Progress');

    const lessons = await Lesson.find({ module: { $in: moduleIds } });
    const lessonIds = lessons.map(l => l._id);

    if (lessonIds.length > 0) {
      await Question.deleteMany({ lesson: { $in: lessonIds } });
      await Progress.updateMany(
        { completedLessons: { $in: lessonIds } },
        { $pull: { completedLessons: { $in: lessonIds } } }
      );
      await Progress.updateMany(
        { lastAccessedLesson: { $in: lessonIds } },
        { $unset: { lastAccessedLesson: '' } }
      );
      await Lesson.deleteMany({ module: { $in: moduleIds } });
    }
  }
});

module.exports = mongoose.model('Module', moduleSchema);
