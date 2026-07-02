const mongoose = require('mongoose');

const payoutRequestSchema = new mongoose.Schema({
  instructor: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: [true, 'Giảng viên rút tiền không được để trống'] 
  },
  amount: { 
    type: Number, 
    required: [true, 'Số tiền rút không được để trống'],
    min: [50000, 'Số tiền rút tối thiểu là 50,000đ']
  },
  status: { 
    type: String, 
    enum: ['pending', 'completed', 'rejected'], 
    default: 'pending' 
  },
  bankInfo: {
    bankName: { type: String, required: true },
    accountNumber: { type: String, required: true },
    accountName: { type: String, required: true }
  },
  transactionProofUrl: String, // Link bill chuyển khoản trên Cloudinary
  processedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }
}, { timestamps: true });

// Tối ưu hóa truy vấn các yêu cầu rút tiền chưa xử lý
payoutRequestSchema.index({ status: 1 });
payoutRequestSchema.index({ instructor: 1 });

module.exports = mongoose.model('PayoutRequest', payoutRequestSchema);
