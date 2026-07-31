const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

const { checkPermission } = require('../middleware/permission');
const {
  initiatePayment,
  verifyPayment,
  getPayment,
  getPayments,
  getPaymentAnalytics,
  processRefund
} = require('../controllers/paymentController');

// Public routes (for e-commerce checkout and webhooks)
router.route('/initiate')
  .post(initiatePayment);

router.route('/verify')
  .post(verifyPayment);

// Protected routes (require authentication)
router.route('/')
  .get(protect, checkPermission('sales', 'read'), getPayments);

router.route('/:id')
  .get(protect, checkPermission('sales', 'read'), getPayment);

router.route('/:id/refund')
  .put(protect, checkPermission('sales', 'update'), processRefund);

router.route('/analytics')
  .get(protect, checkPermission('sales', 'read'), getPaymentAnalytics);

module.exports = router;
