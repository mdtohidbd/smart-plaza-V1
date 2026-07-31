const StockBatch = require('../models/StockBatch');
const StockUnit = require('../models/StockUnit');
const Purchase = require('../models/Purchase');
const Inventory = require('../models/Inventory');
const Supplier = require('../models/Supplier');
const Product = require('../models/Product');
const Expense = require('../models/Expense');
const ExpenseHead = require('../models/ExpenseHead');
const asyncHandler = require('express-async-handler');
const { generateBatchNumber } = require('./stockBatchController');

const createStockIn = asyncHandler(async (req, res) => {
  const { purchaseId, items, note } = req.body;

  // ── Validation ──────────────────────────────────────────────────────────────
  if (!purchaseId) {
    return res.status(400).json({ success: false, message: 'Purchase ID is required' });
  }
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'At least one item is required' });
  }

  const purchase = await Purchase.findOne({ _id: purchaseId, shop: req.shopId });
  if (!purchase) {
    return res.status(404).json({ success: false, message: 'Purchase not found' });
  }

  for (const [i, item] of items.entries()) {
    if (!item.product)
      return res.status(400).json({ success: false, message: `Item ${i + 1}: product is required` });
    if (!item.quantity || item.quantity < 1)
      return res.status(400).json({ success: false, message: `Item ${i + 1}: quantity must be >= 1` });

    const prod = await Product.findOne({ _id: item.product, shop: req.shopId });
    if (!prod) {
      return res.status(404).json({ success: false, message: `Item ${i + 1}: Product not found` });
    }

    if (prod.trackSerials) {
      if (!item.serials || !Array.isArray(item.serials) || item.serials.filter(s => s.trim()).length !== Number(item.quantity)) {
        return res.status(400).json({ success: false, message: `Item ${i + 1}: ${prod.name} tracks serials; please enter all ${item.quantity} serial(s)` });
      }
    }
  }

  // ── 2. Create StockBatch + StockUnit + Inventory per item ─────────────────────
  const createdBatches = [];

  for (const item of items) {
    // Find matching item in purchase to get purchase price
    const purchaseItem = purchase.items.find(pi => pi.product.toString() === item.product.toString());
    if (!purchaseItem) {
      return res.status(400).json({ success: false, message: `Product ${item.product} not found in this purchase` });
    }

    const batchNumber = await generateBatchNumber(req.shopId);

    const batch = await StockBatch.create({
      batchNumber,
      product: item.product,
      supplier: purchase.supplier,
      purchaseId: purchase._id,
      isOpeningStock: false,
      purchaseDate: purchase.date || new Date(),
      purchasePrice: purchaseItem.unitPrice,
      sellingPrice: purchaseItem.sellingPrice || 0,
      emiPrice: purchaseItem.emiPrice || null,
      quantity: item.quantity,
      remainingQty: item.quantity,
      isActive: true,
      note: note || `Stock-In via ${purchase.purchaseNumber}`,
      shop: req.shopId
    });

    // ── 2a. Serial units (if product trackSerials = true) ──────────────────────
    if (item.serials && item.serials.length > 0) {
      if (item.serials.length !== item.quantity) {
        return res.status(400).json({ success: false, message: `Number of serials does not match quantity for product ${item.product}` });
      }
      
      const unitDocs = item.serials.map(serial => ({
        batch: batch._id,
        product: item.product,
        serialNumber: serial.trim(),
        status: 'available',
        shop: req.shopId
      }));
      await StockUnit.insertMany(unitDocs);
    }

    // ── 2b. Inventory transaction ──────────────────────────────────────────────
    await Inventory.create({
      product: item.product,
      type: 'Purchase',
      referenceId: purchase._id,
      referenceModel: 'Purchase',
      quantity: item.quantity,
      unitPrice: purchaseItem.unitPrice,
      date: new Date(),
      note: purchase.purchaseNumber,
      shop: req.shopId
    });

    createdBatches.push(batch);
  }

  // Mark purchase as stock updated (if we track it there, else just return)
  if (purchase.updateStock !== true) {
    purchase.updateStock = true;
    await purchase.save();
  }

  res.status(201).json({
    success: true,
    message: `Stock-In complete. ${createdBatches.length} batch(es) created.`,
    data: {
      purchase,
      batches: createdBatches
    }
  });
});

/**
 * @desc    Get all stock-in records (purchases with batch summary)
 * @route   GET /api/stock-in
 * @access  Private
 */
const getStockInHistory = asyncHandler(async (req, res) => {
  const filter = req.shopId ? { shop: req.shopId } : {};

  const purchases = await Purchase.find(filter)
    .populate('supplier', 'name companyName')
    .populate('items.product', 'name sku')
    .sort({ createdAt: -1 });

  // Enrich each purchase with its batch info
  const enriched = await Promise.all(
    purchases.map(async (p) => {
      const batches = await StockBatch.find({
        purchaseId: p._id
      }).select('batchNumber quantity remainingQty purchasePrice sellingPrice isActive');

      return {
        ...p.toObject(),
        batches
      };
    })
  );

  res.status(200).json({ success: true, count: enriched.length, data: enriched });
});

/**
 * @desc    Get stock-in detail for a single purchase
 * @route   GET /api/stock-in/:purchaseId
 * @access  Private
 */
const getStockInDetail = asyncHandler(async (req, res) => {
  const purchase = await Purchase.findOne({
    _id: req.params.purchaseId,
    ...(req.shopId && { shop: req.shopId })
  })
    .populate('supplier', 'name companyName contactNumber')
    .populate('items.product', 'name sku brand category trackSerials');

  if (!purchase) {
    return res.status(404).json({ success: false, message: 'Stock-In record not found' });
  }

  const batches = await StockBatch.find({ purchaseId: purchase._id })
    .populate('product', 'name sku trackSerials');

  // Get serial units for serial-tracked products
  const batchesWithUnits = await Promise.all(
    batches.map(async (batch) => {
      const units = await StockUnit.find({ batch: batch._id }).select('serialNumber status saleDate');
      return { ...batch.toObject(), units };
    })
  );

    res.status(200).json({
    success: true,
    data: {
      purchase,
      batches: batchesWithUnits
    }
  });
});

/**
 * @desc    Create a direct stock-in entry (without purchase invoice)
 * @route   POST /api/stock-in/direct
 * @access  Private
 */
const createDirectStockIn = asyncHandler(async (req, res) => {
  const { supplier, items, note } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'At least one item is required' });
  }

  // Verify supplier exists if provided
  if (supplier) {
    const supplierQuery = { _id: supplier };
    if (req.shopId) {
      supplierQuery.$or = [
        { shop: req.shopId },
        { shop: null },
        { shop: { $exists: false } }
      ];
    }
    const supplierExists = await Supplier.findOne(supplierQuery);
    if (!supplierExists) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }
  }

  // Validate each item
  for (const [i, item] of items.entries()) {
    if (!item.product) {
      return res.status(400).json({ success: false, message: `Item ${i + 1}: product is required` });
    }
    if (!item.quantity || item.quantity < 1) {
      return res.status(400).json({ success: false, message: `Item ${i + 1}: quantity must be >= 1` });
    }
    if (item.purchasePrice === undefined || item.purchasePrice < 0) {
      return res.status(400).json({ success: false, message: `Item ${i + 1}: purchase price must be >= 0` });
    }
    if (item.sellingPrice === undefined || item.sellingPrice < 0) {
      return res.status(400).json({ success: false, message: `Item ${i + 1}: selling price must be >= 0` });
    }

    const prod = await Product.findOne({ _id: item.product, shop: req.shopId });
    if (!prod) {
      return res.status(404).json({ success: false, message: `Item ${i + 1}: Product not found` });
    }

    if (prod.trackSerials) {
      if (!item.serials || !Array.isArray(item.serials) || item.serials.filter(s => s.trim()).length !== Number(item.quantity)) {
        return res.status(400).json({ success: false, message: `Item ${i + 1}: ${prod.name} tracks serials; please enter all ${item.quantity} serial(s)` });
      }
    }
  }

  const createdBatches = [];

  for (const item of items) {
    const batchNumber = await generateBatchNumber(req.shopId);

    const batch = await StockBatch.create({
      batchNumber,
      product: item.product,
      supplier: supplier || null,
      purchaseId: null,
      isOpeningStock: false,
      purchaseDate: new Date(),
      purchasePrice: Number(item.purchasePrice),
      sellingPrice: Number(item.sellingPrice),
      emiPrice: item.emiPrice ? Number(item.emiPrice) : null,
      quantity: Number(item.quantity),
      remainingQty: Number(item.quantity),
      isActive: true,
      note: note || `Direct Stock-In`,
      shop: req.shopId
    });

    if (item.serials && item.serials.length > 0) {
      const unitDocs = item.serials.map(serial => ({
        batch: batch._id,
        product: item.product,
        serialNumber: serial.trim(),
        status: 'available',
        shop: req.shopId
      }));
      await StockUnit.insertMany(unitDocs);
    }

    await Inventory.create({
      product: item.product,
      type: 'Purchase',
      referenceId: null,
      referenceModel: null,
      quantity: Number(item.quantity),
      unitPrice: Number(item.purchasePrice),
      date: new Date(),
      note: note || 'Direct Stock-In',
      shop: req.shopId
    });

    createdBatches.push(batch);
  }

  res.status(201).json({
    success: true,
    message: `Direct Stock-In complete. ${createdBatches.length} batch(es) created.`,
    data: {
      batches: createdBatches
    }
  });
});

module.exports = {
  createStockIn,
  getStockInHistory,
  getStockInDetail,
  createDirectStockIn
};
