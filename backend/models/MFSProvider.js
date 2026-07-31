const mongoose = require('mongoose');

const mfsProviderSchema = new mongoose.Schema({
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: false
  },
  name: {
    type: String,
    required: [true, 'MFS Provider name is required'],
    trim: true
  },
  feePerThousand: {
    type: Number,
    required: [true, 'Fee per 1000 TK is required'],
    min: [0, 'Fee cannot be negative'],
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('MFSProvider', mfsProviderSchema);
