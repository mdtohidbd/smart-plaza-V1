const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: false
  },
  expenseHead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExpenseHead',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Expense name is required'],
    trim: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative']
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
expenseSchema.index({ shop: 1, date: -1 });
expenseSchema.index({ date: -1 });

module.exports = mongoose.model('Expense', expenseSchema);