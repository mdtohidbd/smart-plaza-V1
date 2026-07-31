const express = require('express');
const {
  getBatchesByProduct,
  getActiveBatches,
  getAllBatches,
  getBatch,
  updateBatch,
  deactivateBatch,
  getBatchUnits,
  getStockSummary
} = require('../controllers/stockBatchController');
const { protect } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permission');

const router = express.Router();

// GET /api/stock-batches — All batches (with optional filters)
router.route('/')
  .get(protect, checkPermission('inventory', 'read'), getAllBatches);

// GET /api/stock-batches/summary — Aggregated stock per product (from batches)
router.route('/summary')
  .get(protect, checkPermission('inventory', 'read'), getStockSummary);

// GET /api/stock-batches/active — Only batches with remaining qty
router.route('/active')
  .get(protect, checkPermission('inventory', 'read'), getActiveBatches);

// GET /api/stock-batches/product/:productId — All batches for a product
router.route('/product/:productId')
  .get(protect, checkPermission('inventory', 'read'), getBatchesByProduct);

// GET/PUT /api/stock-batches/:id — Single batch detail and update
router.route('/:id')
  .get(protect, checkPermission('inventory', 'read'), getBatch)
  .put(protect, checkPermission('inventory', 'update'), updateBatch);

// PATCH /api/stock-batches/:id/deactivate
router.route('/:id/deactivate')
  .patch(protect, checkPermission('inventory', 'update'), deactivateBatch);

// GET /api/stock-batches/:id/units — Serial units in a batch
router.route('/:id/units')
  .get(protect, checkPermission('inventory', 'read'), getBatchUnits);

module.exports = router;
