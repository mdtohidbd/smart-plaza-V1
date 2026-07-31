const ExpenseHead = require('../models/ExpenseHead');
const asyncHandler = require('express-async-handler');

// @desc    Get all expense heads
// @route   GET /api/expenseHeads
// @access  Private
const getExpenseHeads = asyncHandler(async (req, res) => {
  const shopFilter = req.shopId ? { shop: req.shopId } : {};
  const expenseHeads = await ExpenseHead.find(shopFilter).sort({ name: 1 });

  res.status(200).json({
    success: true,
    count: expenseHeads.length,
    data: expenseHeads
  });
});

// @desc    Get single expense head
// @route   GET /api/expenseHeads/:id
// @access  Private
const getExpenseHead = asyncHandler(async (req, res) => {
  const expenseHead = await ExpenseHead.findOne({
    _id: req.params.id,
    shop: req.shopId
  });

  if (!expenseHead) {
    return res.status(404).json({ 
      success: false,
      message: `Expense head not found with id ${req.params.id}` 
    });
  }

  res.status(200).json({
    success: true,
    data: expenseHead
  });
});

// @desc    Create expense head
// @route   POST /api/expenseHeads
// @access  Private
const createExpenseHead = asyncHandler(async (req, res) => {
  const expenseHeadData = {
    ...req.body,
    ...(req.shopId && { shop: req.shopId })
  };
  const expenseHead = await ExpenseHead.create(expenseHeadData);

  res.status(201).json({
    success: true,
    data: expenseHead
  });
});

// @desc    Update expense head
// @route   PUT /api/expenseHeads/:id
// @access  Private
const updateExpenseHead = asyncHandler(async (req, res) => {
  let expenseHead = await ExpenseHead.findOne({
    _id: req.params.id,
    shop: req.shopId
  });

  if (!expenseHead) {
    return res.status(404).json({ 
      success: false,
      message: `Expense head not found with id ${req.params.id}` 
    });
  }

  expenseHead = await ExpenseHead.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: expenseHead
  });
});

// @desc    Delete expense head
// @route   DELETE /api/expenseHeads/:id
// @access  Private
const deleteExpenseHead = asyncHandler(async (req, res) => {
  const expenseHead = await ExpenseHead.findOne({
    _id: req.params.id,
    shop: req.shopId
  });

  if (!expenseHead) {
    return res.status(404).json({ 
      success: false,
      message: `Expense head not found with id ${req.params.id}` 
    });
  }

  await expenseHead.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

module.exports = {
  getExpenseHeads,
  getExpenseHead,
  createExpenseHead,
  updateExpenseHead,
  deleteExpenseHead
};