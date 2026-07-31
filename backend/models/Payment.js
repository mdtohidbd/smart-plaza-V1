const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  // Core Information
  paymentNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SaleOrder',
    required: true,
    index: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
    index: true
  },
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true,
    index: true
  },

  // Payment Details
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'BDT',
    enum: ['BDT', 'USD', 'EUR']
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['cod', 'emi', 'online', 'bank_transfer', 'mobile_banking', 'wallet'],
    index: true
  },
  paymentGateway: {
    type: String,
    enum: ['sslcommerz', 'stripe', 'bkash', 'nagad', 'rocket', 'manual'],
    index: true
  },
  transactionId: {
    type: String,
    sparse: true,
    index: true
  },

  // Status Tracking
  status: {
    type: String,
    required: true,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'partially_refunded'],
    default: 'pending',
    index: true
  },
  paymentDate: {
    type: Date,
    default: Date.now,
    index: true
  },
  confirmedDate: Date,
  refundedDate: Date,

  // EMI Specific
  emiInvoice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EMIInvoice'
  },
  instalmentNumber: {
    type: Number,
    min: 1
  },

  // Gateway Response
  gatewayResponse: {
    type: mongoose.Schema.Types.Mixed
  },
  riskScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },

  // Reconciliation
  reconciled: {
    type: Boolean,
    default: false,
    index: true
  },
  reconciledDate: Date,
  reconciledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Refund Information
  refundAmount: {
    type: Number,
    min: 0
  },
  refundReason: String,
  refundTransactionId: String,

  // Metadata
  ipAddress: String,
  userAgent: String,
  deviceInfo: {
    type: mongoose.Schema.Types.Mixed
  },
  notes: String,

  // Audit Trail
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
paymentSchema.index({ paymentDate: -1, status: 1 });
paymentSchema.index({ shop: 1, paymentDate: -1 });
paymentSchema.index({ customer: 1, paymentDate: -1 });
paymentSchema.index({ order: 1, status: 1 });

// Virtual for formatted payment number
paymentSchema.virtual('formattedPaymentNumber').get(function() {
  return this.paymentNumber;
});

// Pre-save hook to generate payment number
paymentSchema.pre('save', async function() {
  if (this.isNew && !this.paymentNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    
    // Get count of payments this month
    const count = await this.constructor.countDocuments({
      paymentDate: {
        $gte: new Date(year, date.getMonth(), 1),
        $lt: new Date(year, date.getMonth() + 1, 1)
      }
    });
    
    this.paymentNumber = `PAY-${year}${month}-${String(count + 1).padStart(5, '0')}`;
  }
});

// Static method to get payment statistics
paymentSchema.statics.getPaymentStats = async function(shopId, startDate, endDate) {
  const match = {
    shop: new mongoose.Types.ObjectId(shopId),
    paymentDate: {
      $gte: startDate,
      $lte: endDate
    }
  };

  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalPayments: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        completedPayments: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        completedAmount: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$amount', 0] }
        },
        pendingPayments: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
        },
        pendingAmount: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0] }
        },
        failedPayments: {
          $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
        },
        refundedPayments: {
          $sum: { $cond: [{ $eq: ['$status', 'refunded'] }, 1, 0] }
        },
        refundedAmount: {
          $sum: { $cond: [{ $eq: ['$status', 'refunded'] }, { $ifNull: ['$refundAmount', 0] }, 0] }
        }
      }
    }
  ]);

  return stats[0] || {
    totalPayments: 0,
    totalAmount: 0,
    completedPayments: 0,
    completedAmount: 0,
    pendingPayments: 0,
    pendingAmount: 0,
    failedPayments: 0,
    refundedPayments: 0,
    refundedAmount: 0
  };
};

// Static method to get payment method distribution
paymentSchema.statics.getPaymentMethodDistribution = async function(shopId, startDate, endDate) {
  const match = {
    shop: new mongoose.Types.ObjectId(shopId),
    paymentDate: {
      $gte: startDate,
      $lte: endDate
    },
    status: 'completed'
  };

  return await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$paymentMethod',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' }
      }
    },
    {
      $project: {
        _id: 0,
        method: '$_id',
        count: 1,
        totalAmount: 1,
        percentage: 0 // Will be calculated in controller
      }
    },
    { $sort: { totalAmount: -1 } }
  ]);
};

// Static method to get daily payment trends
paymentSchema.statics.getDailyTrends = async function(shopId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return await this.aggregate([
    {
      $match: {
        shop: new mongoose.Types.ObjectId(shopId),
        paymentDate: { $gte: startDate },
        status: 'completed'
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$paymentDate' }
        },
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' }
      }
    },
    {
      $project: {
        _id: 0,
        date: '$_id',
        count: 1,
        totalAmount: 1
      }
    },
    { $sort: { date: 1 } }
  ]);
};

module.exports = mongoose.model('Payment', paymentSchema);
