const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: false
  },
  title: {
    type: String,
    required: [true, 'Message title is required'],
    trim: true
  },
  body: {
    type: String,
    required: [true, 'Message body is required']
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipientType: {
    type: String,
    required: true,
    enum: {
      values: ['All Customers', 'All Suppliers', 'Single Customer', 'Single Supplier'],
      message: 'Please select a valid recipient type'
    }
  },
  recipients: [{
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'recipientModel'
  }],
  recipientModel: {
    type: String,
    enum: ['Customer', 'Supplier']
  },
  messageType: {
    type: String,
    enum: ['SMS', 'Email', 'WhatsApp'],
    default: 'SMS'
  },
  status: {
    type: String,
    enum: ['Sent', 'Failed', 'Pending', 'Processing'],
    default: 'Pending'
  },
  smsDeliveryInfo: {
    type: Object,
    default: null
  },
  sentAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Message', messageSchema);