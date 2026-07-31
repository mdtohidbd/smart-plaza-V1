const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop'
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  type: {
    type: String,
    enum: ['Stock', 'Online Order', 'Installment Reminder', 'Auto Message Sent', 'Payment', 'System'],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'low'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  actionLink: {
    type: String
  },
  actionLabel: {
    type: String
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },
  /** Who should see this: shop staff (scoped by shop), Super Admins only, or end customers (ecommerce). */
  audience: {
    type: String,
    enum: ['shop', 'super_admin', 'customer'],
    default: 'shop'
  },
  /** Specific roles that should receive this notification (e.g., ['Sales Person', 'Manager']). Overrides general audience if present. */
  targetRoles: [{
    type: String
  }],
  /** Priority level for sorting. Higher number = higher priority. e.g., 10 for Installment Reminders. */
  priority: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Notification', notificationSchema);