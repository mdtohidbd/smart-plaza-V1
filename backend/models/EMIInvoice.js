const mongoose = require('mongoose');

const emiInvoiceSchema = new mongoose.Schema({
  // Customer Information
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  customerName: {
    type: String,
    required: true
  },
  customerPhone: {
    type: String,
    required: true
  },
  customerAddress: {
    type: String,
    required: true
  },
  showroom: {
    type: String,
    required: true
  },
  
  // Invoice Details
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  invoiceDate: {
    type: Date,
    default: Date.now
  },
  relatedSaleOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SaleOrder'
  },
  
  // Product Details
  products: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    name: String,
    quantity: Number,
    unitPrice: Number,
    total: Number
  }],
  
  // Financial Details
  subtotal: {
    type: Number,
    required: true,
    default: 0
  },
  deliveryCharge: {
    type: Number,
    default: 0
  },
  installationCost: {
    type: Number,
    default: 0
  },
  cardCharge: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  tax: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    default: 0
  },
  
  // EMI Plan Details
  emiPlan: {
    planType: {
      type: String,
      enum: ['3months', '6months', '12months', 'custom'],
      required: true
    },
    duration: {
      type: Number,
      required: true
    },
    interestRate: {
      type: Number,
      default: 0
    },
    interestAmount: {
      type: Number,
      default: 0
    },
    totalPayableAmount: {
      type: Number,
      required: true
    },
    monthlyInstalment: {
      type: Number,
      required: true
    }
  },
  
  // Payment Status
  downPayment: {
    amount: {
      type: Number,
      default: 0
    },
    paidAt: Date,
    method: {
      type: String,
      enum: ['cash', 'card', 'bkash', 'nagad', 'cheque']
    }
  },
  outstandingBalance: {
    type: Number,
    required: true,
    default: 0
  },
  paidAmount: {
    type: Number,
    default: 0
  },
  totalLateFeePaid: {
    type: Number,
    default: 0
  },
  
  // Status Tracking
  status: {
    type: String,
    enum: ['pending', 'active', 'completed', 'cancelled', 'defaulted'],
    default: 'pending'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Collection Schedule
  instalments: [{
    instalmentNumber: Number,
    dueDate: Date,
    amount: Number,
    paidAmount: {
      type: Number,
      default: 0
    },
    lateFeePaid: {
      type: Number,
      default: 0
    },
    paidDate: Date,
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'bkash', 'nagad', 'cheque']
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'partial', 'overdue', 'waived'],
      default: 'pending'
    },
    notes: String
  }],
  
  // Additional Info
  notes: String,
  termsAndConditions: String,
  warrantyPeriod: {
    type: Number,
    default: 1
  },
  
  // Repossessed Assets
  repossessedProducts: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    quantity: {
      type: Number,
      default: 1
    },
    repossessedAt: {
      type: Date,
      default: Date.now
    },
    notes: String
  }],
  
  // Audit Trail
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedSR: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save middleware to calculate totals
emiInvoiceSchema.pre('save', function() {
  // Calculate subtotal from products
  this.subtotal = this.products.reduce((sum, item) => sum + (item.total || 0), 0);
  
  // Calculate total amount
  this.totalAmount = this.subtotal + this.deliveryCharge + this.installationCost + this.cardCharge - this.discount + this.tax;
  
  // Calculate EMI totals
  if (this.emiPlan) {
    this.emiPlan.interestAmount = (this.totalAmount * this.emiPlan.interestRate) / 100;
    this.emiPlan.totalPayableAmount = this.totalAmount + this.emiPlan.interestAmount - this.downPayment.amount;
    this.emiPlan.monthlyInstalment = this.emiPlan.totalPayableAmount / this.emiPlan.duration;
  }
  
  // Update outstanding balance
  this.outstandingBalance = (this.emiPlan ? this.emiPlan.totalPayableAmount : this.totalAmount) - this.paidAmount;
  
  // Update instalment amounts if not already set
  if (this.instalments && this.instalments.length > 0) {
    this.instalments.forEach(instalment => {
      if (!instalment.amount) {
        instalment.amount = this.emiPlan.monthlyInstalment;
      }
    });
  }
  
  this.updatedAt = Date.now();
});

// Performance Indexes
emiInvoiceSchema.index({ customer: 1 });
emiInvoiceSchema.index({ status: 1 });

module.exports = mongoose.model('EMIInvoice', emiInvoiceSchema);
