const Inventory = require('../models/Inventory');
const Product = require('../models/Product');
const StockBatch = require('../models/StockBatch');
const asyncHandler = require('express-async-handler');

// @desc    Get all inventory transactions
// @route   GET /api/inventory
// @access  Private
const getInventory = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 50;
  const startIndex = (page - 1) * limit;
  const search = req.query.search || '';
  const typeFilter = req.query.type || 'All';

  const mongoose = require('mongoose');
  const StockUnit = mongoose.model('StockUnit');
  const StockBatch = mongoose.model('StockBatch');

  // Build match filter
  const matchFilter = {};
  if (req.shopId) matchFilter.shop = req.shopId;
  
  // Handle frontend mapped typeFilter
  if (typeFilter !== 'All') {
    if (typeFilter === 'Transfer In') matchFilter.type = 'Transfer In';
    else if (typeFilter === 'Transfer Out') matchFilter.type = 'Transfer Out';
    else if (typeFilter === 'Stock In') {
      matchFilter.type = { $in: ['Opening Stock', 'Purchase', 'Adjustment'] }; // Positive quantity adjustment
      matchFilter.quantity = { $gt: 0 };
    }
    else if (typeFilter === 'Stock Out') {
      matchFilter.type = { $in: ['Sale', 'Purchase Return', 'Damage', 'Free Product'] };
    }
  }

  // Handle Search across Product (name, sku), Inventory (note, serialNumbers)
  if (search) {
    const searchRegex = new RegExp(search, 'i');
    
    // Find matching products
    const matchingProducts = await Product.find({
      $or: [
        { name: searchRegex },
        { sku: searchRegex }
      ]
    }).select('_id');
    const productIds = matchingProducts.map(p => p._id);

    matchFilter.$or = [
      { product: { $in: productIds } },
      { note: searchRegex },
      { serialNumbers: searchRegex }
    ];
  }

  const total = await Inventory.countDocuments(matchFilter);

  const inventory = await Inventory.find(matchFilter)
    .populate({
      path: 'product',
      select: 'name sku trackSerials'
    })
    .sort({ createdAt: -1 })
    .skip(startIndex)
    .limit(limit)
    .lean();

  const populatedData = await Promise.all(inventory.map(async (item) => {
    let serials = item.serialNumbers && item.serialNumbers.length > 0 ? item.serialNumbers : [];
    
    // Fallback to legacy lookups if no serials recorded directly on the Inventory document
    if (serials.length === 0 && item.product && item.product.trackSerials) {
      if (item.type === 'Sale' && item.referenceId) {
        const units = await StockUnit.find({ saleRef: item.referenceId, product: item.product._id });
        serials = units.map(u => u.serialNumber);
      } else if (item.type === 'Purchase' || item.type === 'Opening Stock') {
        if (item.referenceId) {
          const batches = await StockBatch.find({ purchaseId: item.referenceId, product: item.product._id });
          const units = await StockUnit.find({ batch: { $in: batches.map(b => b._id) } });
          serials = units.map(u => u.serialNumber);
        } else {
          const batches = await StockBatch.find({
            product: item.product._id,
            createdAt: {
              $gte: new Date(item.createdAt.getTime() - 15000),
              $lte: new Date(item.createdAt.getTime() + 15000)
            }
          });
          const units = await StockUnit.find({ batch: { $in: batches.map(b => b._id) } });
          serials = units.map(u => u.serialNumber);
        }
      }
    }
    const itemObj = item;
    itemObj.serials = serials;
    return itemObj;
  }));

  res.status(200).json({
    success: true,
    count: populatedData.length,
    total,
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    },
    data: populatedData
  });
});

// @desc    Get inventory by product
// @route   GET /api/inventory/product/:productId
// @access  Private
const getInventoryByProduct = asyncHandler(async (req, res) => {
  const inventory = await Inventory.find({ 
    product: req.params.productId,
    shop: req.shopId
  })
    .populate({
      path: 'product',
      select: 'name sku trackSerials'
    })
    .sort({ createdAt: -1 });

  const mongoose = require('mongoose');
  const StockUnit = mongoose.model('StockUnit');
  const StockBatch = mongoose.model('StockBatch');

  const populatedData = await Promise.all(inventory.map(async (item) => {
    let serials = [];
    if (item.product && item.product.trackSerials) {
      if (item.type === 'Sale' && item.referenceId) {
        const units = await StockUnit.find({ saleRef: item.referenceId, product: item.product._id });
        serials = units.map(u => u.serialNumber);
      } else if (item.type === 'Purchase' || item.type === 'Opening Stock') {
        if (item.referenceId) {
          const batches = await StockBatch.find({ purchaseId: item.referenceId, product: item.product._id });
          const units = await StockUnit.find({ batch: { $in: batches.map(b => b._id) } });
          serials = units.map(u => u.serialNumber);
        } else {
          const batches = await StockBatch.find({
            product: item.product._id,
            createdAt: {
              $gte: new Date(item.createdAt.getTime() - 15000),
              $lte: new Date(item.createdAt.getTime() + 15000)
            }
          });
          const units = await StockUnit.find({ batch: { $in: batches.map(b => b._id) } });
          serials = units.map(u => u.serialNumber);
        }
      }
    }
    const itemObj = item.toObject();
    itemObj.serials = serials;
    return itemObj;
  }));

  res.status(200).json({
    success: true,
    count: populatedData.length,
    data: populatedData
  });
});

// @desc    Get current stock for all products
// @route   GET /api/inventory/current
// @access  Private
const getCurrentStock = asyncHandler(async (req, res) => {
  const shopFilter = req.shopId ? { shop: req.shopId, isActive: true } : { isActive: true };
  const products = await Product.find(shopFilter)
    .populate('category', 'name')
    .populate('unit', 'name symbol');

  const stockData = await Promise.all(products.map(async (product) => {
    // Start with actual stock from batch aggregation
    const currentQuantity = await product.getActualStock(req.shopId);

    return {
      product: {
        _id: product._id,
        name: product.name,
        sku: product.sku,
        model: product.model,
        color: product.color,
        colors: product.colors || [],
        purchasePrice: product.purchasePrice,
        sellingPrice: product.sellingPrice,
        mrp: product.mrp,
        brand: product.brand,
        category: product.category,
        images: product.images || []  // Include product images
      },
      currentQuantity: currentQuantity,
      alertQuantity: product.alertQuantity,
      isLowStock: currentQuantity <= product.alertQuantity && currentQuantity >= 0,
      isOutOfStock: currentQuantity <= 0
    };
  }));

  res.status(200).json({
    success: true,
    count: stockData.length,
    data: stockData
  });
});

// @desc    Get current stock from StockBatch (new batch-aware endpoint)
// @route   GET /api/inventory/current-batches
// @access  Private
const getCurrentStockFromBatches = asyncHandler(async (req, res) => {
  const matchFilter = req.shopId ? { shop: req.shopId } : {};
  const mongoose = require('mongoose');
  const StockUnit = mongoose.model('StockUnit');

  // Find all batches
  const batches = await StockBatch.find({
    ...matchFilter
  })
    .populate({
      path: 'product',
      select: 'name sku model sellingPrice brand category images image alertQuantity trackSerials isListedOnEcommerce color colors',
      populate: [
        { path: 'category', select: 'name' },
        { path: 'brand', select: 'name' }
      ]
    })
    .sort({ purchaseDate: 1, batchNumber: 1 }); // Sort oldest first for FIFO

  const productGroups = {};

  // Fetch all StockUnits for batches that track serials at once to avoid N+1 queries
  const trackSerialBatches = batches.filter(b => b.product && b.product.trackSerials);
  const trackSerialBatchIds = trackSerialBatches.map(b => b._id);
  const allUnitsForBatches = trackSerialBatchIds.length > 0 
    ? await StockUnit.find({ batch: { $in: trackSerialBatchIds } }) 
    : [];
  
  // Group units by batch ID
  const unitsByBatch = {};
  for (const unit of allUnitsForBatches) {
    if (!unitsByBatch[unit.batch]) {
      unitsByBatch[unit.batch] = [];
    }
    unitsByBatch[unit.batch].push(unit);
  }

  // First pass: aggregate all batches by product
  for (const batch of batches) {
    if (!batch.product) continue;
    const productId = batch.product._id.toString();

    let currentQty = batch.remainingQty;
    let initialQty = batch.quantity;
    let availableSerials = [];
    let soldSerials = [];

    if (batch.product.trackSerials) {
      const allUnits = unitsByBatch[batch._id] || [];
      const availableUnits = allUnits.filter(u => u.status === 'available');
      currentQty = availableUnits.length;
      availableSerials = availableUnits.map(u => u.serialNumber);
      soldSerials = allUnits.filter(u => u.status === 'sold').map(u => u.serialNumber);
      
      // Fix sync issues if any
      if (batch.remainingQty !== currentQty || (currentQty > 0 && !batch.isActive)) {
        batch.remainingQty = currentQty;
        batch.isActive = currentQty > 0;
        batch.save().catch(err => console.error('Error syncing batch remainingQty:', err));
      }
    }

    if (!productGroups[productId]) {
      productGroups[productId] = {
        _id: productId, // keep product _id at root for frontend compatibility
        product: batch.product,
        currentQuantity: 0,
        initialQuantity: 0,
        soldQuantity: 0,
        alertQuantity: batch.product.alertQuantity,
        sellingPrice: batch.sellingPrice,
        purchasePrice: batch.purchasePrice,
        stockValue: 0,
        batches: [],
      };
    }

    // Accumulate totals
    productGroups[productId].currentQuantity += currentQty;
    productGroups[productId].initialQuantity += initialQty;
    productGroups[productId].soldQuantity += Math.max(0, initialQty - currentQty);
    productGroups[productId].stockValue += currentQty * batch.purchasePrice;
    
    // Keep updating to latest batch prices
    productGroups[productId].sellingPrice = batch.sellingPrice;
    productGroups[productId].purchasePrice = batch.purchasePrice;

    // Add all batches to batches array, including inactive ones
    productGroups[productId].batches.push({
      _id: batch._id,
      batchNumber: batch.batchNumber,
      remainingQty: currentQty,
      sellingPrice: batch.sellingPrice,
      purchasePrice: batch.purchasePrice,
      availableSerials: availableSerials,
      soldSerials: soldSerials,
      createdAt: batch.createdAt
    });
  }

  // Convert to array and format
  const enriched = Object.values(productGroups).map(item => ({
    ...item,
    activeBatches: item.batches.length,
    isLowStock: item.currentQuantity <= (item.product?.alertQuantity || 10) && item.currentQuantity > 0,
    isOutOfStock: item.currentQuantity <= 0,
  }));

  // Sort by product name
  enriched.sort((a, b) => a.product.name.localeCompare(b.product.name));

  res.status(200).json({
    success: true,
    count: enriched.length,
    data: enriched
  });
});

// @desc    Get current stock for a specific product
// @route   GET /api/inventory/current/:productId
// @access  Private
const getCurrentStockByProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({
    _id: req.params.productId,
    shop: req.shopId
  });

  if (!product) {
    return res.status(404).json({
      success: false,
      message: `Product not found with id ${req.params.productId}`
    });
  }

  const totalQuantity = await product.getActualStock();

  res.status(200).json({
    success: true,
    data: {
      product: {
        _id: product._id,
        name: product.name,
        sku: product.sku,
        model: product.model,
        color: product.color,
        colors: product.colors || []
      },
      currentQuantity: totalQuantity,
      alertQuantity: product.alertQuantity,
      isLowStock: totalQuantity <= product.alertQuantity
    }
  });
});

// @desc    Create inventory transaction (for opening stock, adjustments, etc.)
// @route   POST /api/inventory
// @access  Private
const createInventory = asyncHandler(async (req, res) => {
  const inventoryData = {
    ...req.body,
    shop: req.shopId
  };
  const inventory = await Inventory.create(inventoryData);

  res.status(201).json({
    success: true,
    data: inventory
  });
});

// @desc    Create opening stock inventory transaction
// @route   POST /api/inventory/opening-stock
// @access  Private
const createOpeningStock = asyncHandler(async (req, res) => {
  const { date, items } = req.body;

  try {
    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Items are required and must be an array'
      });
    }

    // Validate each item
    for (const item of items) {
      if (!item.product || !item.quantity || item.quantity <= 0 || !item.purchasePrice) {
        return res.status(400).json({
          success: false,
          message: 'Each item must have a product, quantity (> 0), and purchase price'
        });
      }
    }

    // Create inventory records for each item
    const inventoryRecords = [];
    for (const item of items) {
      // Update the product with the purchase and selling prices from the opening stock
      await Product.findOneAndUpdate(
        { _id: item.product, shop: req.shopId },
        {
          purchasePrice: item.purchasePrice,
          sellingPrice: item.sellingPrice
        }
      );

      const inventoryRecord = await Inventory.create({
        product: item.product,
        type: 'Opening Stock',
        referenceId: null,
        referenceModel: null,
        quantity: item.quantity,
        unitPrice: item.purchasePrice,
        date: date || new Date(),
        note: 'Opening stock entry',
        shop: req.shopId
      });

      inventoryRecords.push(inventoryRecord);
    }

    res.status(201).json({
      success: true,
      data: inventoryRecords
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Record damaged product
// @route   POST /api/inventory/damaged
// @access  Private
const recordDamagedProduct = asyncHandler(async (req, res) => {
  const { product, quantity, date, reason, note } = req.body;

  try {
    // Validate required fields
    if (!product || !quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Product and quantity are required'
      });
    }

    // Create inventory record for damaged product
    const inventory = await Inventory.create({
      product,
      type: 'Damage',
      referenceId: null, // No reference for damage
      referenceModel: null,
      quantity: -quantity, // Negative because it's damage (stock reduction)
      unitPrice: 0, // Damage doesn't have a price
      date: date || new Date(),
      note: `Damage: ${reason || 'N/A'} - ${note || ''}`,
      shop: req.shopId
    });

    // Populate the product details
    const populatedInventory = await Inventory.findOne({
      _id: inventory._id,
      shop: req.shopId
    })
      .populate('product', 'name sku');

    res.status(201).json({
      success: true,
      data: populatedInventory
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Get damaged products
// @route   GET /api/inventory/damaged
// @access  Private
const getDamagedProducts = asyncHandler(async (req, res) => {
  const damagedProducts = await Inventory.find({ type: 'Damage', shop: req.shopId })
    .populate('product', 'name sku')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: damagedProducts.length,
    data: damagedProducts
  });
});

// @desc    Record free product
// @route   POST /api/inventory/free
// @access  Private
const recordFreeProduct = asyncHandler(async (req, res) => {
  const { product, customer, quantity, date, reason, note } = req.body;

  try {
    // Validate required fields
    if (!product || !customer || !quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Product, customer, and quantity are required'
      });
    }

    // Create inventory record for free product
    const inventory = await Inventory.create({
      product,
      type: 'Free Product',
      referenceId: customer, // Reference to customer
      referenceModel: 'Customer',
      quantity: -quantity, // Negative because it's giving away (stock reduction)
      unitPrice: 0, // Free product
      date: date || new Date(),
      note: `Free Product: ${reason || 'N/A'} - ${note || ''}`,
      shop: req.shopId
    });

    // Populate the product and customer details
    const populatedInventory = await Inventory.findOne({
      _id: inventory._id,
      shop: req.shopId
    })
      .populate('product', 'name sku')
      .populate('referenceId', 'contactName phone');

    res.status(201).json({
      success: true,
      data: populatedInventory
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Get free products
// @route   GET /api/inventory/free
// @access  Private
const getFreeProducts = asyncHandler(async (req, res) => {
  const freeProducts = await Inventory.find({ type: 'Free Product', shop: req.shopId })
    .populate('product', 'name sku')
    .populate('referenceId', 'contactName phone')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: freeProducts.length,
    data: freeProducts
  });
});

// @desc    Get low stock items
// @route   GET /api/inventory/low-stock
// @access  Private
const getLowStockItems = asyncHandler(async (req, res) => {
  const shopFilter = req.shopId ? { shop: req.shopId, isActive: true } : { isActive: true };
  const products = await Product.find(shopFilter);

  const lowStockItems = [];
  for (const product of products) {
    const currentQuantity = await product.getActualStock(req.shopId);

    // Only flag as low stock when quantity is non-negative and at/below alert level
    const isLowStock = currentQuantity <= product.alertQuantity && currentQuantity >= 0;
    if (isLowStock) {
      lowStockItems.push({
        product: {
          _id: product._id,
          name: product.name,
          sku: product.sku,
          model: product.model,
          color: product.color,
          colors: product.colors || [],
          purchasePrice: product.purchasePrice,
          sellingPrice: product.sellingPrice,
          brand: product.brand,
          category: product.category,
        },
        currentQuantity,
        alertQuantity: product.alertQuantity,
        isLowStock: true,
        isOutOfStock: currentQuantity <= 0,
      });
    }
  }

  res.status(200).json({
    success: true,
    count: lowStockItems.length,
    data: lowStockItems
  });
});

module.exports = {
  getInventory,
  getInventoryByProduct,
  getCurrentStock,
  getCurrentStockByProduct,
  getCurrentStockFromBatches,
  createInventory,
  createOpeningStock,
  getLowStockItems,
  recordDamagedProduct,
  getDamagedProducts,
  recordFreeProduct,
  getFreeProducts
};