const express = require('express');
const { 
  testSmsConfig,
  sendSms,
  sendBulkSms,
  sendDynamicSms,
  checkSmsBalance,
  updateSmsConfig,
  getSmsConfig
} = require('../controllers/smsController');
const { protect, authorize } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permission');

const router = express.Router();

// Test SMS configuration
router.route('/test-config').post(protect, checkPermission('messages', 'create'), testSmsConfig);

// Get SMS configuration
router.route('/config').get(protect, checkPermission('messages', 'read'), getSmsConfig);

// Update SMS configuration
router.route('/config').put(protect, checkPermission('messages', 'create'), updateSmsConfig);

// Send single SMS
router.route('/send').post(protect, checkPermission('messages', 'create'), sendSms);

// Send bulk SMS
router.route('/send-bulk').post(protect, checkPermission('messages', 'create'), sendBulkSms);

// Send dynamic SMS
router.route('/send-dynamic').post(protect, checkPermission('messages', 'create'), sendDynamicSms);

// Check SMS balance
router.route('/balance').get(protect, checkPermission('messages', 'read'), checkSmsBalance);

module.exports = router;