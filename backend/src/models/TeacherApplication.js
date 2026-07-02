const mongoose = require('mongoose');

const teacherApplicationSchema = new mongoose.Schema({
  student: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: [true, 'Học viên ứng tuyển không được để trống'] 
  },
  specialty: { 
    type: String, 
    required: [true, 'Chuyên môn đăng ký không được để trống'] 
  },
  bio: { 
    type: String, 
    required: [true, 'Mô tả bản thân không được để trống'] 
  },
  resumeUrl: { 
    type: String, 
    required: [true, 'Link CV/Chứng chỉ không được để trống'] 
  },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  adminNotes: String,
  processedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }
}, { timestamps: true });

// Tối ưu hóa truy vấn các đơn ứng tuyển chưa duyệt
teacherApplicationSchema.index({ status: 1 });
teacherApplicationSchema.index({ student: 1 });

module.exports = mongoose.model('TeacherApplication', teacherApplicationSchema);
