const express = require('express');
const {
  getEcommerceProducts,
  getAllProductsWithEcommerceStatus,
  toggleEcommerceVisibility,
  togglePreorder,
  updateEcommerceSettings,
  bulkUpdateEcommerceOrder,
  getEcommercePriceBreakdown,
  getPreorderDemand
} = require('../controllers/ecommerceAdminController');
const { protect } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permission');

const router = express.Router();

// GET /api/ecommerce-admin/products — Only listed products (for public display)
router.route('/products')
  .get(protect, checkPermission('ecommerce', 'read'), getEcommerceProducts);

// GET /api/ecommerce-admin/all-products — All products with ecommerce status (admin panel)
router.route('/all-products')
  .get(protect, checkPermission('ecommerce', 'read'), getAllProductsWithEcommerceStatus);

// GET /api/ecommerce-admin/preorder-demand — Pending online order demand per product
router.route('/preorder-demand')
  .get(protect, checkPermission('ecommerce', 'read'), getPreorderDemand);

// PUT /api/ecommerce-admin/reorder — Bulk reorder
router.route('/reorder')
  .put(protect, checkPermission('ecommerce', 'update'), bulkUpdateEcommerceOrder);

// PATCH /api/ecommerce-admin/products/:id/toggle — Toggle listing
router.route('/products/:id/toggle')
  .patch(protect, checkPermission('ecommerce', 'update'), toggleEcommerceVisibility);

// PATCH /api/ecommerce-admin/products/:id/toggle-preorder — Toggle preorder
router.route('/products/:id/toggle-preorder')
  .patch(protect, checkPermission('ecommerce', 'update'), togglePreorder);

// PUT /api/ecommerce-admin/products/:id — Update ecommerce settings
router.route('/products/:id')
  .put(protect, checkPermission('ecommerce', 'update'), updateEcommerceSettings);

// GET /api/ecommerce-admin/products/:id/price-breakdown — Price across batches
router.route('/products/:id/price-breakdown')
  .get(protect, checkPermission('ecommerce', 'read'), getEcommercePriceBreakdown);

module.exports = router;
