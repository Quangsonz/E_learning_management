const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  discussion: { type: mongoose.Schema.Types.ObjectId, ref: 'Discussion', required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isAcceptedAnswer: { type: Boolean, default: false } // Only instructor/admin can mark this
}, { timestamps: true });

module.exports = mongoose.model('Comment', commentSchema);
