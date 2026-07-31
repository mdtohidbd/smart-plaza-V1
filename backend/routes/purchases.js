const express = require('express');
const { 
  getPurchases, 
  getPurchase, 
  createPurchase, 
  updatePurchase, 
  deletePurchase,
  recordPurchaseDuePayment,
  getSuppliersWithDues,
  createPurchaseReturn,
  getPurchaseReturns,
  getPurchaseDuePayments,
  getPurchaseReportsSummary
} = require('../controllers/purchaseController');
const { protect, authorize } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permission');


const router = express.Router();

router.route('/')
  .get(protect, checkPermission('purchase', 'read'), getPurchases)
  .post(protect, checkPermission('purchase', 'create'), createPurchase);

// Specific routes MUST be defined before parameterized routes (:id)
router.route('/reports/summary')
  .get(protect, checkPermission('purchase', 'read'), getPurchaseReportsSummary);

router.route('/suppliers-with-dues')
  .get(protect, checkPermission('purchase', 'read'), getSuppliersWithDues);

router.route('/due-payment')
  .post(protect, checkPermission('purchase', 'update'), recordPurchaseDuePayment);

router.route('/due-payments')
  .get(protect, checkPermission('purchase', 'read'), getPurchaseDuePayments);

router.route('/returns')
  .post(protect, checkPermission('purchase', 'create'), createPurchaseReturn)
  .get(protect, checkPermission('purchase', 'read'), getPurchaseReturns);

// Parameterized route - must come after specific routes
router.route('/:id')
  .get(protect, checkPermission('purchase', 'read'), getPurchase)
  .put(protect, checkPermission('purchase', 'update'), updatePurchase)
  .delete(protect, checkPermission('purchase', 'delete'), deletePurchase);

module.exports = router;