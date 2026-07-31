const express = require('express');
const { 
  getExpenseHeads,
  getExpenseHead,
  createExpenseHead,
  updateExpenseHead,
  deleteExpenseHead
} = require('../controllers/expenseHeadController');
const { protect } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permission');


const router = express.Router();

router.route('/')
  .get(protect, checkPermission('accounts', 'read'), getExpenseHeads)
  .post(protect, checkPermission('accounts', 'create'), createExpenseHead);

router.route('/:id')
  .get(protect, checkPermission('accounts', 'read'), getExpenseHead)
  .put(protect, checkPermission('accounts', 'update'), updateExpenseHead)
  .delete(protect, checkPermission('accounts', 'delete'), deleteExpenseHead);

module.exports = router;