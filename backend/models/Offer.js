const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['campaign', 'bank'],
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  subtitle: {
    type: String,
  },
  description: {
    type: String,
  },
  image: {
    type: String,
  },
  code: {
    type: String,
  },
  color: {
    type: String,
  },
  tag: {
    type: String,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
  },
  discountType: {
    type: String,
    enum: ['percentage', 'flat'],
    default: 'percentage',
  },
  discountPercentage: {
    type: Number,
    min: 0,
    max: 100,
  },
  discountAmount: {
    type: Number,
    min: 0,
  }
}, { timestamps: true });

module.exports = mongoose.model('Offer', offerSchema);
