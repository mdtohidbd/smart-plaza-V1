const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [1000, 'Product name cannot exceed 1000 characters']
  },
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: false
  },
  brand: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand',
    required: [true, 'Brand is required']
  },
  sku: {
    type: String,
    required: false,
    trim: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  unit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Unit',
    required: true
  },
  alertQuantity: {
    type: Number,
    default: 10,
    min: [0, 'Alert quantity cannot be negative']
  },
  // DEPRECATED: Price fields are now managed per StockBatch.
  // Kept for backward compatibility and migration purposes only.
  purchasePrice: {
    type: Number,
    required: false,
    min: [0, 'Purchase price cannot be negative']
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
  // DEPRECATED: openingStock is now handled via StockBatch (isOpeningStock=true).
  // Kept for migration reference.
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: false
  },
  model: {
    type: String,
    required: [true, 'Model number is required'],
    trim: true
  },
  warrantyPeriod: {
    type: String,
    required: false,
    trim: true
  },
  variant: {
    type: String,
    required: false,
    trim: true
  },
  color: {
    type: String,
    required: false,
    trim: true
  },
  colors: [{
    name: {
      type: String,
      trim: true
    },
    code: {
      type: String,
      trim: true
    }
  }],
  size: {
    type: String,
    required: false,
    trim: true
  },
  weight: {
    type: String,
    required: false,
    trim: true
  },
  mrp: {
    type: Number,
    required: [true, 'MRP is required'],
    min: [0, 'MRP cannot be negative']
  },
  taxPercentage: {
    type: Number,
    default: 0,
    min: [0, 'Tax percentage cannot be negative'],
    max: [100, 'Tax percentage cannot exceed 100%']
  },
  // DEPRECATED: Use StockBatch with isOpeningStock=true instead.
  openingStock: {
    type: Number,
    default: 0,
    min: [0, 'Opening stock cannot be negative']
  },

  // ─── Batch Inventory & Ecommerce Fields ─────────────────────────────────────
  // Enable per-unit serial/IMEI tracking for this product (e.g. phones, ACs)
  trackSerials: {
    type: Boolean,
    default: true
  },
  // Whether this product is listed on the public ecommerce storefront
  isListedOnEcommerce: {
    type: Boolean,
    default: false
  },
  // Whether this product can be pre-ordered (shows as In Stock on storefront even with 0 actual stock)
  // If true + isListedOnEcommerce: shown as "In Stock" regardless of batch stock levels
  isPreorder: {
    type: Boolean,
    default: true
  },
  // Display order on ecommerce (lower = shown first)
  ecommerceOrder: {
    type: Number,
    default: 9999
  },
  // Whether this product is sold via retail POS channel
  isRetailProduct: {
    type: Boolean,
    default: true
  },
  landingPageSection: {
    type: String,
    enum: ['Default', 'Featured Products', 'Best Sellers', 'Hot Deals'],
    default: 'Default'
  },
  image: {
    type: String, // URL to primary image
    default: ''
  },
  images: [{
    type: String // Array of additional image URLs
  }],
  attachment: {
    type: String, // URL to attachment
    default: ''
  },
  additionalInfo: {
    type: String,
    trim: true
  },
  specifications: [{
    category: {
      type: String,
      required: true
    },
    items: [{
      label: {
        type: String,
        required: true
      },
      value: {
        type: String,
        required: true
      }
    }]
  }],
  features: [{
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    image: {
      type: String
    },
    layout: {
      type: String,
      enum: ['left', 'right'],
      default: 'left'
    }
  }],
  highlights: [{
    type: String // Highlight points
  }],
  highlightImages: [{
    type: String // 4-5 images for the highlights section
  }],
  metaTitle: {
    type: String,
    trim: true,
    maxlength: [70, 'Meta title cannot exceed 70 characters']
  },
  metaDescription: {
    type: String,
    trim: true,
    maxlength: [160, 'Meta description cannot exceed 160 characters']
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  numOfReviews: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Calculate current stock based on opening stock and inventory transactions
productSchema.virtual('currentStock').get(function() {
  // This is a simple calculation. For accurate stock, use getActualStock() method.
  // Formula: Opening Stock + Purchases - Sales + Returns
  return this.openingStock + this.purchaseQuantity - this.saleQuantity;
});

// Method to get actual stock from StockBatches
productSchema.methods.getActualStock = async function(shopId) {
  let StockBatch;
  try {
    StockBatch = mongoose.model('StockBatch');
  } catch (e) {
    StockBatch = require('./StockBatch');
  }
  
  const matchFilter = { product: this._id };
  if (shopId) {
    matchFilter.shop = mongoose.Types.ObjectId.isValid(shopId) ? new mongoose.Types.ObjectId(shopId) : shopId;
  }
  
  // Get all active stock batches for this product and sum up remainingQty
  const result = await StockBatch.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: null,
        totalStock: { $sum: '$remainingQty' }
      }
    }
  ]);
  
  return result.length > 0 ? result[0].totalStock : 0;
};

// Performance Indexes (non-unique)
productSchema.index({ name: 1 });
productSchema.index({ category: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ model: 1 });
productSchema.index({ sku: 1 }, { background: true });
productSchema.index({ shop: 1 });

module.exports = mongoose.model('Product', productSchema);