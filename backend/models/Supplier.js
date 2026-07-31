const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: false
  },
  name: {
    type: String,
    required: [true, 'Supplier name is required'],
    trim: true,
    maxlength: [100, 'Supplier name cannot exceed 100 characters']
  },
  contactName: {
    type: String,
    trim: true,
    maxlength: [100, 'Contact name cannot exceed 100 characters']
  },
  contactNumber: {
    type: String,
    required: [true, 'Contact number is required'],
    unique: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  companyName: {
    type: String,
    trim: true,
    maxlength: [150, 'Company name cannot exceed 150 characters']
  },
  representedBrands: {
    type: String,
    trim: true
  },
  bankInfo: {
    bankName: { type: String, trim: true },
    accountName: { type: String, trim: true },
    accountNumber: { type: String, trim: true },
    routingNumber: { type: String, trim: true }
  },
  address: {
    type: String,
    trim: true
  },
  openingBalance: {
    type: Number,
    default: 0
  },
  totalDue: {
    type: Number,
    default: 0
  },
  note: {
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

module.exports = mongoose.model('Supplier', supplierSchema);
