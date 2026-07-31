const mongoose = require('mongoose');

const profitDistributionSchema = new mongoose.Schema({
  period: {
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12
    },
    year: {
      type: Number,
      required: true
    }
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  totalSalesRevenue: {
    type: Number,
    required: true,
    default: 0
  },
  totalPurchaseCost: {
    type: Number,
    required: true,
    default: 0
  },
  totalExpenses: {
    type: Number,
    required: true,
    default: 0
  },
  totalIncome: {
    type: Number,
    required: true,
    default: 0
  },
  grossProfit: {
    type: Number,
    required: true,
    default: 0
  },
  netProfit: {
    type: Number,
    required: true,
    default: 0
  },
  totalInvestmentPool: {
    type: Number,
    required: true,
    default: 0
  },
  distributions: [{
    investor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Investor',
      required: true
    },
    sharePercentage: {
      type: Number,
      required: true
    },
    profitAmount: {
      type: Number,
      required: true
    }
  }],
  status: {
    type: String,
    enum: ['Draft', 'Finalized'],
    default: 'Draft'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  finalizedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Ensure only one distribution per month/year
profitDistributionSchema.index({ 'period.month': 1, 'period.year': 1 }, { unique: true });

module.exports = mongoose.model('ProfitDistribution', profitDistributionSchema);
