const mongoose = require('mongoose');
const slugify = require('slugify');

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, unique: true },
  description: { type: String, required: true },
  price: { type: Number, required: true, min: [0, 'Giá không được âm'] },
  estimatedPrice: { type: Number, default: 0, min: 0 },
  discountPercentage: { type: Number, default: 0, min: 0, max: 100 },
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  status: { type: String, enum: ['draft', 'pending_review', 'published'], default: 'draft' },
  moderatorNotes: { type: String },
  thumbnailUrl: { type: String },
  averageRating: { type: Number, default: 0, min: 0, max: 5 }
}, { timestamps: true });

// Indexes giúp lọc khóa học nhanh chóng trên trang chủ
courseSchema.index({ status: 1, category: 1 });
courseSchema.index({ instructor: 1 });
courseSchema.index({ title: 'text', description: 'text' }); // Tìm kiếm theo từ khóa (Full-text search)

// Document middleware: Tự động tạo slug trước khi save
courseSchema.pre('save', function() {
  if (!this.slug || this.isModified('title')) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
});

// Query middleware: Tự động populate instructor và category
courseSchema.pre(/^find/, function() {
  this.populate({
    path: 'instructor',
    select: 'name email role avatar'
  }).populate({
    path: 'category',
    select: 'name slug'
  });
});

// Cascading delete middleware khi xóa khóa học
courseSchema.pre('findOneAndDelete', async function(next) {
  const doc = await this.model.findOne(this.getQuery());
  if (doc) {
    const courseId = doc._id;
    const Lesson = mongoose.model('Lesson');
    const Progress = mongoose.model('Progress');
    const Quiz = mongoose.model('Quiz');
    const Review = mongoose.model('Review');
    const Discussion = mongoose.model('Discussion');
    const Enrollment = mongoose.model('Enrollment');
    const Certificate = mongoose.model('Certificate');
    const Question = mongoose.model('Question');
    const Result = mongoose.model('Result');

    // Tìm và xóa quizzes cùng kết quả + câu hỏi của nó
    const quizzes = await Quiz.find({ course: courseId });
    const quizIds = quizzes.map(q => q._id);
    if (quizIds.length > 0) {
      await Result.deleteMany({ quiz: { $in: quizIds } });
      await Question.deleteMany({ quiz: { $in: quizIds } });
    }
    await Quiz.deleteMany({ course: courseId });

    // Tìm và xóa bài học cùng câu hỏi luyện tập (nếu có)
    const lessons = await Lesson.find({ course: courseId });
    const lessonIds = lessons.map(l => l._id);
    if (lessonIds.length > 0) {
      await Question.deleteMany({ lesson: { $in: lessonIds } });
    }
    await Lesson.deleteMany({ course: courseId });

    // Xóa tiến độ học tập
    await Progress.deleteMany({ course: courseId });

    // Xóa đánh giá khóa học
    await Review.deleteMany({ course: courseId });

    // Xóa thảo luận bài học & bình luận lồng nhau
    const discussions = await Discussion.find({ course: courseId });
    const discussionIds = discussions.map(d => d._id);
    if (discussionIds.length > 0) {
      await mongoose.model('Comment').deleteMany({ discussion: { $in: discussionIds } });
    }
    await Discussion.deleteMany({ course: courseId });

    // Xóa enrollments
    await Enrollment.deleteMany({ course: courseId });

    // Xóa certificates
    await Certificate.deleteMany({ course: courseId });
  }
  next();
});

module.exports = mongoose.model('Course', courseSchema);

