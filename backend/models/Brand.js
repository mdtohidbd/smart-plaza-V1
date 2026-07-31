const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Brand name is required'],
    trim: true,
    unique: true
  },
  logo: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    trim: true
  },
  website: {
    type: String,
    trim: true
  },
  country: {
    type: String,
    trim: true
  },
  warrantyPolicy: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop'
  }
}, {
  timestamps: true
});

// Index for faster queries
brandSchema.index({ isActive: 1 });
brandSchema.index({ displayOrder: 1 });

module.exports = mongoose.model('Brand', brandSchema);
