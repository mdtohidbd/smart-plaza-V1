const express = require('express');
const { 
  getExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense
} = require('../controllers/expenseController');
const { protect } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permission');


const router = express.Router();

router.route('/')
  .get(protect, checkPermission('accounts', 'read'), getExpenses)
  .post(protect, checkPermission('accounts', 'create'), createExpense);

router.route('/:id')
  .get(protect, checkPermission('accounts', 'read'), getExpense)
  .put(protect, checkPermission('accounts', 'update'), updateExpense)
  .delete(protect, checkPermission('accounts', 'delete'), deleteExpense);

module.exports = router;