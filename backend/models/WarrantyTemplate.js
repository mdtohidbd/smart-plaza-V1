const mongoose = require('mongoose');

const warrantyTemplateSchema = new mongoose.Schema({
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: false
  },
  name: {
    type: String,
    required: [true, 'Warranty name is required'],
    trim: true,
    maxlength: [100, 'Warranty name cannot exceed 100 characters']
  },
  brand: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand',
    required: [true, 'Brand is required']
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required']
  },
  durationMonths: {
    type: Number,
    required: [true, 'Warranty duration is required'],
    min: [1, 'Duration must be at least 1 month'],
    max: [120, 'Duration cannot exceed 120 months']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index for fast lookup by brand + category
warrantyTemplateSchema.index({ shop: 1, brand: 1, category: 1 });
warrantyTemplateSchema.index({ isActive: 1 });

module.exports = mongoose.model('WarrantyTemplate', warrantyTemplateSchema);
