const express = require('express');
const {
  getProfitLossStatement,
  getCashFlowStatement,
  getInvestorProfitDistribution,
  resyncLedger,
} = require('../controllers/financeController');

const { protect } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permission');

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

router.route('/profit-loss')
  .get(checkPermission('reports', 'read'), getProfitLossStatement);

router.route('/cash-flow')
  .get(checkPermission('reports', 'read'), getCashFlowStatement);

router.route('/investor-distribution')
  .get(checkPermission('reports', 'read'), getInvestorProfitDistribution);

router.route('/resync-ledger')
  .post(checkPermission('accounts', 'update'), resyncLedger);

module.exports = router;
