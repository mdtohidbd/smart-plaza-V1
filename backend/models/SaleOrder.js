const mongoose = require('mongoose');

// Sub-schema for a single split payment entry
const paymentEntrySchema = new mongoose.Schema({
  method: {
    type: String,
    enum: ['Cash', 'Bank', 'Card', 'MFS'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: [0, 'Payment amount cannot be negative']
  },
  posMachine: { type: mongoose.Schema.Types.ObjectId, ref: 'POSMachine' },
  posMachineName: { type: String, trim: true },
  mfsProvider: { type: mongoose.Schema.Types.ObjectId, ref: 'MFSProvider' },
  mfsProviderName: { type: String, trim: true },
  feePercentage: { type: Number, default: 0 },
  feeAmount: { type: Number, default: 0 },
  bankName: { type: String, trim: true },
  transactionId: { type: String, trim: true }
}, { _id: false });


const saleItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1']
  },
  unitPrice: {
    type: Number,
    required: true,
    min: [0, 'Unit price cannot be negative']
  },
  discount: {
    type: Number,
    default: 0,
    min: [0, 'Discount cannot be negative']
  },
  tax: {
    type: Number,
    default: 0,
    min: [0, 'Tax cannot be negative']
  },
  purchaseCost: {
    type: Number,
    default: 0,
    min: [0, 'Purchase cost cannot be negative']
  },
  batchesUsed: [{
    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StockBatch'
    },
    quantity: Number,
    purchasePrice: Number
  }],
  serialNumbers: [{
    type: String,
    trim: true
  }]
});

const saleOrderSchema = new mongoose.Schema({
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: false
  },
  type: {
    type: String,
    enum: ['retail', 'wholesale', 'online'],
    default: 'wholesale',
    required: true
  },
  orderNumber: {
    type: String,
    required: [true, 'Order number is required'],
    unique: true,
    trim: true
  },
  invoiceNumber: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  // Store customer email for guest checkout lookup
  customerEmail: {
    type: String,
    trim: true,
    lowercase: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  shippingAddress: {
    type: String,
    trim: true
  },
  assignedSR: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  deliveredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  route: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route'
  },
  items: [saleItemSchema],
  subTotal: {
    type: Number,
    required: true,
    min: [0, 'Subtotal cannot be negative']
  },
  discount: {
    type: Number,
    default: 0,
    min: [0, 'Discount cannot be negative']
  },
  tax: {
    type: Number,
    default: 0,
    min: [0, 'Tax cannot be negative']
  },
  deliveryCharge: {
    type: Number,
    default: 0,
    min: [0, 'Delivery charge cannot be negative']
  },
  installationCost: {
    type: Number,
    default: 0,
    min: [0, 'Installation cost cannot be negative']
  },
  additionalExpense: {
    type: Number,
    default: 0,
    min: [0, 'Additional expense cannot be negative']
  },
  isOperatingExpense: {
    type: Boolean,
    default: false
  },
  isOperatingDelivery: {
    type: Boolean,
    default: false
  },
  isOperatingInstallation: {
    type: Boolean,
    default: false
  },
  cardCharge: {
    type: Number,
    default: 0,
    min: [0, 'Card charge cannot be negative']
  },
  total: {
    type: Number,
    required: true,
    min: [0, 'Total cannot be negative']
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: [0, 'Paid amount cannot be negative']
  },
  dueAmount: {
    type: Number,
    default: 0,
    min: [0, 'Due amount cannot be negative']
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Bank', 'Mobile Banking', 'Credit', 'Cash on Delivery', 'MFS', 'Card', 'Split'],
    default: 'Cash'
  },
  // New: structured split payments array
  payments: [paymentEntrySchema],
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Out for Delivery', 'Delivered', 'Returned', 'Cancelled'],
    default: 'Pending'
  },
  // E-commerce order status for customer tracking
  orderStatus: {
    type: String,
    enum: ['Processing', 'Confirmed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'Returned'],
    default: 'Processing'
  },
  approvalStatus: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  deliveredAt: {
    type: Date
  },
  // Dual invoice support
  customerInvoiceTotal: {
    type: Number,
    min: [0, 'Customer invoice total cannot be negative']
  },
  govtInvoiceTotal: {
    type: Number,
    min: [0, 'Govt invoice total cannot be negative']
  },
  note: {
    type: String,
    trim: true
  },
  qrCode: {
    type: String,
    unique: true,
    sparse: true
  },
  commissionRate: {
    type: Number,
    default: 0
  },
  commissionAmount: {
    type: Number,
    default: 0
  },
  returnedItems: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1']
    },
    unitPrice: {
      type: Number,
      required: true,
      min: [0, 'Unit price cannot be negative']
    },
    returnDate: {
      type: Date,
      default: Date.now
    },
    note: {
      type: String,
      trim: true
    }
  }],
  fraudCheck: {
    phoneNumber: String,
    totalOrders: { type: Number, default: 0 },
    totalDeliveries: { type: Number, default: 0 },
    totalCancellations: { type: Number, default: 0 },
    successRatio: { type: Number, default: 0 },
    riskLevel: { 
      type: String, 
      enum: ['LOW', 'MEDIUM', 'HIGH', 'NEW'],
      default: 'NEW'
    },
    recommendation: String,
    couriers: { type: Array, default: [] },
    reports: { type: Array, default: [] },
    errors: { type: Array, default: [] },
    checkedAt: Date
  }
}, {
  timestamps: true
});

// Pre-save hook to automatically calculate dual invoice totals
saleOrderSchema.pre('save', async function() {
  console.log('[SALEORDER PRE-SAVE] Hook called');
  
  try {
    const originalTotal = this.total || 0;
    console.log('[SALEORDER PRE-SAVE] Original total:', originalTotal);
    
    // Calculate customer invoice total with conditional pricing
    if (originalTotal > 100000) {
      this.customerInvoiceTotal = 100000;
    } else if (originalTotal > 50000) {
      this.customerInvoiceTotal = 50000;
    } else {
      this.customerInvoiceTotal = originalTotal;
    }
    
    // Calculate government invoice total with conditional pricing
    if (originalTotal > 100000) {
      this.govtInvoiceTotal = originalTotal + 1000;
    } else if (originalTotal > 50000) {
      this.govtInvoiceTotal = originalTotal + 500;
    } else {
      this.govtInvoiceTotal = originalTotal;
    }
    
    console.log('[SALEORDER PRE-SAVE] Calculated - Customer:', this.customerInvoiceTotal, 'Govt:', this.govtInvoiceTotal);
  } catch (error) {
    console.error('[SALEORDER PRE-SAVE] Error in hook:', error.message);
    throw error; // Throw error to abort save
  }
});

// Performance Indexes
saleOrderSchema.index({ shop: 1, date: -1, status: 1 });
saleOrderSchema.index({ date: -1, status: 1 });
saleOrderSchema.index({ customer: 1 });
saleOrderSchema.index({ orderNumber: 1 });

module.exports = mongoose.model('SaleOrder', saleOrderSchema);