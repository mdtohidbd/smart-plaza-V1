const express = require('express');
const { 
  getAccounts,
  getAccount,
  createAccount,
  updateAccount,
  deleteAccount,
  getAccountBalance,
  getAccountTransactions
} = require('../controllers/accountController');
const { protect, authorize } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permission');


const router = express.Router();

router.route('/')
  .get(protect, checkPermission('accounts', 'read'), getAccounts)
  .post(protect, checkPermission('accounts', 'create'), createAccount);

router.route('/:id')
  .get(protect, checkPermission('accounts', 'read'), getAccount)
  .put(protect, checkPermission('accounts', 'update'), updateAccount)
  .delete(protect, checkPermission('accounts', 'delete'), deleteAccount);

router.route('/:id/balance').get(protect, checkPermission('accounts', 'read'), getAccountBalance);
router.route('/:id/transactions').get(protect, checkPermission('accounts', 'read'), getAccountTransactions);

module.exports = router;