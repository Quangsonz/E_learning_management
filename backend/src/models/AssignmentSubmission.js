const mongoose = require('mongoose');

const submissionFileSchema = new mongoose.Schema({
  name: { type: String, required: true },
  url: { type: String, required: true }
});

const assignmentSubmissionSchema = new mongoose.Schema({
  assignment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  submittedFiles: { 
    type: [submissionFileSchema],
    validate: [v => v.length >= 1, 'Cần ít nhất một tệp đính kèm']
  },
  studentNotes: { type: String, trim: true },
  grade: { type: Number, min: 0, default: null }, // Điểm chấm từ giáo viên
  feedback: { type: String, trim: true, default: null }, // Nhận xét từ giáo viên
  gradedAt: { type: Date, default: null },
  status: { 
    type: String, 
    enum: ['submitted', 'graded'], 
    default: 'submitted' 
  }
}, { timestamps: true });

// Đảm bảo mỗi học sinh chỉ có duy nhất một bản nộp cho mỗi bài tập
assignmentSubmissionSchema.index({ assignment: 1, student: 1 }, { unique: true });
// Index tối ưu hóa cho giáo viên lọc bài chưa chấm
assignmentSubmissionSchema.index({ status: 1 });

module.exports = mongoose.model('AssignmentSubmission', assignmentSubmissionSchema);
