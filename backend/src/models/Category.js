const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, unique: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  description: { type: String, maxlength: 500 }
}, { timestamps: true });

// Tìm kiếm danh mục theo slug để làm URL thân thiện
categorySchema.index({ slug: 1 });

module.exports = mongoose.model('Category', categorySchema);
