const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permission');

const fileUpload = require('express-fileupload');

// Import controllers
const {
  getAllEMIInvoices,
  getEMIInvoiceById,
  createEMIInvoice,
  updateEMIInvoice,
  cancelEMIInvoice,
  markAsDefaulted,
  generateLegalNotice,
  repossessProduct,
  updateInstalmentStatus
} = require('../controllers/emiController');

const {
  getAllEMICollections,
  getEMICollectionById,
  recordEMICollection,
  updateEMICollection,
  deleteEMICollection,
  getCollectionInstallments
} = require('../controllers/emiCollectionController');

const {
  getDashboardStats,
  getReceivableOverview,
  getOverdueStats,
  getCollectionReport,
  getPerformanceMetrics
} = require('../controllers/emiReportController');

// Apply file upload middleware to all routes
router.use(fileUpload());

// ==================== DASHBOARD & STATS ====================
router.get('/stats/dashboard',    protect, checkPermission('emi', 'read'), getDashboardStats);
router.get('/stats/receivable',   protect, checkPermission('emi', 'read'), getReceivableOverview);
router.get('/stats/overdue',      protect, checkPermission('emi', 'read'), getOverdueStats);
router.get('/reports/collection', protect, checkPermission('emi', 'read'), getCollectionReport);
router.get('/reports/performance',protect, checkPermission('emi', 'read'), getPerformanceMetrics);

router.get('/collections/installments', protect, checkPermission('emi', 'read'), getCollectionInstallments);

// ==================== EMI COLLECTIONS ====================
router.route('/collections')
  .get(protect, checkPermission('emi', 'read'),   getAllEMICollections)
  .post(protect, checkPermission('emi', 'create'), recordEMICollection);

router.route('/collections/:id')
  .get(protect,  checkPermission('emi', 'read'),   getEMICollectionById)
  .put(protect,  checkPermission('emi', 'update'), updateEMICollection)
  .delete(protect, checkPermission('emi', 'delete'), deleteEMICollection);

// ==================== EMI INVOICES ====================
router.route('/invoices')
  .get(protect, checkPermission('emi', 'read'),   getAllEMIInvoices)
  .post(protect, checkPermission('emi', 'create'), createEMIInvoice);

router.route('/invoices/:id')
  .get(protect, checkPermission('emi', 'read'),   getEMIInvoiceById)
  .put(protect, checkPermission('emi', 'update'), updateEMIInvoice);

// Special actions (require update permission)
router.put('/invoices/:id/cancel',    protect, checkPermission('emi', 'update'), cancelEMIInvoice);
router.put('/invoices/:id/default',   protect, checkPermission('emi', 'update'), markAsDefaulted);
router.get('/invoices/:id/legal-notice', protect, checkPermission('emi', 'read'), generateLegalNotice);
router.post('/invoices/:id/repossess',protect, checkPermission('emi', 'update'), repossessProduct);
router.put('/invoices/:id/instalment/:instalmentNumber', protect, checkPermission('emi', 'update'), updateInstalmentStatus);

// Trigger route for Vercel Serverless Cron Jobs
const { checkOverdueEMIs, sendEMIReminders } = require('../jobs/emiJobs');
router.get('/trigger-cron', async (req, res) => {
  try {
    await checkOverdueEMIs();
    await sendEMIReminders();
    res.json({ success: true, message: 'EMI cron jobs executed successfully' });
  } catch (error) {
    console.error('Error running EMI cron jobs via route:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

