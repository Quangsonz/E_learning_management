const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
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

module.exports = mongoose.model('Course', courseSchema);
