const Income = require('../models/Income');
const asyncHandler = require('express-async-handler');

// @desc    Get all incomes
// @route   GET /api/income
// @access  Private
const getIncomes = asyncHandler(async (req, res) => {
  const shopFilter = req.shopId ? { shop: req.shopId } : {};
  const incomes = await Income.find(shopFilter)
    .populate('incomeHead', 'name')
    .populate('accountId', 'name type')
    .populate('addedBy', 'name email')
    .sort({ date: -1 });

  res.status(200).json({
    success: true,
    count: incomes.length,
    data: incomes
  });
});

// @desc    Get single income
// @route   GET /api/income/:id
// @access  Private
const getIncome = asyncHandler(async (req, res) => {
  const income = await Income.findOne({
    _id: req.params.id,
    shop: req.shopId
  })
    .populate('incomeHead', 'name')
    .populate('accountId', 'name type')
    .populate('addedBy', 'name email');

  if (!income) {
    return res.status(404).json({ 
      success: false,
      message: `Income not found with id ${req.params.id}` 
    });
  }

  res.status(200).json({
    success: true,
    data: income
  });
});

// @desc    Create income
// @route   POST /api/income
// @access  Private
const createIncome = asyncHandler(async (req, res) => {
  // Add the user who created the income and associate with current shop
  req.body.addedBy = req.user.id;
  if (req.shopId) {
    req.body.shop = req.shopId;
  }
  
  // Handle incomeHead - if it's an ObjectId string, use it directly; if it's a name, find the ObjectId
  if (req.body.incomeHead && typeof req.body.incomeHead === 'string') {
    const mongoose = require('mongoose');
    
    // Check if the string is a valid ObjectId
    if (mongoose.Types.ObjectId.isValid(req.body.incomeHead)) {
      // It's already an ObjectId, so use it directly
      req.body.incomeHead = new mongoose.Types.ObjectId(req.body.incomeHead);
    } else {
      // It's a name, so find the corresponding ObjectId
      const IncomeHead = require('../models/IncomeHead');
      const incomeHead = await IncomeHead.findOne({ 
        name: req.body.incomeHead,
        shop: req.shopId
      });
      if (incomeHead) {
        req.body.incomeHead = incomeHead._id;
      } else {
        return res.status(400).json({
          success: false,
          message: `Income head not found with name ${req.body.incomeHead}`
        });
      }
    }
  }
  
  // If accountId is provided as a name string, find the corresponding ObjectId
  if (req.body.accountId && typeof req.body.accountId === 'string') {
    const mongoose = require('mongoose');
    if (mongoose.Types.ObjectId.isValid(req.body.accountId)) {
      req.body.accountId = new mongoose.Types.ObjectId(req.body.accountId);
    } else {
      const Account = require('../models/Account');
      const account = await Account.findOne({ 
        name: req.body.accountId,
        shop: req.shopId
      });
      if (account) {
        req.body.accountId = account._id;
      } else {
        return res.status(400).json({
          success: false,
          message: `Account not found with name ${req.body.accountId}`
        });
      }
    }
  }
  
  const income = await Income.create(req.body);

  res.status(201).json({
    success: true,
    data: income
  });
});

// @desc    Update income
// @route   PUT /api/income/:id
// @access  Private
const updateIncome = asyncHandler(async (req, res) => {
  let income = await Income.findOne({
    _id: req.params.id,
    shop: req.shopId
  });

  if (!income) {
    return res.status(404).json({ 
      success: false,
      message: `Income not found with id ${req.params.id}` 
    });
  }

  // Handle incomeHead - if it's an ObjectId string, use it directly; if it's a name, find the ObjectId
  if (req.body.incomeHead && typeof req.body.incomeHead === 'string') {
    const mongoose = require('mongoose');
    
    // Check if the string is a valid ObjectId
    if (mongoose.Types.ObjectId.isValid(req.body.incomeHead)) {
      // It's already an ObjectId, so use it directly
      req.body.incomeHead = new mongoose.Types.ObjectId(req.body.incomeHead);
    } else {
      // It's a name, so find the corresponding ObjectId
      const IncomeHead = require('../models/IncomeHead');
      const incomeHead = await IncomeHead.findOne({ name: req.body.incomeHead, shop: req.shopId });
      if (incomeHead) {
        req.body.incomeHead = incomeHead._id;
      } else {
        return res.status(400).json({
          success: false,
          message: `Income head not found with name ${req.body.incomeHead}`
        });
      }
    }
  }
  
  // If accountId is provided as a name string, find the corresponding ObjectId
  if (req.body.accountId && typeof req.body.accountId === 'string') {
    const mongoose = require('mongoose');
    if (mongoose.Types.ObjectId.isValid(req.body.accountId)) {
      req.body.accountId = new mongoose.Types.ObjectId(req.body.accountId);
    } else {
      const Account = require('../models/Account');
      const account = await Account.findOne({ name: req.body.accountId, shop: req.shopId });
      if (account) {
        req.body.accountId = account._id;
      } else {
        return res.status(400).json({
          success: false,
          message: `Account not found with name ${req.body.accountId}`
        });
      }
    }
  }

  income = await Income.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: income
  });
});

// @desc    Delete income
// @route   DELETE /api/income/:id
// @access  Private
const deleteIncome = asyncHandler(async (req, res) => {
  const income = await Income.findOne({
    _id: req.params.id,
    shop: req.shopId
  });

  if (!income) {
    return res.status(404).json({ 
      success: false,
      message: `Income not found with id ${req.params.id}` 
    });
  }

  await income.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

module.exports = {
  getIncomes,
  getIncome,
  createIncome,
  updateIncome,
  deleteIncome
};