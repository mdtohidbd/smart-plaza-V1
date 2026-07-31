const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: false
  },
  type: {
    type: String,
    required: [true, 'Account type is required'],
    enum: {
      values: ['Cash', 'Bank', 'Mobile Banking'],
      message: 'Please select a valid account type'
    }
  },
  name: {
    type: String,
    required: [true, 'Account name is required'],
    trim: true
  },
  accountNumber: {
    type: String,
    trim: true
  },
  bankName: {
    type: String,
    trim: true
  },
  branchName: {
    type: String,
    trim: true
  },
  openingBalance: {
    type: Number,
    default: 0,
    min: [0, 'Opening balance cannot be negative']
  },
  currentBalance: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Account', accountSchema);