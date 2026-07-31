const Product = require('../models/Product');
const StockBatch = require('../models/StockBatch');
const asyncHandler = require('express-async-handler');

// @desc    Get all products
// @route   GET /api/products
// @access  Private
const getProducts = asyncHandler(async (req, res) => {
  // Pagination parameters
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 0;
  
  // Filter by shop if shop context is available
  const query = req.shopId ? { shop: req.shopId } : {};

  // Search parameter
  if (req.query.search) {
    const searchRegex = new RegExp(req.query.search, 'i');
    query.$or = [
      { name: searchRegex },
      { sku: searchRegex },
      { genericName: searchRegex }
    ];
  }
  
  let dbQuery = Product.find(query)
    // .populate('shop', 'name')
    .populate('supplier', 'name companyName contactNumber')
    .populate('brand', 'name logo')
    .populate('category', 'name')
    .populate('unit', 'name symbol')
    .sort({ createdAt: -1 })
    .lean();

  if (limit > 0) {
    const startIndex = (page - 1) * limit;
    dbQuery = dbQuery.skip(startIndex).limit(limit);
  }

  const [products, total] = await Promise.all([
    dbQuery,
    Product.countDocuments(query)
  ]);

  const productIds = products.map(p => p._id);
  const matchFilter = { product: { $in: productIds } };
  if (req.shopId) matchFilter.shop = req.shopId;

  const stockResults = await StockBatch.aggregate([
    { $match: matchFilter },
    { $group: { _id: '$product', totalStock: { $sum: '$remainingQty' } } }
  ]);

  const stockMap = {};
  stockResults.forEach(r => {
    stockMap[r._id.toString()] = r.totalStock;
  });

  const productsWithStock = products.map((product) => {
    return {
      ...product,
      currentStock: stockMap[product._id.toString()] || 0
    };
  });

  res.status(200).json({
    success: true,
    count: productsWithStock.length,
    total,
    page: limit > 0 ? page : 1,
    pages: limit > 0 ? Math.ceil(total / limit) : 1,
    data: productsWithStock
  });
});

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Private
const getProduct = asyncHandler(async (req, res) => {
  // Find product and ensure it belongs to the current shop
  const product = await Product.findOne({
    _id: req.params.id,
    shop: req.shopId
  })
    // .populate('shop', 'name')
    .populate('supplier', 'name companyName contactNumber')
    .populate('brand', 'name logo')
    .populate('category', 'name')
    .populate('unit', 'name symbol');

  if (!product) {
    return res.status(404).json({ 
      success: false,
      message: `Product not found with id ${req.params.id}` 
    });
  }

  res.status(200).json({
    success: true,
    data: product
  });
});

// @desc    Create product
// @route   POST /api/products
// @access  Private
const createProduct = asyncHandler(async (req, res) => {
  // Associate product with current shop if available
  const productData = {
    ...req.body,
    ...(req.shopId && { shop: req.shopId }) // Only add shop if it exists
  };
  
  const product = await Product.create(productData);

  // Note: Opening stock is stored in product.openingStock field
  // No separate inventory transaction is created for opening stock
  // The openingStock field value will be used directly in stock calculations

  res.status(201).json({
    success: true,
    data: product
  });
});

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private
const updateProduct = asyncHandler(async (req, res) => {
  // Find product and ensure it belongs to the current shop
  let product = await Product.findOne({
    _id: req.params.id,
    shop: req.shopId
  });

  if (!product) {
    return res.status(404).json({ 
      success: false,
      message: `Product not found with id ${req.params.id}` 
    });
  }

  // Update product
  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  })
  // .populate('shop', 'name')
  .populate('supplier', 'name companyName contactNumber')
  .populate('brand', 'name logo')
  .populate('category', 'name')
  .populate('unit', 'name symbol');

  res.status(200).json({
    success: true,
    data: product
  });
});

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private
const deleteProduct = asyncHandler(async (req, res) => {
  // Find product and ensure it belongs to the current shop
  const product = await Product.findOne({
    _id: req.params.id,
    shop: req.shopId
  });

  if (!product) {
    return res.status(404).json({ 
      success: false,
      message: `Product not found with id ${req.params.id}` 
    });
  }

  await product.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct
};