const express = require('express');
const { 
  // Template endpoints
  getWarrantyTemplates,
  getWarrantyTemplate,
  createWarrantyTemplate,
  updateWarrantyTemplate,
  deleteWarrantyTemplate,
  getWarrantyTemplatesByProduct,
  // Active warranty endpoints
  getWarranties, 
  getWarranty, 
  createWarranty, 
  updateWarranty, 
  deleteWarranty,
  claimWarranty
} = require('../controllers/warrantyController');
const { protect, authorize } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permission');


const router = express.Router();

// =====================================================
// WARRANTY TEMPLATE ROUTES
// =====================================================

// Must be placed BEFORE /:id to avoid conflict
router.route('/templates/by-product/:productId')
  .get(protect, checkPermission('sales', 'read'), getWarrantyTemplatesByProduct);

router.route('/templates')
  .get(protect, checkPermission('sales', 'read'), getWarrantyTemplates)
  .post(protect, checkPermission('sales', 'create'), createWarrantyTemplate);

router.route('/templates/:id')
  .get(protect, checkPermission('sales', 'read'), getWarrantyTemplate)
  .put(protect, checkPermission('sales', 'update'), updateWarrantyTemplate)
  .delete(protect, checkPermission('sales', 'delete'), deleteWarrantyTemplate);

// =====================================================
// ACTIVE WARRANTY ROUTES
// =====================================================

router.route('/')
  .get(protect, checkPermission('sales', 'read'), getWarranties)
  .post(protect, checkPermission('sales', 'create'), createWarranty);

router.route('/:id')
  .get(protect, checkPermission('sales', 'read'), getWarranty)
  .put(protect, checkPermission('sales', 'update'), updateWarranty)
  .delete(protect, checkPermission('sales', 'delete'), deleteWarranty);

router.route('/:id/claim')
  .put(protect, checkPermission('sales', 'update'), claimWarranty);

module.exports = router;