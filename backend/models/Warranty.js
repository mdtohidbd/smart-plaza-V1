const mongoose = require('mongoose');

const warrantySchema = new mongoose.Schema({
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: false
  },
  warrantyTemplate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WarrantyTemplate'
  },
  warrantyName: {
    type: String,
    trim: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  sale: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sale',
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['Active', 'Expired', 'Claimed', 'Replaced', 'Cancelled'],
    default: 'Active'
  },
  claimDate: {
    type: Date
  },
  replacementProduct: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  replacementDate: {
    type: Date
  },
  serialNumber: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for quick lookups
warrantySchema.index({ shop: 1, sale: 1 });
warrantySchema.index({ status: 1 });

module.exports = mongoose.model('Warranty', warrantySchema);