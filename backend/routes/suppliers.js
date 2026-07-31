const express = require('express');
const { 
  getSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier
} = require('../controllers/supplierController');
const { protect } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permission');

const router = express.Router();

router.route('/')
  .get(protect, checkPermission('contacts', 'read'), getSuppliers)
  .post(protect, checkPermission('contacts', 'create'), createSupplier);

router.route('/:id')
  .get(protect, checkPermission('contacts', 'read'), getSupplier)
  .put(protect, checkPermission('contacts', 'update'), updateSupplier)
  .delete(protect, checkPermission('contacts', 'delete'), deleteSupplier);

module.exports = router;
