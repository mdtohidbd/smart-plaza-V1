const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Route name is required'],
    trim: true,
    unique: true
  },
  code: {
    type: String,
    required: [true, 'Route code is required'],
    trim: true,
    unique: true
  },
  area: {
    type: String,
    trim: true
  },
  assignedSR: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  customers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  }],
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Route', routeSchema);
