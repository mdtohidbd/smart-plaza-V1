const express = require('express');
const {
  createStockIn,
  getStockInHistory,
  getStockInDetail,
  createDirectStockIn
} = require('../controllers/stockInController');
const { protect } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permission');

const router = express.Router();

// POST /api/stock-in — Create a full stock-in entry
router.route('/')
  .post(protect, checkPermission('inventory', 'create'), createStockIn)
  .get(protect, checkPermission('inventory', 'read'), getStockInHistory);

// POST /api/stock-in/direct — Direct stock-in entry without purchase invoice
router.route('/direct')
  .post(protect, checkPermission('inventory', 'create'), createDirectStockIn);

// GET /api/stock-in/:purchaseId — Get detail for a specific stock-in
router.route('/:purchaseId')
  .get(protect, checkPermission('inventory', 'read'), getStockInDetail);

module.exports = router;
