const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { type: mongoose.Schema.Types.Mixed, required: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  description: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

// Tìm kiếm danh mục theo slug để làm URL thân thiện
categorySchema.index({ 'name.vi': 1 });
categorySchema.index({ 'name.en': 1 });
categorySchema.index({ name: 1 });

module.exports = mongoose.model('Category', categorySchema);
