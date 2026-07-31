const mongoose = require('mongoose');

const incomeSchema = new mongoose.Schema({
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: false
  },
  incomeHead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'IncomeHead',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Income name is required'],
    trim: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required']
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Bank', 'Mobile Banking', 'Refund'],
    default: 'Cash'
  },
  accountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account'
  },
  description: {
    type: String,
    trim: true
  },
  reference: {
    type: String,
    trim: true
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  }
}, {
  timestamps: true
});

// Performance Indexes
incomeSchema.index({ shop: 1, date: -1 });
incomeSchema.index({ date: -1 });

module.exports = mongoose.model('Income', incomeSchema);