const express = require('express');
const mongoose = require('mongoose');
const { 
  getSales, 
  getSale, 
  updateSale, 
  updateSaleExpenses,
  updateSalePayment,
  updateSaleWithInventory,
  deleteSale,
  recordSalesDueCollection,
  getDueCollections,
  createSalesReturn,
  getSalesReturns,
  generateInvoice,
  generateCustomerInvoice,
  generateGovtInvoice,
  updateOrderStatus,
  generateSaleQRCode,
  recalculateCustomerDues,
  getSaleInvoices
} = require('../controllers/sharedSaleController');
const { getRetailSales, createRetailSale } = require('../controllers/retailSaleController');
const { createEmiSale } = require('../controllers/emiSaleController');
const { createWholesaleSale } = require('../controllers/wholesaleSaleController');
const {
  processBulkReturn,
  getSalesReturns: getSalesReturnsFromController
} = require('../controllers/salesReturnController');

// Wrapper to dispatch createSale to the correct controller
const createSale = (req, res, next) => {
  const { type, invoiceType, isEmi, emiOption } = req.body;
  if ((type === 'EMI' || invoiceType === 'EMI' || isEmi) && emiOption) {
    return createEmiSale(req, res, next);
  } else if (type === 'retail') {
    return createRetailSale(req, res, next);
  } else {
    return createWholesaleSale(req, res, next);
  }
};
const { protect, authorize } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permission');


const router = express.Router();

// Validate ObjectId for all routes with :id parameter
router.param('id', (req, res, next, id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: `Invalid ID format: ${id}`
    });
  }
  next();
});

router.route('/')
  .get(protect, checkPermission('sales', 'read'), getSales)
  .post(protect, checkPermission('sales', 'create'), createSale);

// Specific routes should be defined before dynamic routes
router.route('/retail')
  .get(protect, checkPermission('retail', 'read'), getRetailSales);

// Due collection routes - must be before /:id
router.route('/due-collection')
  .get(protect, checkPermission('sales', 'read'), getDueCollections)
  .post(protect, checkPermission('sales', 'update'), recordSalesDueCollection);

router.route('/returns')
  .post(protect, checkPermission('sales', 'create'), createSalesReturn)
  .get(protect, checkPermission('sales', 'read'), getSalesReturns);

router.route('/bulk-return')
  .post(protect, checkPermission('sales', 'create'), processBulkReturn);

// Dynamic routes with :id - must come after specific routes
router.route('/:id')
  .get(protect, checkPermission('sales', 'read'), getSale)
  .put(protect, checkPermission('sales', 'update'), updateSale)
  .delete(protect, checkPermission('sales', 'delete'), deleteSale);

router.route('/:id/payment')
  .put(protect, checkPermission('sales', 'update'), updateSalePayment);

router.route('/:id/expenses')
  .put(protect, checkPermission('sales', 'update'), updateSaleExpenses);

// Super Admin invoice edit with inventory adjustment
router.route('/:id/edit')
  .put(protect, checkPermission('sales', 'update'), updateSaleWithInventory);

router.route('/:id/invoice')
  .get(protect, checkPermission('sales', 'read'), generateInvoice);

// Return all 4 JSON snapshots
router.route('/:id/invoices')
  .get(protect, checkPermission('sales', 'read'), getSaleInvoices);

// Dual invoice routes
router.route('/:id/customer-invoice')
  .get(protect, checkPermission('sales', 'read'), generateCustomerInvoice);

router.route('/:id/govt-invoice')
  .get(protect, checkPermission('sales', 'read'), generateGovtInvoice);

// Order status update route (for e-commerce)
router.route('/:id/order-status')
  .put(protect, authorize('Super Admin', 'Admin'), checkPermission('sales', 'update'), updateOrderStatus);

router.route('/:id/qrcode')
  .get(protect, checkPermission('sales', 'read'), generateSaleQRCode);

module.exports = router;