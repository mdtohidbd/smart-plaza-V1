const mongoose = require('mongoose');

const unitSchema = new mongoose.Schema({
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: false
  },
  name: {
    type: String,
    required: [true, 'Unit name is required'],
    trim: true,
    unique: true,
    maxlength: [20, 'Unit name cannot exceed 20 characters']
  },
  symbol: {
    type: String,
    required: [true, 'Unit symbol is required'],
    trim: true,
    maxlength: [30, 'Unit symbol cannot exceed 30 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [100, 'Description cannot exceed 100 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Unit', unitSchema);