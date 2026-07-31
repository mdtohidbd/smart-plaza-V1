const express = require('express');
const { 
  getContacts,
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer
} = require('../controllers/contactController');
const { protect, authorize } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permission');


const router = express.Router();

// All contacts route
router.route('/')
  .get(protect, checkPermission('contacts', 'read'), getContacts);

// Customers routes
router.route('/customers')
  .get(protect, checkPermission('contacts', 'read'), getCustomers)
  .post(protect, checkPermission('contacts', 'create'), createCustomer);

router.route('/customers/:id')
  .get(protect, checkPermission('contacts', 'read'), getCustomer)
  .put(protect, checkPermission('contacts', 'update'), updateCustomer)
  .delete(protect, checkPermission('contacts', 'delete'), deleteCustomer);


module.exports = router;