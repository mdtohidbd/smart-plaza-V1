const Unit = require('../models/Unit');
const asyncHandler = require('express-async-handler');

// @desc    Get all units
// @route   GET /api/units
// @access  Private
const getUnits = asyncHandler(async (req, res) => {
  // Filter by shop if shop context is available, including global (null) units
  let shopFilter = {};
  if (req.shopId) {
    shopFilter = {
      $or: [
        { shop: req.shopId },
        { shop: null },
        { shop: { $exists: false } }
      ]
    };
  }
  
  let units = await Unit.find(shopFilter).sort({ createdAt: -1 });

  // Fail-safe: If no units match the shop filter, return all available units
  if (units.length === 0) {
    units = await Unit.find({}).sort({ createdAt: -1 });
  }

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
  const shopFilter = req.shopId 
    ? { _id: req.params.id, $or: [{ shop: req.shopId }, { shop: null }, { shop: { $exists: false } }] }
    : { _id: req.params.id };

  const unit = await Unit.findOne(shopFilter);

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
  const { name, symbol } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Unit name is required'
    });
  }

  // Check if unit with the same name already exists (case-insensitive)
  const existingUnit = await Unit.findOne({
    name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }
  });

  if (existingUnit) {
    // Gracefully return existing unit so frontend can select it seamlessly
    return res.status(200).json({
      success: true,
      data: existingUnit,
      message: `Unit "${existingUnit.name}" already exists and was selected.`
    });
  }

  // Associate unit with current shop if available
  const unitData = {
    ...req.body,
    name: name.trim(),
    symbol: symbol ? symbol.trim() : name.trim(),
    ...(req.shopId && { shop: req.shopId })
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
  let unit = await Unit.findById(req.params.id);

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
  const unit = await Unit.findById(req.params.id);

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