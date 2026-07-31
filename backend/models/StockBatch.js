const mongoose = require('mongoose');

/**
 * StockBatch — represents a single stock-in event for a product.
 * Each time stock is received (via purchase or opening stock), a new batch is created.
 * This allows different purchase prices for the same product across different purchase dates.
 *
 * Example: AC 1.5T bought Jan 2025 @ ৳38,000 (batch 1) and Mar 2025 @ ৳40,000 (batch 2)
 * are tracked as two separate batches, each with their own purchase price, selling price,
 * and remaining quantity.
 */
const stockBatchSchema = new mongoose.Schema({
  batchNumber: {
    type: String,
    required: [true, 'Batch number is required'],
    unique: true,
    trim: true
    // Format: BATCH-YYYYMMDD-XXXX (e.g. BATCH-20250608-0001)
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product is required']
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: false
  },
  // Links to Purchase record if created via the purchase workflow
  purchaseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Purchase',
    required: false
  },
  // Identifies if this is an opening stock batch (pre-system inventory)
  isOpeningStock: {
    type: Boolean,
    default: false
  },
  purchaseDate: {
    type: Date,
    required: [true, 'Purchase date is required'],
    default: Date.now
  },
  // Cost price for this specific batch
  purchasePrice: {
    type: Number,
    required: [true, 'Purchase price is required'],
    min: [0, 'Purchase price cannot be negative']
  },
  // Retail selling price for this batch
  sellingPrice: {
    type: Number,
    required: [true, 'Selling price is required'],
    min: [0, 'Selling price cannot be negative']
  },
  // EMI price for this batch (optional)
  emiPrice: {
    type: Number,
    required: false,
    min: [0, 'EMI price cannot be negative']
  },
  // Optional override for ecommerce price (if null, uses sellingPrice)
  ecommercePriceOverride: {
    type: Number,
    required: false,
    min: [0, 'Ecommerce price cannot be negative']
  },
  // Total quantity received in this batch
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1']
  },
  // Current remaining sellable quantity (decremented on each sale)
  remainingQty: {
    type: Number,
    required: true,
    min: [0, 'Remaining quantity cannot be negative']
  },
  // Whether this batch is still active (false when all units sold or manually closed)
  isActive: {
    type: Boolean,
    default: true
  },
  // Whether this batch's product is listed on ecommerce (inherits from Product if not set)
  isListedOnEcommerce: {
    type: Boolean,
    default: false
  },
  note: {
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

// Compound indexes for common queries
stockBatchSchema.index({ product: 1, isActive: 1, purchaseDate: 1 });
stockBatchSchema.index({ product: 1, remainingQty: 1 });
stockBatchSchema.index({ purchaseId: 1 });
stockBatchSchema.index({ shop: 1, isActive: 1 });

/**
 * Virtual: effective ecommerce price
 * Returns override if set, otherwise the batch's sellingPrice
 */
stockBatchSchema.virtual('effectiveEcommercePrice').get(function () {
  return this.ecommercePriceOverride || this.sellingPrice;
});

/**
 * Pre-save: auto-deactivate when remaining qty hits 0
 */
stockBatchSchema.pre('save', function () {
  if (this.remainingQty <= 0) {
    this.isActive = false;
  } else {
    this.isActive = true;
  }
});

// Performance Indexes
stockBatchSchema.index({ product: 1 });
stockBatchSchema.index({ supplier: 1 });
stockBatchSchema.index({ shop: 1, purchaseDate: -1 });

module.exports = mongoose.model('StockBatch', stockBatchSchema);
