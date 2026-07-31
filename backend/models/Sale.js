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
  // For Card payments: reference to POS Machine
  posMachine: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'POSMachine'
  },
  posMachineName: { type: String, trim: true },
  // For MFS payments: reference to MFS Provider
  mfsProvider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MFSProvider'
  },
  mfsProviderName: { type: String, trim: true },
  feePercentage: {
    type: Number,
    default: 0,
    min: [0, 'Fee cannot be negative']
  },
  feeAmount: {
    type: Number,
    default: 0,
    min: [0, 'Fee amount cannot be negative']
  },
  // For Bank payments
  bankName: { type: String, trim: true },
  // Transaction reference
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
  serialNumber: {
    type: String,
    trim: true
  },
  productName: {
    type: String,
    trim: true
  },
  model: {
    type: String,
    trim: true
  },
  color: {
    type: String,
    trim: true
  },
  warranty: {
    type: String,
    trim: true
  }
});

const saleSchema = new mongoose.Schema({
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
  invoiceType: {
    type: String,
    enum: ['Cash', 'EMI', 'Delivery', 'Tax', 'VAT Adjustment'],
    default: 'Cash',
    required: true
  },
  invoiceNumber: {
    type: String,
    required: [true, 'Invoice number is required'],
    unique: true,
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
    ref: 'User'
  },
  deliveredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  route: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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
  // Legacy single payment method (kept for backward compatibility with old records)
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Bank', 'Mobile Banking', 'Credit', 'bKash', 'Nagad', 'Card', 'MFS', 'Split'],
    default: 'Cash'
  },
  // New: structured split payments array — each entry represents one payment channel
  payments: [paymentEntrySchema],
  status: {
    type: String,
    enum: ['Pending', 'Completed', 'Cancelled', 'Partial'],
    default: 'Completed'
  },
  isEmi: {
    type: Boolean,
    default: false
  },
  emiOption: {
    duration: Number,
    interestRate: Number,
    downPayment: Number
  },
  // E-commerce order status for customer tracking or Retail EMI status
  orderStatus: {
    type: String,
    default: 'Processing'
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
  invoices: {
    customerSales: { type: Object },
    customerTax: { type: Object },
    fabricatedSales: { type: Object },
    fabricatedTax: { type: Object }
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
  }]
}, {
  timestamps: true
});

saleSchema.virtual('calculatedRevenue').get(function() {
  const emiInterest = (this.invoiceType === 'EMI' || this.emiOption) && this.emiOption?.interestRate
    ? (this.total * this.emiOption.interestRate / 100) : 0;
  return this.total + emiInterest;
});

saleSchema.virtual('calculatedCogs').get(function() {
  let cogs = this.invoices?.customerTax?.totalPurchaseValue;
  if (cogs === undefined || cogs === null || cogs === 0) {
    cogs = this.items?.reduce((sum, item) => {
      // Use purchaseCost if available, fallback to product.purchasePrice if populated
      const cost = item.purchaseCost || (item.product && item.product.purchasePrice) || 0;
      return sum + (cost * item.quantity);
    }, 0) || 0;
  }
  return cogs;
});

saleSchema.virtual('calculatedExpenses').get(function() {
  const paymentFees = (this.payments || []).reduce((sum, p) => sum + (p.feeAmount || 0), 0);
  return (this.deliveryCharge || 0) + (this.installationCost || 0) + (this.additionalExpense || 0) + paymentFees;
});

saleSchema.virtual('calculatedNetProfit').get(function() {
  return this.calculatedRevenue - this.calculatedCogs - this.calculatedExpenses;
});

// Ensure virtuals are included in JSON and Object representations
saleSchema.set('toJSON', { virtuals: true });
saleSchema.set('toObject', { virtuals: true });

// Performance Indexes
saleSchema.index({ customer: 1 });
saleSchema.index({ date: -1 });
saleSchema.index({ status: 1 });
saleSchema.index({ type: 1 });
saleSchema.index({ invoiceNumber: 1 });
saleSchema.index({ shop: 1, date: -1, status: 1 });
saleSchema.index({ shop: 1, date: -1 });

module.exports = mongoose.model('Sale', saleSchema);