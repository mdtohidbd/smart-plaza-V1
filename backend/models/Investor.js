const mongoose = require('mongoose');

const withdrawalRequestSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: [true, 'Withdrawal amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  type: {
    type: String,
    enum: ['Capital', 'Profit'],
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  requestDate: {
    type: Date,
    default: Date.now
  },
  processedDate: {
    type: Date
  },
  adminNote: {
    type: String,
    trim: true
  }
});

const investorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    description: 'Optional link to a login-enabled User account'
  },
  name: {
    type: String,
    required: [true, 'Investor name is required'],
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  imageUrl: {
    type: String,
    trim: true
  },
  nid: {
    type: String,
    trim: true
  },
  address: {
    street: String,
    city: String,
    district: String,
    zipCode: String
  },
  nomineeName: {
    type: String,
    trim: true
  },
  nomineeRelation: {
    type: String,
    trim: true
  },
  nomineePhone: {
    type: String,
    trim: true
  },
  investmentAmount: {
    type: Number,
    required: [true, 'Investment amount is required'],
    min: [0, 'Investment amount cannot be negative']
  },
  profitSharePercentage: {
    type: Number,
    default: 0,
    description: 'Calculated dynamically: (investmentAmount / totalPool) * 100'
  },
  totalProfitEarned: {
    type: Number,
    default: 0,
    description: 'Cumulative profit distributed to this investor'
  },
  totalWithdrawn: {
    type: Number,
    default: 0,
    description: 'Cumulative amount withdrawn (Profit only)'
  },
  investedDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Closed'],
    default: 'Active'
  },
  bankAccount: {
    accountNumber: String,
    bankName: String,
    branchName: String,
    routingNumber: String
  },
  notes: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  withdrawalRequests: [withdrawalRequestSchema]
}, {
  timestamps: true
});

module.exports = mongoose.model('Investor', investorSchema);
