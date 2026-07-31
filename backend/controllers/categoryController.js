const Category = require('../models/Category');
const asyncHandler = require('express-async-handler');
// @desc    Get all categories
// @route   GET /api/categories
// @access  Private
const getCategories = asyncHandler(async (req, res) => {
  // Filter by shop if shop context is available, including global (null) categories
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
  
  let categories = await Category.find(shopFilter)
    .populate('parent', 'name')
    .sort({ createdAt: -1 });

  // Fail-safe: If no categories match the shop filter, return all available categories
  if (categories.length === 0) {
    categories = await Category.find({})
      .populate('parent', 'name')
      .sort({ createdAt: -1 });
  }

  res.status(200).json({
    success: true,
    count: categories.length,
    data: categories
  });
});

// @desc    Get single category
// @route   GET /api/categories/:id
// @access  Private
const getCategory = asyncHandler(async (req, res) => {
  const category = await Category.findOne({
    _id: req.params.id,
    shop: req.shopId
  });

  if (!category) {
    return res.status(404).json({ 
      success: false,
      message: `Category not found with id ${req.params.id}` 
    });
  }

  res.status(200).json({
    success: true,
    data: category
  });
});

// @desc    Create category
// @route   POST /api/categories
// @access  Private
const createCategory = asyncHandler(async (req, res) => {
  // Associate category with current shop if available
  const categoryData = {
    ...req.body,
    ...(req.shopId && { shop: req.shopId }) // Only add shop if it exists
  };
  
  const category = await Category.create(categoryData);

  res.status(201).json({
    success: true,
    data: category
  });
});

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private
const updateCategory = asyncHandler(async (req, res) => {
  // Find category and ensure it belongs to the current shop
  let category = await Category.findOne({
    _id: req.params.id,
    shop: req.shopId
  });

  if (!category) {
    return res.status(404).json({ 
      success: false,
      message: `Category not found with id ${req.params.id}` 
    });
  }

  // Update category
  category = await Category.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: category
  });
});

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private
const deleteCategory = asyncHandler(async (req, res) => {
  // Find category and ensure it belongs to the current shop
  const category = await Category.findOne({
    _id: req.params.id,
    shop: req.shopId
  });

  if (!category) {
    return res.status(404).json({ 
      success: false,
      message: `Category not found with id ${req.params.id}` 
    });
  }

  await category.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

module.exports = {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory
};