const express = require('express');
const { 
  getIncomes,
  getIncome,
  createIncome,
  updateIncome,
  deleteIncome
} = require('../controllers/incomeController');
const { protect } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permission');


const router = express.Router();

router.route('/')
  .get(protect, checkPermission('accounts', 'read'), getIncomes)
  .post(protect, checkPermission('accounts', 'create'), createIncome);

router.route('/:id')
  .get(protect, checkPermission('accounts', 'read'), getIncome)
  .put(protect, checkPermission('accounts', 'update'), updateIncome)
  .delete(protect, checkPermission('accounts', 'delete'), deleteIncome);

module.exports = router;