const Expense = require('../models/Expense');
const asyncHandler = require('express-async-handler');
const { getPurchaseExpenseHeadIds } = require('../utils/accountLedgerSync');

// @desc    Get all expenses
// @route   GET /api/expense
// @access  Private
const getExpenses = asyncHandler(async (req, res) => {
  const shopFilter = req.shopId ? { shop: req.shopId } : {};
  const purchaseHeadIds = await getPurchaseExpenseHeadIds(req.shopId || null);

  const query = { ...shopFilter };
  if (purchaseHeadIds.length > 0) {
    query.expenseHead = { $nin: purchaseHeadIds };
  }

  const expenses = await Expense.find(query)
    .populate('expenseHead', 'name')
    .populate('accountId', 'name type')
    .populate('addedBy', 'name email')
    .sort({ date: -1 });

  res.status(200).json({
    success: true,
    count: expenses.length,
    data: expenses
  });
});

// @desc    Get single expense
// @route   GET /api/expense/:id
// @access  Private
const getExpense = asyncHandler(async (req, res) => {
  const expense = await Expense.findOne({
    _id: req.params.id,
    shop: req.shopId
  })
    .populate('expenseHead', 'name')
    .populate('accountId', 'name type')
    .populate('addedBy', 'name email');

  if (!expense) {
    return res.status(404).json({ 
      success: false,
      message: `Expense not found with id ${req.params.id}` 
    });
  }

  res.status(200).json({
    success: true,
    data: expense
  });
});

// @desc    Create expense
// @route   POST /api/expense
// @access  Private
const createExpense = asyncHandler(async (req, res) => {
  // Add the user who created the expense and associate with current shop
  let expenseData = {
    ...req.body,
    addedBy: req.user.id,
    ...(req.shopId && { shop: req.shopId })
  };
  
  // Handle expenseHead - if it's an ObjectId string, use it directly; if it's a name, find the ObjectId
  if (expenseData.expenseHead && typeof expenseData.expenseHead === 'string') {
    const mongoose = require('mongoose');
    
    // Check if the string is a valid ObjectId
    if (mongoose.Types.ObjectId.isValid(expenseData.expenseHead)) {
      // It's already an ObjectId, so use it directly
      expenseData.expenseHead = new mongoose.Types.ObjectId(expenseData.expenseHead);
    } else {
      // It's a name, so find the corresponding ObjectId
      const ExpenseHead = require('../models/ExpenseHead');
      const expenseHead = await ExpenseHead.findOne({ 
        name: expenseData.expenseHead,
        shop: req.shopId
      });
      if (expenseHead) {
        expenseData.expenseHead = expenseHead._id;
      } else {
        return res.status(400).json({
          success: false,
          message: `Expense head not found with name ${expenseData.expenseHead}`
        });
      }
    }
  }
  
  // Handle accountId - if it's an ObjectId string, use it directly; if it's a name, find the ObjectId
  if (expenseData.accountId && typeof expenseData.accountId === 'string') {
    const mongoose = require('mongoose');
    
    // Check if the string is a valid ObjectId
    if (mongoose.Types.ObjectId.isValid(expenseData.accountId)) {
      // It's already an ObjectId, so use it directly
      expenseData.accountId = new mongoose.Types.ObjectId(expenseData.accountId);
    } else {
      // It's a name, so find the corresponding ObjectId
      const Account = require('../models/Account');
      const account = await Account.findOne({ 
        name: expenseData.accountId,
        shop: req.shopId
      });
      if (account) {
        expenseData.accountId = account._id;
      } else {
        return res.status(400).json({
          success: false,
          message: `Account not found with name ${expenseData.accountId}`
        });
      }
    }
  }
  
  const expense = await Expense.create(expenseData);

  res.status(201).json({
    success: true,
    data: expense
  });
});

// @desc    Update expense
// @route   PUT /api/expense/:id
// @access  Private
const updateExpense = asyncHandler(async (req, res) => {
  let expense = await Expense.findOne({
    _id: req.params.id,
    shop: req.shopId
  });

  if (!expense) {
    return res.status(404).json({ 
      success: false,
      message: `Expense not found with id ${req.params.id}` 
    });
  }

  // Handle expenseHead - if it's an ObjectId string, use it directly; if it's a name, find the ObjectId
  if (req.body.expenseHead && typeof req.body.expenseHead === 'string') {
    const mongoose = require('mongoose');
    
    // Check if the string is a valid ObjectId
    if (mongoose.Types.ObjectId.isValid(req.body.expenseHead)) {
      // It's already an ObjectId, so use it directly
      req.body.expenseHead = new mongoose.Types.ObjectId(req.body.expenseHead);
    } else {
      // It's a name, so find the corresponding ObjectId
      const ExpenseHead = require('../models/ExpenseHead');
      const expenseHead = await ExpenseHead.findOne({ name: req.body.expenseHead, shop: req.shopId });
      if (expenseHead) {
        req.body.expenseHead = expenseHead._id;
      } else {
        return res.status(400).json({
          success: false,
          message: `Expense head not found with name ${req.body.expenseHead}`
        });
      }
    }
  }
  
  // Handle accountId - if it's an ObjectId string, use it directly; if it's a name, find the ObjectId
  if (req.body.accountId && typeof req.body.accountId === 'string') {
    const mongoose = require('mongoose');
    
    // Check if the string is a valid ObjectId
    if (mongoose.Types.ObjectId.isValid(req.body.accountId)) {
      // It's already an ObjectId, so use it directly
      req.body.accountId = new mongoose.Types.ObjectId(req.body.accountId);
    } else {
      // It's a name, so find the corresponding ObjectId
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

  expense = await Expense.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: expense
  });
});

// @desc    Delete expense
// @route   DELETE /api/expense/:id
// @access  Private
const deleteExpense = asyncHandler(async (req, res) => {
  const expense = await Expense.findOne({
    _id: req.params.id,
    shop: req.shopId
  });

  if (!expense) {
    return res.status(404).json({ 
      success: false,
      message: `Expense not found with id ${req.params.id}` 
    });
  }

  await expense.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

module.exports = {
  getExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense
};