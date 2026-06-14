const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  title: { type: String, required: true, trim: true },
  passingScore: { type: Number, required: true, min: 0, max: 100 }, // Tính theo %
  timeLimit: { type: Number } // Phút (có thể không gò bó thời gian)
}, { timestamps: true });

quizSchema.index({ course: 1 });

module.exports = mongoose.model('Quiz', quizSchema);
