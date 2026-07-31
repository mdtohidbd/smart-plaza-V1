const mongoose = require('mongoose');

const transferSchema = new mongoose.Schema({
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    required: false
  },
  referenceNumber: {
    type: String,
    required: true,
    unique: true
  },
  contact: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  conditions: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Partial', 'Completed'],
    default: 'Pending'
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    modelName: {
      type: String,
      trim: true
    },
    serialNumbers: [{
      type: String,
      trim: true
    }],
    quantityTaken: {
      type: Number,
      required: true,
      min: 1
    },
    returnedQuantity: {
      type: Number,
      default: 0
    }
  }],
  returnTransactions: [{
    date: {
      type: Date,
      default: Date.now
    },
    itemsReturned: [{
      originalProduct: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
      },
      returnedProduct: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
      },
      serialNumbers: [{
        type: String,
        trim: true
      }],
      quantity: {
        type: Number,
        required: true,
        min: 1
      }
    }],
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  note: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Transfer', transferSchema);
