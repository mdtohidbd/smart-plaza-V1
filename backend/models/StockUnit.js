const mongoose = require('mongoose');

/**
 * StockUnit — represents a single physical unit of a product within a batch.
 * Used when Product.trackSerials = true (high-value items like phones, ACs, TVs).
 *
 * Each unit has a unique serial number / IMEI and tracks its lifecycle:
 * available → sold → (returned → available) or (damaged) or (repossessed)
 */
const stockUnitSchema = new mongoose.Schema({
  batch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StockBatch',
    required: [true, 'Batch reference is required']
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product reference is required']
  },
  // Serial number, IMEI, barcode, or any unique unit identifier
  serialNumber: {
    type: String,
    required: [true, 'Serial number is required'],
    trim: true
  },
  status: {
    type: String,
    enum: {
      values: ['available', 'sold', 'damaged', 'returned', 'repossessed'],
      message: 'Invalid unit status'
    },
    default: 'available'
  },
  // Reference to the Sale when this unit was sold
  saleRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sale',
    required: false
  },
  saleDate: {
    type: Date,
    required: false
  },
  // Notes about damage, repossession, etc.
  statusNote: {
    type: String,
    trim: true
  },
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: false
  }
}, {
  timestamps: true
});

stockUnitSchema.index({ batch: 1 });
stockUnitSchema.index({ product: 1, status: 1 });
stockUnitSchema.index({ serialNumber: 1, shop: 1 });
stockUnitSchema.index({ saleRef: 1 });

module.exports = mongoose.model('StockUnit', stockUnitSchema);
