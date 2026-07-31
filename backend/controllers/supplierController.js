const Supplier = require('../models/Supplier');
const asyncHandler = require('express-async-handler');

// @desc    Get all suppliers
// @route   GET /api/suppliers
// @access  Private
const getSuppliers = asyncHandler(async (req, res) => {
  const suppliers = await Supplier.find({}).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: suppliers.length,
    data: suppliers
  });
});

// @desc    Get single supplier
// @route   GET /api/suppliers/:id
// @access  Private
const getSupplier = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findById(req.params.id);

  if (!supplier) {
    return res.status(404).json({ 
      success: false,
      message: `Supplier not found with id ${req.params.id}` 
    });
  }

  res.status(200).json({
    success: true,
    data: supplier
  });
});

// @desc    Create supplier
// @route   POST /api/suppliers
// @access  Private
const createSupplier = asyncHandler(async (req, res) => {
  const supplierData = { ...req.body };
  
  if (supplierData.businessName && !supplierData.name) {
    supplierData.name = supplierData.businessName;
  }
  
  const supplier = await Supplier.create(supplierData);

  res.status(201).json({
    success: true,
    data: supplier
  });
});

// @desc    Update supplier
// @route   PUT /api/suppliers/:id
// @access  Private
const updateSupplier = asyncHandler(async (req, res) => {
  let supplier = await Supplier.findById(req.params.id);

  if (!supplier) {
    return res.status(404).json({ 
      success: false,
      message: `Supplier not found with id ${req.params.id}` 
    });
  }
  
  if (req.body.businessName && !req.body.name) {
    req.body.name = req.body.businessName;
  }

  supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: supplier
  });
});

// @desc    Delete supplier
// @route   DELETE /api/suppliers/:id
// @access  Private
const deleteSupplier = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findById(req.params.id);

  if (!supplier) {
    return res.status(404).json({ 
      success: false,
      message: `Supplier not found with id ${req.params.id}` 
    });
  }

  await supplier.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

module.exports = {
  getSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier
};
