const mongoose = require('mongoose');
const slugify = require('slugify');

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, unique: true },
  description: { type: String, required: true },
  price: { type: Number, required: true, min: [0, 'Giá không được âm'] },
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  status: { type: String, enum: ['draft', 'published'], default: 'draft' },
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

module.exports = mongoose.model('Course', courseSchema);
