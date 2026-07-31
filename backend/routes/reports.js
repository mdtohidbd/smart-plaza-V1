const express = require('express');
const { 
  getSalesAnalytics,
  getProductWiseSales,
  getSupplierWiseSales,
  getDailySales,
  getTodaySales,
  getWeeklySales,
  getMonthlySales,
  getSalesTopSheet,
  getProductWiseTopChart,
  getDeliveryWiseTopChart,
  getRouteWiseTopChart,
  getSalesDueReport,
  getSalesReturnReport,
  exportSalesReportExcel
} = require('../controllers/reports/salesReportController');

const {
  getPurchaseReports,
  getProductWisePurchaseReport,
  getProductPurchaseInvoices,
  getSupplierWisePurchaseReport,
  getPurchaseDueReport,
  getPurchaseReturnReport,
  getPurchaseTopSheet,
  getPurchaseCommissionReport
} = require('../controllers/reports/purchaseReportController');

const {
  getCustomerLedger,
  getCustomerDues,
  getSupplierLedger
} = require('../controllers/reports/financeReportController');

const {
  getSrWiseSales,
  getDsrPerformance
} = require('../controllers/reports/employeeReportController');

const {
  getRoleBasedDashboard
} = require('../controllers/reports/dashboardController');

const {
  getConsolidatedInvoice
} = require('../controllers/reports/invoiceReportController');

const { protect, authorize } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permission');

const router = express.Router();

// New enhanced reports
router.route('/sales-analytics').get(protect, checkPermission('reports', 'read'), getSalesAnalytics);
router.route('/supplier-sales').get(protect, checkPermission('reports', 'read'), getSupplierWiseSales);
router.route('/supplier-ledger').get(protect, checkPermission('reports', 'read'), getSupplierLedger);
router.route('/sr-sales').get(protect, checkPermission('reports', 'read'), getSrWiseSales);
router.route('/dsr-performance').get(protect, checkPermission('reports', 'read'), getDsrPerformance);
router.route('/daily-sales').get(protect, checkPermission('reports', 'read'), getDailySales);
router.route('/weekly-sales').get(protect, checkPermission('reports', 'read'), getWeeklySales);
router.route('/monthly-sales').get(protect, checkPermission('reports', 'read'), getMonthlySales);
router.route('/today-sales').get(protect, checkPermission('reports', 'read'), getTodaySales);
router.route('/customer-dues').get(protect, checkPermission('reports', 'read'), getCustomerDues);
router.route('/export/excel').get(protect, checkPermission('reports', 'read'), exportSalesReportExcel);

router.route('/role-dashboard').get(protect, checkPermission('reports', 'read'), getRoleBasedDashboard);

// Purchase reports routes
router.route('/purchase-reports').get(protect, checkPermission('reports', 'read'), getPurchaseReports);
router.route('/purchase-product-wise').get(protect, checkPermission('reports', 'read'), getProductWisePurchaseReport);
router.route('/purchase-product-wise/:productId/invoices').get(protect, checkPermission('reports', 'read'), getProductPurchaseInvoices);
router.route('/purchase-supplier-wise').get(protect, checkPermission('reports', 'read'), getSupplierWisePurchaseReport);
router.route('/purchase-dues').get(protect, checkPermission('reports', 'read'), getPurchaseDueReport);
router.route('/purchase-returns').get(protect, checkPermission('reports', 'read'), getPurchaseReturnReport);
router.route('/purchase-commission').get(protect, checkPermission('reports', 'read'), getPurchaseCommissionReport);

// Top Sheet and Top Chart reports
router.route('/purchase-top-sheet').get(protect, checkPermission('reports', 'read'), getPurchaseTopSheet);
router.route('/sales-top-sheet').get(protect, checkPermission('reports', 'read'), getSalesTopSheet);
router.route('/product-wise-top-chart').get(protect, checkPermission('reports', 'read'), getProductWiseTopChart);
router.route('/delivery-wise-top-chart').get(protect, checkPermission('reports', 'read'), getDeliveryWiseTopChart);
router.route('/route-wise-top-chart').get(protect, checkPermission('reports', 'read'), getRouteWiseTopChart);

// Product-wise sales report
router.route('/product-wise-sales').get(protect, checkPermission('reports', 'read'), getProductWiseSales);

// Consolidated Invoice and Customer Ledger reports
router.route('/consolidated-invoice').get(protect, checkPermission('reports', 'read'), getConsolidatedInvoice);
router.route('/customer-ledger').get(protect, checkPermission('reports', 'read'), getCustomerLedger);

// Sales Due and Sales Return reports
router.route('/sales-due-report').get(protect, checkPermission('reports', 'read'), getSalesDueReport);
router.route('/sales-return-report').get(protect, checkPermission('reports', 'read'), getSalesReturnReport);

module.exports = router;