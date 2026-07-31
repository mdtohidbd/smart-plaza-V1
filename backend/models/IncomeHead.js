const mongoose = require('mongoose');

const incomeHeadSchema = new mongoose.Schema({
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: false
  },
  name: {
    type: String,
    required: [true, 'Income head name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

incomeHeadSchema.index({ name: 1, shop: 1 }, { unique: true });

module.exports = mongoose.model('IncomeHead', incomeHeadSchema);