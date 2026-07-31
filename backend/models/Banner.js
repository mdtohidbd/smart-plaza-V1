const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true
  },
  image: {
    type: String,
    required: true
  },
  images: {
    type: [String],
    default: []
  },
  link: {
    type: String,
    default: '/shop/products'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  position: {
    type: String,
    enum: ['main', 'side_top', 'side_bottom'],
    default: 'main'
  },
  targetCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  targetProduct: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Banner', bannerSchema);
