const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  isCorrect: { type: Boolean, required: true, default: false }
});

const questionSchema = new mongoose.Schema({
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  text: { type: String, required: true },
  options: { 
    type: [optionSchema], 
    validate: [v => v.length >= 2, 'Cần ít nhất 2 đáp án'] 
  },
  explanation: { type: String }
}, { timestamps: true });

questionSchema.index({ quiz: 1 });

module.exports = mongoose.model('Question', questionSchema);
