const express = require('express');
const { 
  getUnits, 
  getUnit, 
  createUnit, 
  updateUnit, 
  deleteUnit
} = require('../controllers/unitController');
const { protect, authorize } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permission');


const router = express.Router();

router.route('/')
  .get(protect, checkPermission('products', 'read'), getUnits)
  .post(protect, checkPermission('products', 'create'), createUnit);

router.route('/:id')
  .get(protect, checkPermission('products', 'read'), getUnit)
  .put(protect, checkPermission('products', 'update'), updateUnit)
  .delete(protect, checkPermission('products', 'delete'), deleteUnit);

module.exports = router;