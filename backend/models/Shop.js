const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Shop name is required'],
    trim: true,
    maxlength: [100, 'Shop name cannot exceed 100 characters']
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  address: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email'
    ]
  },
  isActive: {
    type: Boolean,
    default: true
  },
  settings: {
    // Shop-specific settings can be stored here
    currency: {
      type: String,
      default: 'BDT' // Default currency
    },
    taxRate: {
      type: Number,
      default: 0
    },
    discountRate: {
      type: Number,
      default: 0
    },
    logo: {
      type: String, // URL to shop logo
      default: ''
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Shop', shopSchema);
