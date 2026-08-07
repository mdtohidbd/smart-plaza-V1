const asyncHandler = require('express-async-handler');
const Route = require('../models/Route');

// @desc    Get all routes
// @route   GET /api/routes
// @access  Private
const getRoutes = asyncHandler(async (req, res) => {
  const routes = await Route.find({
    ...(req.shopId && { shop: req.shopId })
  }).populate('assignedSR', 'name role phone')
    .sort({ name: 1 });

  res.status(200).json({
    success: true,
    count: routes.length,
    data: routes
  });
});

// @desc    Get single route
// @route   GET /api/routes/:id
// @access  Private
const getRoute = asyncHandler(async (req, res) => {
  const route = await Route.findById(req.params.id)
    .populate('assignedSR', 'name role phone')
    .populate('customers', 'contactName contactNumber address');

  if (!route) {
    return res.status(404).json({
      success: false,
      message: `Route not found with id ${req.params.id}`
    });
  }

  // Ensure shop context isolation
  if (req.shopId && route.shop && route.shop.toString() !== req.shopId) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }

  res.status(200).json({
    success: true,
    data: route
  });
});

// @desc    Create route
// @route   POST /api/routes
// @access  Private
const createRoute = asyncHandler(async (req, res) => {
  req.body.createdBy = req.user.id;
  if (req.shopId) {
    req.body.shop = req.shopId;
  }

  // Check if route code already exists
  const existingRoute = await Route.findOne({ code: req.body.code, ...(req.shopId && { shop: req.shopId }) });
  if (existingRoute) {
    return res.status(400).json({
      success: false,
      message: `Route with code ${req.body.code} already exists`
    });
  }

  const route = await Route.create(req.body);

  res.status(201).json({
    success: true,
    data: route
  });
});

// @desc    Update route
// @route   PUT /api/routes/:id
// @access  Private
const updateRoute = asyncHandler(async (req, res) => {
  let route = await Route.findById(req.params.id);

  if (!route) {
    return res.status(404).json({
      success: false,
      message: `Route not found with id ${req.params.id}`
    });
  }

  // Ensure shop context isolation
  if (req.shopId && route.shop && route.shop.toString() !== req.shopId) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this route'
    });
  }

  route = await Route.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: route
  });
});

// @desc    Delete route
// @route   DELETE /api/routes/:id
// @access  Private
const deleteRoute = asyncHandler(async (req, res) => {
  const route = await Route.findById(req.params.id);

  if (!route) {
    return res.status(404).json({
      success: false,
      message: `Route not found with id ${req.params.id}`
    });
  }

  // Ensure shop context isolation
  if (req.shopId && route.shop && route.shop.toString() !== req.shopId) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete this route'
    });
  }

  // Check if there are sales tied to this route before deleting
  const Sale = require('../models/Sale');
  const routeSales = await Sale.countDocuments({ route: req.params.id });
  if (routeSales > 0) {
    return res.status(400).json({
      success: false,
      message: `Cannot delete route because ${routeSales} sales are tied to it. Deactivate it instead.`
    });
  }

  await route.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

module.exports = {
  getRoutes,
  getRoute,
  createRoute,
  updateRoute,
  deleteRoute
};
