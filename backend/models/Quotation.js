const mongoose = require('mongoose');

const quotationItemSchema = new mongoose.Schema({
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
  warranties: [{
    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WarrantyTemplate'
    },
    duration: Number,
    warrantyName: String
  }]
});

const quotationSchema = new mongoose.Schema({
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: false
  },
  quotationNumber: {
    type: String,
    required: [true, 'Quotation number is required'],
    unique: true,
    trim: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  validityDays: {
    type: Number,
    default: 15, // Default 15 days validity
    required: true
  },
  validUntil: {
    type: Date,
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [quotationItemSchema],
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
  cardCharge: {
    type: Number,
    default: 0,
    min: [0, 'Card charge cannot be negative']
  },
  otherCharges: [{
    name: String,
    amount: {
      type: Number,
      min: [0, 'Amount cannot be negative']
    }
  }],
  total: {
    type: Number,
    required: true,
    min: [0, 'Total cannot be negative']
  },
  status: {
    type: String,
    enum: ['Draft', 'Pending', 'Approved', 'Rejected', 'Converted'],
    default: 'Pending'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  note: {
    type: String,
    trim: true
  },
  subject: {
    type: String,
    default: 'Price Quotation for Products.'
  },
  vatAitInfo: {
    type: String,
    enum: ['excluding VAT and AIT', 'including VAT and AIT', 'Including VAT and ecluding AIT'],
    default: 'excluding VAT and AIT'
  },
  paymentMethod: {
    type: String,
    default: 'Payment must be done before/after delivery of the product by cash/cheque in favor of\n(Smart Plaza) Acc Number: 206914 3880001, BRAC Bank, Branch: Khulna\nRouting number: 060471545'
  },
  relatedInformation: {
    type: String,
    default: 'The package contains 1 indoor and 1 outdoor unit with 10 feet copper pipe, connection cable and remote.\nAdditional charge 590 Taka per feet will be applicable if extra copper pipe and connection cable required.'
  },
  quoteGivenByName: {
    type: String,
    default: 'Md. Reajul Hasan Raj'
  },
  quoteGivenByDesignation: {
    type: String,
    default: 'Branch Manager'
  }
}, {
  timestamps: true
});

// Pre-validate hook to automatically calculate validUntil if not set or validityDays changes
quotationSchema.pre('validate', function() {
  if (this.isModified('date') || this.isModified('validityDays') || !this.validUntil) {
    const validUntilDate = new Date(this.date);
    validUntilDate.setDate(validUntilDate.getDate() + this.validityDays);
    this.validUntil = validUntilDate;
  }
});

module.exports = mongoose.model('Quotation', quotationSchema);
