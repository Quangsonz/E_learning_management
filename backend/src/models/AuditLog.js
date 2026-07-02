const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  actor: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: [true, 'Admin thực hiện không được để trống'] 
  },
  action: { 
    type: String, 
    required: [true, 'Hành động không được để trống'] 
  },
  targetId: { 
    type: mongoose.Schema.Types.ObjectId 
  },
  targetModel: { 
    type: String 
  },
  details: { 
    type: mongoose.Schema.Types.Mixed 
  },
  ipAddress: String,
  userAgent: String
}, { timestamps: true });

// Tối ưu hóa truy vấn xem nhật ký thao tác
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ actor: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
