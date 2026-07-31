const StockBatch = require('../models/StockBatch');
const StockUnit = require('../models/StockUnit');
const Product = require('../models/Product');
const asyncHandler = require('express-async-handler');

/**
 * Generate a unique batch number: BATCH-YYYYMMDD-XXXX
 */
async function generateBatchNumber(shopId) {
  const d = new Date();
  const datePart = d.toISOString().slice(0, 10).replace(/-/g, '');
  const filter = shopId ? { shop: shopId } : {};
  const count = await StockBatch.countDocuments(filter);
  const seq = String(count + 1).padStart(4, '0');
  return `BATCH-${datePart}-${seq}`;
}

// @desc    Get all batches for a product
// @route   GET /api/stock-batches/product/:productId
// @access  Private
const getBatchesByProduct = asyncHandler(async (req, res) => {
  const batches = await StockBatch.find({
    product: req.params.productId,
    ...(req.shopId && { shop: req.shopId })
  })
    .populate('supplier', 'name companyName')
    .populate('purchaseId', 'purchaseNumber')
    .sort({ purchaseDate: -1 });

  res.status(200).json({ success: true, count: batches.length, data: batches });
});

// @desc    Get all active batches (with remaining stock)
// @route   GET /api/stock-batches/active
// @access  Private
const getActiveBatches = asyncHandler(async (req, res) => {
  const filter = { isActive: true, remainingQty: { $gt: 0 } };
  if (req.shopId) filter.shop = req.shopId;

  const batches = await StockBatch.find(filter)
    .populate('product', 'name sku brand category trackSerials')
    .populate('supplier', 'name companyName')
    .sort({ purchaseDate: -1 });

  res.status(200).json({ success: true, count: batches.length, data: batches });
});

// @desc    Get all batches (paginated)
// @route   GET /api/stock-batches
// @access  Private
const getAllBatches = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.shopId) filter.shop = req.shopId;
  if (req.query.active === 'true') {
    filter.isActive = true;
    filter.remainingQty = { $gt: 0 };
  }
  if (req.query.product) filter.product = req.query.product;

  const batches = await StockBatch.find(filter)
    .populate('product', 'name sku brand category images')
    .populate('supplier', 'name companyName')
    .populate('purchaseId', 'purchaseNumber')
    .sort({ purchaseDate: -1 });

  res.status(200).json({ success: true, count: batches.length, data: batches });
});

// @desc    Get a single batch by ID
// @route   GET /api/stock-batches/:id
// @access  Private
const getBatch = asyncHandler(async (req, res) => {
  const batch = await StockBatch.findOne({
    _id: req.params.id,
    ...(req.shopId && { shop: req.shopId })
  })
    .populate('product', 'name sku brand category trackSerials images')
    .populate('supplier', 'name companyName contactNumber')
    .populate('purchaseId', 'purchaseNumber date');

  if (!batch) {
    return res.status(404).json({ success: false, message: 'Batch not found' });
  }

  // If the product tracks serials, also include the units for this batch
  let units = [];
  if (batch.product && batch.product.trackSerials) {
    units = await StockUnit.find({ batch: batch._id });
  }

  res.status(200).json({ success: true, data: { ...batch.toObject(), units } });
});

// @desc    Update batch prices or settings (admin adjustment)
// @route   PUT /api/stock-batches/:id
// @access  Private (admin)
const updateBatch = asyncHandler(async (req, res) => {
  const allowed = ['purchasePrice', 'sellingPrice', 'emiPrice', 'ecommercePriceOverride', 'isListedOnEcommerce', 'note'];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  const batch = await StockBatch.findOneAndUpdate(
    { _id: req.params.id, ...(req.shopId && { shop: req.shopId }) },
    { $set: updates },
    { new: true, runValidators: true }
  )
    .populate('product', 'name sku')
    .populate('supplier', 'name');

  if (!batch) {
    return res.status(404).json({ success: false, message: 'Batch not found' });
  }

  res.status(200).json({ success: true, data: batch });
});

// @desc    Deactivate a batch manually
// @route   PATCH /api/stock-batches/:id/deactivate
// @access  Private (admin)
const deactivateBatch = asyncHandler(async (req, res) => {
  const batch = await StockBatch.findOneAndUpdate(
    { _id: req.params.id, ...(req.shopId && { shop: req.shopId }) },
    { $set: { isActive: false } },
    { new: true }
  );

  if (!batch) {
    return res.status(404).json({ success: false, message: 'Batch not found' });
  }

  res.status(200).json({ success: true, data: batch, message: 'Batch deactivated' });
});

// @desc    Get stock units (serials) for a batch
// @route   GET /api/stock-batches/:id/units
// @access  Private
const getBatchUnits = asyncHandler(async (req, res) => {
  const units = await StockUnit.find({ batch: req.params.id })
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, count: units.length, data: units });
});

// @desc    Get aggregated stock summary per product (from batches)
// @route   GET /api/stock-batches/summary
// @access  Private
const getStockSummary = asyncHandler(async (req, res) => {
  const matchFilter = req.shopId ? { shop: new (require('mongoose').Types.ObjectId)(req.shopId) } : {};

  const summary = await StockBatch.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: '$product',
        totalQty: { $sum: '$quantity' },
        totalRemaining: { $sum: '$remainingQty' },
        totalSold: { $sum: { $subtract: ['$quantity', '$remainingQty'] } },
        activeBatches: {
          $sum: { $cond: [{ $and: ['$isActive', { $gt: ['$remainingQty', 0] }] }, 1, 0] }
        },
        // Latest batch price (for retail POS default)
        latestPurchasePrice: { $last: '$purchasePrice' },
        latestSellingPrice: { $last: '$sellingPrice' },
        latestEmiPrice: { $last: '$emiPrice' },
        // Highest selling price (for ecommerce)
        maxSellingPrice: { $max: '$sellingPrice' },
        maxEcommercePrice: { $max: { $ifNull: ['$ecommercePriceOverride', '$sellingPrice'] } },
        // Weighted average purchase price (for profit calculation)
        avgPurchasePrice: { $avg: '$purchasePrice' },
        oldestBatchDate: { $min: '$purchaseDate' },
        latestBatchDate: { $max: '$purchaseDate' }
      }
    },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'product'
      }
    },
    { $unwind: '$product' },
    {
      $project: {
        product: {
          _id: '$product._id',
          name: '$product.name',
          sku: '$product.sku',
          brand: '$product.brand',
          category: '$product.category',
          image: '$product.image',
          images: '$product.images',
          alertQuantity: '$product.alertQuantity',
          trackSerials: '$product.trackSerials',
          isListedOnEcommerce: '$product.isListedOnEcommerce',
          isRetailProduct: '$product.isRetailProduct'
        },
        totalQty: 1,
        totalRemaining: 1,
        totalSold: 1,
        activeBatches: 1,
        latestPurchasePrice: 1,
        latestSellingPrice: 1,
        latestEmiPrice: 1,
        maxSellingPrice: 1,
        maxEcommercePrice: 1,
        avgPurchasePrice: 1,
        oldestBatchDate: 1,
        latestBatchDate: 1,
        // Stock value at latest purchase price
        stockValue: { $multiply: ['$totalRemaining', '$latestPurchasePrice'] }
      }
    },
    { $sort: { 'product.name': 1 } }
  ]);

  // Add alert flags
  const enriched = summary.map(item => ({
    ...item,
    isLowStock: item.totalRemaining <= (item.product.alertQuantity || 10) && item.totalRemaining > 0,
    isOutOfStock: item.totalRemaining <= 0
  }));

  res.status(200).json({ success: true, count: enriched.length, data: enriched });
});

module.exports = {
  getBatchesByProduct,
  getActiveBatches,
  getAllBatches,
  getBatch,
  updateBatch,
  deactivateBatch,
  getBatchUnits,
  getStockSummary,
  generateBatchNumber
};
