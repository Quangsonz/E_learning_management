const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  title: { 
    type: String, 
    required: true 
  },
  message: { 
    type: String, 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['system', 'course', 'payment', 'certificate'], 
    default: 'system' 
  },
  link: { 
    type: String // Link để điều hướng khi người dùng click vào thông báo (Vd: /courses/123)
  },
  isRead: { 
    type: Boolean, 
    default: false 
  }
}, { timestamps: true });

// Tối ưu hóa truy vấn lấy thông báo chưa đọc của 1 user cụ thể
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
