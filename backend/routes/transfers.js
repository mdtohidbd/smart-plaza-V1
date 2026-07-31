const express = require('express');
const router = express.Router();
const {
  getTransfers,
  createTransfer,
  returnTransferItems,
  generateTransferInvoice
} = require('../controllers/transferController');
const { protect } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permission');
// 

// Protect all routes
router.use(protect);
// router.use();

// Routes
router.route('/')
  .get(checkPermission('sales', 'read'), getTransfers)
  .post(checkPermission('sales', 'create'), createTransfer);

router.route('/:id/return')
  .post(checkPermission('sales', 'create'), returnTransferItems);

router.route('/:id/invoice')
  .get(checkPermission('sales', 'read'), generateTransferInvoice);

module.exports = router;
