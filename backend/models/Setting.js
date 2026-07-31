const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: false
  },
  companyName: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true
  },
  companyAddress: {
    type: String,
    required: [true, 'Company address is required'],
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required']
  },
  alternativePhone: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email'
    ]
  },
  website: {
    type: String,
    trim: true
  },
  logo: {
    type: String, // URL to logo
    default: ''
  },
  favicon: {
    type: String, // URL to favicon
    default: ''
  },
  enableMultipleWarehouse: {
    type: Boolean,
    default: false
  },
  enableWholesale: {
    type: Boolean,
    default: true
  },
  enableRetail: {
    type: Boolean,
    default: false
  },
  smsApiKey: {
    type: String,
    trim: true
  },
  smsSenderId: {
    type: String,
    trim: true
  },
  enableSalesNotification: {
    type: Boolean,
    default: false
  },
  enableSalesReturnNotification: {
    type: Boolean,
    default: false
  },
  enablePaymentReceivedNotification: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Create a single document for settings
settingSchema.index({}, { unique: true }); // Only one settings document allowed

module.exports = mongoose.model('Setting', settingSchema);