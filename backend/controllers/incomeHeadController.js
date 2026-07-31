const IncomeHead = require('../models/IncomeHead');
const asyncHandler = require('express-async-handler');

// @desc    Get all income heads
// @route   GET /api/incomeHeads
// @access  Private
const getIncomeHeads = asyncHandler(async (req, res) => {
  const shopFilter = req.shopId ? { shop: req.shopId } : {};
  const incomeHeads = await IncomeHead.find(shopFilter).sort({ name: 1 });

  res.status(200).json({
    success: true,
    count: incomeHeads.length,
    data: incomeHeads
  });
});

// @desc    Get single income head
// @route   GET /api/incomeHeads/:id
// @access  Private
const getIncomeHead = asyncHandler(async (req, res) => {
  const incomeHead = await IncomeHead.findOne({
    _id: req.params.id,
    shop: req.shopId
  });

  if (!incomeHead) {
    return res.status(404).json({ 
      success: false,
      message: `Income head not found with id ${req.params.id}` 
    });
  }

  res.status(200).json({
    success: true,
    data: incomeHead
  });
});

// @desc    Create income head
// @route   POST /api/incomeHeads
// @access  Private
const createIncomeHead = asyncHandler(async (req, res) => {
  const incomeHeadData = {
    ...req.body,
    ...(req.shopId && { shop: req.shopId })
  };
  const incomeHead = await IncomeHead.create(incomeHeadData);

  res.status(201).json({
    success: true,
    data: incomeHead
  });
});

// @desc    Update income head
// @route   PUT /api/incomeHeads/:id
// @access  Private
const updateIncomeHead = asyncHandler(async (req, res) => {
  let incomeHead = await IncomeHead.findOne({
    _id: req.params.id,
    shop: req.shopId
  });

  if (!incomeHead) {
    return res.status(404).json({ 
      success: false,
      message: `Income head not found with id ${req.params.id}` 
    });
  }

  incomeHead = await IncomeHead.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: incomeHead
  });
});

// @desc    Delete income head
// @route   DELETE /api/incomeHeads/:id
// @access  Private
const deleteIncomeHead = asyncHandler(async (req, res) => {
  const incomeHead = await IncomeHead.findOne({
    _id: req.params.id,
    shop: req.shopId
  });

  if (!incomeHead) {
    return res.status(404).json({ 
      success: false,
      message: `Income head not found with id ${req.params.id}` 
    });
  }

  await incomeHead.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

module.exports = {
  getIncomeHeads,
  getIncomeHead,
  createIncomeHead,
  updateIncomeHead,
  deleteIncomeHead
};