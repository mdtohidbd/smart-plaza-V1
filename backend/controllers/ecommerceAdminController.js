const Product = require('../models/Product');
const StockBatch = require('../models/StockBatch');
const SaleOrder = require('../models/SaleOrder');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');

/**
 * @desc    Get all products listed on ecommerce with merged pricing
 * @route   GET /api/ecommerce-admin/products
 * @access  Private (admin)
 *
 * Returns products where isListedOnEcommerce = true,
 * with ecommerce price = MAX(sellingPrice) across active batches.
 * isPreorder=true overrides isInStock to true regardless of actual stock.
 */
const getEcommerceProducts = asyncHandler(async (req, res) => {
  const shopFilter = req.shopId ? { shop: new mongoose.Types.ObjectId(req.shopId) } : {};

  // Aggregate: per listed product, find max sellingPrice from active batches
  const batchPriceMap = await StockBatch.aggregate([
    {
      $match: {
        ...shopFilter,
        isActive: true,
        remainingQty: { $gt: 0 }
      }
    },
    {
      $group: {
        _id: '$product',
        maxSellingPrice: { $max: '$sellingPrice' },
        maxEcommercePrice: { $max: { $ifNull: ['$ecommercePriceOverride', '$sellingPrice'] } },
        maxEmiPrice: { $max: '$emiPrice' },
        totalStock: { $sum: '$remainingQty' },
        activeBatchCount: { $sum: 1 },
        latestPurchasePrice: { $last: '$purchasePrice' }
      }
    }
  ]);

  const priceMapByProductId = {};
  for (const entry of batchPriceMap) {
    priceMapByProductId[entry._id.toString()] = entry;
  }

  // Get all ecommerce-listed products
  const productFilter = { isListedOnEcommerce: true };
  if (req.shopId) productFilter.shop = req.shopId;

  const products = await Product.find(productFilter)
    .populate('brand', 'name logo')
    .populate('category', 'name')
    .populate('unit', 'name symbol')
    .sort({ ecommerceOrder: 1, name: 1 });

  const enriched = products.map(p => {
    const batchInfo = priceMapByProductId[p._id.toString()] || {};
    const actuallyInStock = (batchInfo.totalStock || 0) > 0;
    // Preorder override: if product is marked preorder + listed, treat as in-stock on storefront
    const effectivelyInStock = actuallyInStock || (p.isListedOnEcommerce && p.isPreorder);
    return {
      ...p.toObject(),
      ecommerceDisplayPrice: batchInfo.maxEcommercePrice || p.sellingPrice || 0,
      maxSellingPrice: batchInfo.maxSellingPrice || p.sellingPrice || 0,
      maxEmiPrice: batchInfo.maxEmiPrice || p.emiPrice || 0,
      currentStock: batchInfo.totalStock || 0,
      activeBatchCount: batchInfo.activeBatchCount || 0,
      latestPurchasePrice: batchInfo.latestPurchasePrice || 0,
      isInStock: effectivelyInStock,
      actualStock: batchInfo.totalStock || 0,
    };
  });

  res.status(200).json({ success: true, count: enriched.length, data: enriched });
});

/**
 * @desc    Get all products with ecommerce status (for admin panel — all products, not just listed)
 * @route   GET /api/ecommerce-admin/all-products
 * @access  Private (admin)
 */
const getAllProductsWithEcommerceStatus = asyncHandler(async (req, res) => {
  const shopFilter = req.shopId ? { shop: new mongoose.Types.ObjectId(req.shopId) } : {};

  // Get batch pricing info for all products
  const batchPriceMap = await StockBatch.aggregate([
    {
      $match: {
        ...shopFilter,
        isActive: true,
        remainingQty: { $gt: 0 }
      }
    },
    {
      $group: {
        _id: '$product',
        maxSellingPrice: { $max: '$sellingPrice' },
        maxEcommercePrice: { $max: { $ifNull: ['$ecommercePriceOverride', '$sellingPrice'] } },
        maxEmiPrice: { $max: '$emiPrice' },
        totalStock: { $sum: '$remainingQty' },
        activeBatchCount: { $sum: 1 }
      }
    }
  ]);

  const priceMapByProductId = {};
  for (const entry of batchPriceMap) {
    priceMapByProductId[entry._id.toString()] = entry;
  }

  const productFilter = req.shopId ? { shop: req.shopId } : {};
  const products = await Product.find(productFilter)
    .populate('brand', 'name logo')
    .populate('category', 'name')
    .sort({ ecommerceOrder: 1, name: 1 });

  const enriched = products.map(p => {
    const batchInfo = priceMapByProductId[p._id.toString()] || {};
    const actuallyInStock = (batchInfo.totalStock || 0) > 0;
    const effectivelyInStock = actuallyInStock || (p.isListedOnEcommerce && p.isPreorder);
    return {
      _id: p._id,
      name: p.name,
      sku: p.sku,
      image: p.image,
      brand: p.brand,
      category: p.category,
      isListedOnEcommerce: p.isListedOnEcommerce,
      isRetailProduct: p.isRetailProduct,
      isPreorder: p.isPreorder,
      ecommerceOrder: p.ecommerceOrder,
      landingPageSection: p.landingPageSection,
      trackSerials: p.trackSerials,
      ecommerceDisplayPrice: batchInfo.maxEcommercePrice || p.sellingPrice || 0,
      maxSellingPrice: batchInfo.maxSellingPrice || p.sellingPrice || 0,
      currentStock: batchInfo.totalStock || 0,
      activeBatchCount: batchInfo.activeBatchCount || 0,
      isInStock: effectivelyInStock,
      actualStock: batchInfo.totalStock || 0,
    };
  });

  res.status(200).json({ success: true, count: enriched.length, data: enriched });
});

/**
 * @desc    Toggle ecommerce listing for a product
 * @route   PATCH /api/ecommerce-admin/products/:id/toggle
 * @access  Private (admin)
 */
const toggleEcommerceVisibility = asyncHandler(async (req, res) => {
  const product = await Product.findOne({
    _id: req.params.id,
    ...(req.shopId && { shop: req.shopId })
  });

  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  const newStatus = !product.isListedOnEcommerce;
  await Product.updateOne({ _id: product._id }, { $set: { isListedOnEcommerce: newStatus } });

  res.status(200).json({
    success: true,
    message: `Product ${newStatus ? 'listed on' : 'removed from'} ecommerce`,
    data: { isListedOnEcommerce: newStatus }
  });
});

/**
 * @desc    Toggle preorder status for a product
 * @route   PATCH /api/ecommerce-admin/products/:id/toggle-preorder
 * @access  Private (admin)
 */
const togglePreorder = asyncHandler(async (req, res) => {
  const product = await Product.findOne({
    _id: req.params.id,
    ...(req.shopId && { shop: req.shopId })
  });

  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  const newStatus = !product.isPreorder;
  await Product.updateOne({ _id: product._id }, { $set: { isPreorder: newStatus } });

  res.status(200).json({
    success: true,
    message: `Preorder ${newStatus ? 'enabled' : 'disabled'} for product`,
    data: { isPreorder: newStatus }
  });
});

/**
 * @desc    Update ecommerce settings for a product (order, retail toggle, preorder)
 * @route   PUT /api/ecommerce-admin/products/:id
 * @access  Private (admin)
 */
const updateEcommerceSettings = asyncHandler(async (req, res) => {
  const allowed = ['isListedOnEcommerce', 'isRetailProduct', 'ecommerceOrder', 'isPreorder', 'landingPageSection'];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  const product = await Product.findOneAndUpdate(
    { _id: req.params.id, ...(req.shopId && { shop: req.shopId }) },
    { $set: updates },
    { new: true }
  );

  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  res.status(200).json({ success: true, data: product });
});

/**
 * @desc    Bulk update ecommerce order (drag-and-drop reorder)
 * @route   PUT /api/ecommerce-admin/reorder
 * @access  Private (admin)
 *
 * Body: { products: [{ id, ecommerceOrder }] }
 */
const bulkUpdateEcommerceOrder = asyncHandler(async (req, res) => {
  const { products } = req.body;

  if (!products || !Array.isArray(products)) {
    return res.status(400).json({ success: false, message: 'Products array is required' });
  }

  const bulkOps = products.map(({ id, ecommerceOrder }) => ({
    updateOne: {
      filter: { _id: id },
      update: { $set: { ecommerceOrder } }
    }
  }));

  await Product.bulkWrite(bulkOps);

  res.status(200).json({ success: true, message: 'Ecommerce order updated' });
});

/**
 * @desc    Get ecommerce price breakdown for a product (shows all active batches)
 * @route   GET /api/ecommerce-admin/products/:id/price-breakdown
 * @access  Private (admin)
 */
const getEcommercePriceBreakdown = asyncHandler(async (req, res) => {
  const filter = {
    product: req.params.id,
    isActive: true,
    remainingQty: { $gt: 0 }
  };
  if (req.shopId) filter.shop = req.shopId;

  const batches = await StockBatch.find(filter)
    .select('batchNumber purchaseDate purchasePrice sellingPrice emiPrice ecommercePriceOverride remainingQty quantity')
    .sort({ purchaseDate: -1 });

  const maxSellingPrice = batches.reduce((max, b) => Math.max(max, b.sellingPrice), 0);
  const maxEcommercePrice = batches.reduce(
    (max, b) => Math.max(max, b.ecommercePriceOverride || b.sellingPrice),
    0
  );

  res.status(200).json({
    success: true,
    data: {
      batches,
      maxSellingPrice,
      maxEcommercePrice,
      displayPrice: maxEcommercePrice,
      totalStock: batches.reduce((sum, b) => sum + b.remainingQty, 0)
    }
  });
});

/**
 * @desc    Get preorder demand — pending/approved online orders grouped by product
 * @route   GET /api/ecommerce-admin/preorder-demand
 * @access  Private (admin)
 *
 * Returns: { productId: { pendingQty, orderCount } }
 */
const getPreorderDemand = asyncHandler(async (req, res) => {
  const shopFilter = req.shopId ? { shop: new mongoose.Types.ObjectId(req.shopId) } : {};

  // Aggregate pending online SaleOrders to get demand per product
  const demand = await SaleOrder.aggregate([
    {
      $match: {
        ...shopFilter,
        type: 'online',
        status: { $in: ['Pending', 'Approved'] },
        approvalStatus: { $in: ['Pending', 'Approved'] },
      }
    },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.product',
        pendingQty: { $sum: '$items.quantity' },
        orderCount: { $sum: 1 }
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
    { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 1,
        productName: '$product.name',
        productSku: '$product.sku',
        pendingQty: 1,
        orderCount: 1
      }
    }
  ]);

  // Convert to map for easy frontend lookup
  const demandMap = {};
  for (const d of demand) {
    if (!d._id) continue;
    demandMap[d._id.toString()] = {
      pendingQty: d.pendingQty,
      orderCount: d.orderCount,
      productName: d.productName,
      productSku: d.productSku
    };
  }

  res.status(200).json({
    success: true,
    count: demand.length,
    data: demandMap
  });
});

module.exports = {
  getEcommerceProducts,
  getAllProductsWithEcommerceStatus,
  toggleEcommerceVisibility,
  togglePreorder,
  updateEcommerceSettings,
  bulkUpdateEcommerceOrder,
  getEcommercePriceBreakdown,
  getPreorderDemand
};
