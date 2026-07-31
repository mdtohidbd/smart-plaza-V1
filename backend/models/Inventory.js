const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: false
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: {
      values: [
        'Opening Stock',
        'Purchase',
        'Sale',
        'Purchase Return',
        'Sale Return',
        'Damage',
        'Free Product',
        'Adjustment',
        'Transfer Out',
        'Transfer In'
      ],
      message: 'Please select a valid inventory type'
    }
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'referenceModel'
  },
  referenceModel: {
    type: String,
    enum: ['Sale', 'Purchase', 'SaleReturn', 'PurchaseReturn', 'Transfer']
  },
  quantity: {
    type: Number,
    required: true
  },
  unitPrice: {
    type: Number,
    required: true,
    min: [0, 'Unit price cannot be negative']
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  note: {
    type: String,
    trim: true
  },
  serialNumbers: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Performance Indexes
inventorySchema.index({ shop: 1, date: -1, type: 1 });
inventorySchema.index({ date: -1, type: 1 });
inventorySchema.index({ product: 1 });

module.exports = mongoose.model('Inventory', inventorySchema);