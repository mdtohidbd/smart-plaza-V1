const express = require('express');
const router = express.Router();
const {
  getQuotations,
  getQuotation,
  createQuotation,
  updateQuotation,
  deleteQuotation,
  updateQuotationStatus,
  convertToInvoice
} = require('../controllers/quotationController');

const { protect, authorize } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permission');

// Apply protection to all routes
router.use(protect);

router
  .route('/')
  .get(checkPermission('sales', 'read'), getQuotations) // Or create a specific quotation permission later
  .post(checkPermission('sales', 'create'), createQuotation);

router
  .route('/:id')
  .get(checkPermission('sales', 'read'), getQuotation)
  .put(checkPermission('sales', 'update'), updateQuotation)
  .delete(checkPermission('sales', 'delete'), deleteQuotation);

router
  .route('/:id/status')
  .put(checkPermission('sales', 'update'), updateQuotationStatus);

router
  .route('/:id/convert')
  .post(checkPermission('sales', 'create'), convertToInvoice);

module.exports = router;
