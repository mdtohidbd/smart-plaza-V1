const express = require('express');
const { 
  getIncomeHeads,
  getIncomeHead,
  createIncomeHead,
  updateIncomeHead,
  deleteIncomeHead
} = require('../controllers/incomeHeadController');
const { protect } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permission');


const router = express.Router();

router.route('/')
  .get(protect, checkPermission('accounts', 'read'), getIncomeHeads)
  .post(protect, checkPermission('accounts', 'create'), createIncomeHead);

router.route('/:id')
  .get(protect, checkPermission('accounts', 'read'), getIncomeHead)
  .put(protect, checkPermission('accounts', 'update'), updateIncomeHead)
  .delete(protect, checkPermission('accounts', 'delete'), deleteIncomeHead);

module.exports = router;