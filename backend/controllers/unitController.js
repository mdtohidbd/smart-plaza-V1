const Unit = require('../models/Unit');
const asyncHandler = require('express-async-handler');

// @desc    Get all units
// @route   GET /api/units
// @access  Private
const getUnits = asyncHandler(async (req, res) => {
  // Filter by shop if shop context is available
  const shopFilter = req.shopId ? { shop: req.shopId } : {};
  
  const units = await Unit.find(shopFilter).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: units.length,
    data: units
  });
});

// @desc    Get single unit
// @route   GET /api/units/:id
// @access  Private
const getUnit = asyncHandler(async (req, res) => {
  const unit = await Unit.findOne({
    _id: req.params.id,
    shop: req.shopId
  });

  if (!unit) {
    return res.status(404).json({ 
      success: false,
      message: `Unit not found with id ${req.params.id}` 
    });
  }

  res.status(200).json({
    success: true,
    data: unit
  });
});

// @desc    Create unit
// @route   POST /api/units
// @access  Private
const createUnit = asyncHandler(async (req, res) => {
  // Associate unit with current shop if available
  const unitData = {
    ...req.body,
    ...(req.shopId && { shop: req.shopId }) // Only add shop if it exists
  };
  
  const unit = await Unit.create(unitData);

  res.status(201).json({
    success: true,
    data: unit
  });
});

// @desc    Update unit
// @route   PUT /api/units/:id
// @access  Private
const updateUnit = asyncHandler(async (req, res) => {
  // Find unit and ensure it belongs to the current shop
  let unit = await Unit.findOne({
    _id: req.params.id,
    shop: req.shopId
  });

  if (!unit) {
    return res.status(404).json({ 
      success: false,
      message: `Unit not found with id ${req.params.id}` 
    });
  }

  // Update unit
  unit = await Unit.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: unit
  });
});

// @desc    Delete unit
// @route   DELETE /api/units/:id
// @access  Private
const deleteUnit = asyncHandler(async (req, res) => {
  // Find unit and ensure it belongs to the current shop
  const unit = await Unit.findOne({
    _id: req.params.id,
    shop: req.shopId
  });

  if (!unit) {
    return res.status(404).json({ 
      success: false,
      message: `Unit not found with id ${req.params.id}` 
    });
  }

  await unit.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

module.exports = {
  getUnits,
  getUnit,
  createUnit,
  updateUnit,
  deleteUnit
};