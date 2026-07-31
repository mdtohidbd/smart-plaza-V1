const mongoose = require('mongoose');

const posMachineSchema = new mongoose.Schema({
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: false
  },
  name: {
    type: String,
    required: [true, 'POS Terminal name is required'],
    trim: true
  },
  bankName: {
    type: String,
    trim: true,
    default: ''
  },
  feePercentage: {
    type: Number,
    required: [true, 'Transaction fee is required'],
    min: [0, 'Fee cannot be negative'],
    max: [100, 'Fee cannot exceed 100%'],
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('POSMachine', posMachineSchema);
