const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permission');
const fileUpload = require('express-fileupload');

const {
  getAllInvestors,
  getInvestorById,
  createInvestor,
  updateInvestor,
  deleteInvestor,
  changeInvestorPassword,
  getInvestorStats,
  requestWithdrawal,
  handleWithdrawalRequest,
  getWithdrawalRequests,
  getInvestorDashboard,
  getDemoInvestorView,
  calculateProfitDistribution,
  finalizeProfitDistribution,
  getProfitDistributions,
  getBusinessReports
} = require('../controllers/investorController');

router.use(protect);
router.use(fileUpload());

// Stats, dashboards & reports
router.get('/stats', authorize('Super Admin', 'Admin'), getInvestorStats);
router.get('/demo-dashboard', authorize('Super Admin', 'Admin'), getDemoInvestorView);
router.get('/dashboard/:id', getInvestorDashboard);
router.get('/business-reports', getBusinessReports); // accessible to investors + admins

// Profit Distribution
router.get('/profit-distribution/calculate', authorize('Super Admin', 'Admin'), calculateProfitDistribution);
router.post('/profit-distribution', authorize('Super Admin', 'Admin'), finalizeProfitDistribution);
router.get('/profit-distribution', authorize('Super Admin', 'Admin'), getProfitDistributions);

// Withdrawal routes
router.get('/withdrawals', authorize('Super Admin', 'Admin'), getWithdrawalRequests);
router.post('/withdraw', requestWithdrawal);
router.put('/withdraw/:investorId/:requestId', authorize('Super Admin', 'Admin'), handleWithdrawalRequest);

// Password change (admin only)
router.post('/:id/change-password', authorize('Super Admin', 'Admin'), changeInvestorPassword);

// CRUD routes
router.route('/')
  .get(authorize('Super Admin', 'Admin'), getAllInvestors)
  .post(authorize('Super Admin', 'Admin'), createInvestor);

router.route('/:id')
  .get(getInvestorById)
  .put(authorize('Super Admin', 'Admin'), updateInvestor)
  .delete(authorize('Super Admin', 'Admin'), deleteInvestor);

module.exports = router;
