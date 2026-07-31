const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: false
  },
  contactType: {
    type: String,
    required: [true, 'Contact type is required'],
    enum: {
      values: ['Customer', 'Contact'],
      message: 'Please select a valid contact type'
    }
  },
  customerType: {
    type: String,
    enum: {
      values: ['Individual', 'Business', 'Online'],
      message: 'Please select a valid customer type'
    }
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  businessName: {
    type: String,
    trim: true,
    maxlength: [100, 'Business name cannot exceed 100 characters']
  },
  contactNumber: {
    type: String,
    required: [true, 'Contact number is required'],
    unique: true
  },
  contactName: {
    type: String,
    required: [true, 'Contact name is required'],
    trim: true,
    maxlength: [100, 'Contact name cannot exceed 100 characters']
  },
  businessNumber: {
    type: String,
    trim: true
  },
  openingBalance: {
    type: Number,
    default: 0,
    min: [0, 'Opening balance cannot be negative']
  },
  creditLimit: {
    type: Number,
    default: 0,
    min: [0, 'Credit limit cannot be negative']
  },
  address: {
    type: String,
    trim: true
  },
  note: {
    type: String,
    trim: true
  },
  nidPassportNumber: {
    type: String,
    trim: true
  },
  photo: {
    type: String, // URL to photo
    default: ''
  },
  attachment: {
    type: String, // URL to attachment
    default: ''
  },
  guarantor: {
    type: String,
    trim: true
  },
  workplace: {
    type: String,
    trim: true
  },
  salary: {
    type: Number,
    default: 0
  },
  alternativeContactNumber: {
    type: String,
    trim: true
  },
  totalDue: {
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

// Performance Indexes
customerSchema.index({ contactName: 1 });

module.exports = mongoose.model('Customer', customerSchema);