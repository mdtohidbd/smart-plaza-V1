const express = require('express');
const { 
  getMessages,
  getMessage,
  createMessage,
  sendMessageToAllCustomers,
  sendMessageToAllSuppliers,
  sendCustomerMessage,
  getCustomerMessages,
  sendSupplierMessage,
  getSupplierMessages,
  getSMSBalance
} = require('../controllers/messageController');
const { protect, authorize } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permission');


const router = express.Router();

router.route('/')
  .get(protect, checkPermission('messages', 'read'), getMessages)
  .post(protect, checkPermission('messages', 'create'), createMessage);

// Specific routes should be defined before dynamic routes
router.route('/customer')
  .post(protect, checkPermission('messages', 'create'), sendCustomerMessage)
  .get(protect, checkPermission('messages', 'read'), getCustomerMessages);

router.route('/supplier')
  .post(protect, checkPermission('messages', 'create'), sendSupplierMessage)
  .get(protect, checkPermission('messages', 'read'), getSupplierMessages);

router.route('/customers').post(protect, checkPermission('messages', 'create'), sendMessageToAllCustomers);
router.route('/suppliers').post(protect, checkPermission('messages', 'create'), sendMessageToAllSuppliers);

// SMS Balance endpoint
router.get('/sms-balance', protect, getSMSBalance);

router.route('/:id')
  .get(protect, checkPermission('messages', 'read'), getMessage);

module.exports = router;