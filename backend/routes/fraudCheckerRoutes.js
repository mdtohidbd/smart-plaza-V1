const express = require('express');
const router = express.Router();
const {
  check,
  stats,
  recent,
  getOrderFraudCheck,
  checkOrderFraud,
  getAlerts,
  exportData
} = require('../controllers/fraudCheckerController');
const { protect, authorize } = require('../middleware/auth');

// Note: Ensure that your system uses the correct auth middleware
// If your system uses a different pattern for auth, adjust accordingly.

// Routes
router.post('/check', protect, authorize('Super Admin', 'Manager', 'E-Commerce Admin'), check);
router.get('/stats', protect, authorize('Super Admin', 'Manager', 'E-Commerce Admin'), stats);
router.get('/recent', protect, authorize('Super Admin', 'Manager', 'E-Commerce Admin'), recent);
router.get('/alerts', protect, authorize('Super Admin', 'Manager', 'E-Commerce Admin'), getAlerts);
router.get('/export', protect, authorize('Super Admin', 'Manager', 'E-Commerce Admin'), exportData);

router.route('/order/:orderId')
  .get(protect, authorize('Super Admin', 'Manager', 'E-Commerce Admin'), getOrderFraudCheck);

router.route('/order/:orderId/check')
  .post(protect, authorize('Super Admin', 'Manager', 'E-Commerce Admin'), checkOrderFraud);

module.exports = router;
