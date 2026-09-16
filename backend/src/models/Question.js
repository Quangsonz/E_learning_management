const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema({
  text: { type: mongoose.Schema.Types.Mixed, required: true },
  isCorrect: { type: Boolean, required: true, default: false }
});

const questionSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' },
  lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' },
  text: { type: mongoose.Schema.Types.Mixed, required: true },
  points: { type: Number, required: true, default: 1 },
  options: { 
    type: [optionSchema], 
    validate: [v => v.length >= 2, 'Cần ít nhất 2 đáp án'] 
  },
  explanation: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

questionSchema.index({ course: 1 });
questionSchema.index({ quiz: 1 });
questionSchema.index({ lesson: 1 });

module.exports = mongoose.model('Question', questionSchema);
