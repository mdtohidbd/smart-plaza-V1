const express = require('express');
const { 
  getInventory,
  getInventoryByProduct,
  getCurrentStock,
  getCurrentStockByProduct,
  getCurrentStockFromBatches,
  createInventory,
  createOpeningStock,
  getLowStockItems,
  recordDamagedProduct,
  getDamagedProducts,
  recordFreeProduct,
  getFreeProducts
} = require('../controllers/inventoryController');
const { protect, authorize } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permission');



const router = express.Router();

router.route('/')
  .get(protect, checkPermission('inventory', 'read'), getInventory)
  .post(protect, checkPermission('inventory', 'create'), createInventory);

router.route('/product/:productId')
  .get(protect, checkPermission('inventory', 'read'), getInventoryByProduct);

router.route('/current')
  .get(protect, checkPermission('inventory', 'read'), getCurrentStock);

// New batch-based stock calculation (Phase 16+)
router.route('/current-batches')
  .get(protect, checkPermission('inventory', 'read'), getCurrentStockFromBatches);

router.route('/current/:productId')
  .get(protect, checkPermission('inventory', 'read'), getCurrentStockByProduct);

router.route('/low-stock')
  .get(protect, checkPermission('inventory', 'read'), getLowStockItems);

router.route('/damaged')
  .post(protect, checkPermission('inventory', 'create'), recordDamagedProduct)
  .get(protect, checkPermission('inventory', 'read'), getDamagedProducts);

router.route('/free')
  .post(protect, checkPermission('inventory', 'create'), recordFreeProduct)
  .get(protect, checkPermission('inventory', 'read'), getFreeProducts);

router.route('/opening-stock')
  .post(protect, checkPermission('inventory', 'create'), createOpeningStock);

module.exports = router;