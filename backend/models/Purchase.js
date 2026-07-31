const mongoose = require('mongoose');

const purchaseItemSchema = new mongoose.Schema({
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
  sellingPrice: {
    type: Number,
    required: false,
    min: [0, 'Selling price cannot be negative']
  },
  emiPrice: {
    type: Number,
    required: false,
    min: [0, 'EMI price cannot be negative']
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
  }
});

const purchaseSchema = new mongoose.Schema({
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: false
  },
  purchaseNumber: {
    type: String,
    required: [true, 'Purchase number is required'],
    unique: true,
    trim: true
  },
  challanNumber: {
    type: String,
    trim: true
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true
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
  items: [purchaseItemSchema],
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
    enum: ['Cash', 'Bank', 'Mobile Banking', 'Credit'],
    default: 'Cash'
  },
  status: {
    type: String,
    enum: ['Pending', 'Completed', 'Cancelled', 'Partial'],
    default: 'Completed'
  },
  updateStock: {
    type: Boolean,
    default: false
  },
  note: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Performance Indexes
purchaseSchema.index({ shop: 1, date: -1, status: 1 });
purchaseSchema.index({ date: -1, status: 1 });
purchaseSchema.index({ supplier: 1 });

module.exports = mongoose.model('Purchase', purchaseSchema);