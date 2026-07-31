const Sale = require('../../models/Sale');
const SaleOrder = require('../../models/SaleOrder');
const Product = require('../../models/Product');
const Customer = require('../../models/Customer');
const User = require('../../models/User');

const Purchase = require('../../models/Purchase');
const Account = require('../../models/Account');
const Income = require('../../models/Income');
const Expense = require('../../models/Expense');
const Inventory = require('../../models/Inventory');
const EMIInvoice = require('../../models/EMIInvoice');
const Warranty = require('../../models/Warranty');
const Category = require('../../models/Category');
const asyncHandler = require('express-async-handler');
const moment = require('moment');
const mongoose = require('mongoose');
const { getMergedNotificationFeed } = require('../../utils/notificationFeed');
// const ExcelJS removed

const getPurchaseReports = asyncHandler(async (req, res) => {
  const { startDate, endDate, companyId, status } = req.query;

  let matchCondition = {};
  
  // Add shop context if available
  if (req.shopId) {
    const shopObjId = mongoose.Types.ObjectId.isValid(req.shopId) ? new mongoose.Types.ObjectId(req.shopId) : req.shopId;
    matchCondition.$or = [
      { shop: shopObjId },
      { shop: null },
      { shop: { $exists: false } }
    ];
  }
  
  // Add date range filtering
  if (startDate || endDate) {
    matchCondition.date = {};
    if (startDate) {
      matchCondition.date.$gte = new Date(startDate);
    }
    if (endDate) {
      matchCondition.date.$lte = new Date(endDate);
    }
  }
  
  // Add company/supplier filter
  const supplierId = req.query.supplierId || companyId;
  if (supplierId && mongoose.Types.ObjectId.isValid(supplierId)) {
    matchCondition.supplier = new mongoose.Types.ObjectId(supplierId);
  } else if (supplierId) {
    matchCondition.supplier = supplierId;
  }
  
  // Add status filter
  if (status) {
    matchCondition.status = status;
  }

  const purchases = await Purchase.find(matchCondition)
    .populate('supplier', 'name companyName contactNumber')
    .populate('items.product', 'name')
    .sort({ date: -1, createdAt: -1 });

  // Calculate summary statistics
  const summary = purchases.reduce((acc, purchase) => {
    acc.totalPurchases += 1;
    acc.totalAmount += purchase.total || 0;
    acc.totalPaid += purchase.paidAmount || 0;
    acc.totalDue += purchase.dueAmount || 0;
    return acc;
  }, { 
    totalPurchases: 0, 
    totalAmount: 0, 
    totalPaid: 0, 
    totalDue: 0 
  });

  res.status(200).json({
    success: true,
    count: purchases.length,
    data: purchases,
    summary
  });
});

// @desc    Get product-wise purchase report
// @route   GET /api/reports/purchase-product-wise
// @access  Private

const getProductWisePurchaseReport = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  let matchCondition = {};
  
  // Use shopId from query OR from shop context middleware
  const shopId = req.query.shopId || req.shopId;
  if (shopId) {
    const shopObjId = mongoose.Types.ObjectId.isValid(shopId) ? new mongoose.Types.ObjectId(shopId) : shopId;
    matchCondition.$or = [
      { shop: shopObjId },
      { shop: null },
      { shop: { $exists: false } }
    ];
  }
  
  // Add date range filtering
  if (startDate || endDate) {
    matchCondition.date = {};
    if (startDate) {
      matchCondition.date.$gte = new Date(startDate);
    }
    if (endDate) {
      matchCondition.date.$lte = new Date(endDate);
    }
  }

  const productWisePurchases = await Purchase.aggregate([
    { $match: matchCondition },
    { $unwind: "$items" },
    {
      $lookup: {
        from: "products",
        localField: "items.product",
        foreignField: "_id",
        as: "productInfo"
      }
    },
    { $unwind: "$productInfo" },
    {
      $lookup: {
        from: "categories",
        localField: "productInfo.category",
        foreignField: "_id",
        as: "categoryInfo"
      }
    },
    { $unwind: { path: "$categoryInfo", preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: "$items.product",
        productName: { $first: "$productInfo.name" },
        category: { $first: { $ifNull: ["$categoryInfo.name", "Uncategorized"] } },
        totalQuantity: { $sum: "$items.quantity" },
        totalAmount: { 
          $sum: { $multiply: ["$items.quantity", "$items.unitPrice"] } 
        },
        avgUnitPrice: { $avg: "$items.unitPrice" },
        purchaseCount: { $sum: 1 },
        suppliersSet: { $addToSet: "$supplier" }
      }
    },
    {
      $project: {
        _id: 1,
        productName: 1,
        category: 1,
        totalQuantity: 1,
        totalAmount: 1,
        avgUnitPrice: 1,
        purchaseCount: 1,
        suppliers: { $size: "$suppliersSet" }
      }
    },
    { $sort: { totalAmount: -1 } }
  ]);

  // Calculate summary
  const summary = productWisePurchases.reduce((acc, item) => {
    acc.totalProducts += 1;
    acc.totalQuantity += item.totalQuantity;
    acc.totalAmount += item.totalAmount;
    acc.totalPurchases += item.purchaseCount;
    return acc;
  }, { 
    totalProducts: 0, 
    totalQuantity: 0, 
    totalAmount: 0, 
    totalPurchases: 0 
  });

  res.status(200).json({
    success: true,
    data: productWisePurchases,
    summary
  });
});

const getProductPurchaseInvoices = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  
  let shopFilter = {};
  if (req.shopId) {
    const shopObjId = mongoose.Types.ObjectId.isValid(req.shopId) ? new mongoose.Types.ObjectId(req.shopId) : req.shopId;
    shopFilter.$or = [
      { shop: shopObjId },
      { shop: null },
      { shop: { $exists: false } }
    ];
  }

  let productFilter = productId;
  if (mongoose.Types.ObjectId.isValid(productId)) {
    productFilter = new mongoose.Types.ObjectId(productId);
  }

  // Find purchases containing the product
  const purchases = await Purchase.find({
    ...shopFilter,
    "items.product": productFilter
  })
    .populate('supplier', 'name companyName contactNumber email address')
    .populate('items.product', 'name sku category')
    .sort({ date: -1 });

  res.status(200).json({
    success: true,
    count: purchases.length,
    data: purchases
  });
});

// @desc    Get supplier-wise purchase report
// @route   GET /api/reports/purchase-supplier-wise
// @access  Private

const getSupplierWisePurchaseReport = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  let matchCondition = {};
  
  // Add shop context if available
  if (req.shopId) {
    const shopObjId = mongoose.Types.ObjectId.isValid(req.shopId) ? new mongoose.Types.ObjectId(req.shopId) : req.shopId;
    matchCondition.$or = [
      { shop: shopObjId },
      { shop: null },
      { shop: { $exists: false } }
    ];
  }
  
  // Add date range filtering
  if (startDate || endDate) {
    matchCondition.date = {};
    if (startDate) {
      matchCondition.date.$gte = new Date(startDate);
    }
    if (endDate) {
      matchCondition.date.$lte = new Date(endDate);
    }
  }

  const supplierWisePurchases = await Purchase.aggregate([
    { $match: matchCondition },
    {
      $lookup: {
        from: "suppliers",
        localField: "supplier",
        foreignField: "_id",
        as: "companyInfo"
      }
    },
    { $unwind: "$companyInfo" },
    {
      $group: {
        _id: "$supplier",
        supplierName: { $first: "$companyInfo.name" },
        supplierContact: { $first: "$companyInfo.contactNumber" },
        totalPurchases: { $sum: 1 },
        totalAmount: { $sum: "$total" },
        totalPaid: { $sum: "$paidAmount" },
        totalDue: { $sum: "$dueAmount" },
        avgPurchaseAmount: { $avg: "$total" }
      }
    },
    { $sort: { totalAmount: -1 } }
  ]);

  // Calculate summary
  const summary = supplierWisePurchases.reduce((acc, supplier) => {
    acc.totalSuppliers += 1;
    acc.totalPurchases += supplier.totalPurchases;
    acc.totalAmount += supplier.totalAmount;
    acc.totalPaid += supplier.totalPaid;
    acc.totalDue += supplier.totalDue;
    return acc;
  }, { 
    totalSuppliers: 0, 
    totalPurchases: 0, 
    totalAmount: 0, 
    totalPaid: 0, 
    totalDue: 0 
  });

  res.status(200).json({
    success: true,
    data: supplierWisePurchases,
    summary
  });
});

// @desc    Get purchase due report
// @route   GET /api/reports/purchase-dues
// @access  Private

const getPurchaseDueReport = asyncHandler(async (req, res) => {
  const { startDate, endDate, companyId, minDue } = req.query;

  let matchCondition = { dueAmount: { $gt: 0 } };
  
  // Use shopId from query OR from shop context middleware
  const shopId = req.query.shopId || req.shopId;
  if (shopId) {
    const shopObjId = mongoose.Types.ObjectId.isValid(shopId) ? new mongoose.Types.ObjectId(shopId) : shopId;
    matchCondition.$or = [
      { shop: shopObjId },
      { shop: null },
      { shop: { $exists: false } }
    ];
  }
  
  // Add date range filtering
  if (startDate || endDate) {
    matchCondition.date = {};
    if (startDate) {
      matchCondition.date.$gte = new Date(startDate);
    }
    if (endDate) {
      matchCondition.date.$lte = new Date(endDate);
    }
  }
  
  // Add company/supplier filter
  const supplierId = req.query.supplierId || companyId;
  if (supplierId && mongoose.Types.ObjectId.isValid(supplierId)) {
    matchCondition.supplier = new mongoose.Types.ObjectId(supplierId);
  } else if (supplierId) {
    matchCondition.supplier = supplierId;
  }

  // Minimum due amount filter
  if (minDue && !isNaN(parseFloat(minDue))) {
    matchCondition.dueAmount = { $gte: parseFloat(minDue) };
  }

  const duePurchases = await Purchase.find(matchCondition)
    .populate('supplier', 'name companyName contactNumber')
    .sort({ date: -1 });

  // Process data to calculate dynamic days overdue and due dates
  const processedData = duePurchases.map(purchase => {
    const purchaseObj = purchase.toObject();
    
    // Calculate days overdue (relative to current time)
    const milliseconds = new Date() - new Date(purchase.date);
    const daysOverdue = Math.max(0, Math.floor(milliseconds / (1000 * 60 * 60 * 24)));
    purchaseObj.daysOverdue = daysOverdue;
    
    // Calculate standard payment due date (30 days from purchase)
    const dueDate = new Date(purchase.date);
    dueDate.setDate(dueDate.getDate() + 30);
    purchaseObj.dueDate = dueDate;
    
    return purchaseObj;
  });

  // Calculate detailed summary statistics
  const summary = {
    totalDues: 0,
    totalOrders: processedData.length,
    averageDue: 0,
    agingAnalysis: {
      current: 0,      // 0-30 days
      days30_60: 0,    // 31-60 days
      days60_90: 0,    // 61-90 days
      above90: 0       // Above 90 days
    }
  };

  processedData.forEach(purchase => {
    summary.totalDues += purchase.dueAmount || 0;
    const days = purchase.daysOverdue || 0;
    if (days <= 30) {
      summary.agingAnalysis.current++;
    } else if (days <= 60) {
      summary.agingAnalysis.days30_60++;
    } else if (days <= 90) {
      summary.agingAnalysis.days60_90++;
    } else {
      summary.agingAnalysis.above90++;
    }
  });

  summary.averageDue = summary.totalDues / (summary.totalOrders || 1);

  res.status(200).json({
    success: true,
    count: processedData.length,
    data: processedData,
    summary
  });
});

// @desc    Get purchase return report
// @route   GET /api/reports/purchase-returns
// @access  Private

const getPurchaseReturnReport = asyncHandler(async (req, res) => {
  const { startDate, endDate, companyId, productId, returnReason } = req.query;

  let matchCondition = {
    status: { $in: ['Partial', 'Cancelled'] }
  };
  
  // Use shopId from query OR from shop context middleware
  const shopId = req.query.shopId || req.shopId;
  if (shopId) {
    const shopObjId = mongoose.Types.ObjectId.isValid(shopId) ? new mongoose.Types.ObjectId(shopId) : shopId;
    matchCondition.$or = [
      { shop: shopObjId },
      { shop: null },
      { shop: { $exists: false } }
    ];
  }
  
  // Add date range filtering
  if (startDate || endDate) {
    matchCondition.date = {};
    if (startDate) {
      matchCondition.date.$gte = new Date(startDate);
    }
    if (endDate) {
      matchCondition.date.$lte = new Date(endDate);
    }
  }

  // Add company/supplier filter
  const supplierId = req.query.supplierId || companyId;
  if (supplierId && mongoose.Types.ObjectId.isValid(supplierId)) {
    matchCondition.supplier = new mongoose.Types.ObjectId(supplierId);
  } else if (supplierId) {
    matchCondition.supplier = supplierId;
  }

  // Find matching purchases
  const purchases = await Purchase.find(matchCondition)
    .populate('supplier', 'name companyName contactNumber')
    .populate('items.product', 'name')
    .sort({ date: -1 });

  // Transform and flat-map items for the return report
  let returnedItems = [];
  purchases.forEach(purchase => {
    purchase.items.forEach(item => {
      // Filter by productId if provided
      if (productId && item.product && item.product._id.toString() !== productId.toString()) {
        return;
      }
      
      const reason = purchase.status === 'Cancelled' ? 'Defective / Cancelled' : 'Partial Return / Shortage';
      
      // Filter by returnReason if provided
      if (returnReason && reason.toLowerCase() !== returnReason.toLowerCase()) {
        return;
      }

      returnedItems.push({
        _id: `${purchase._id}_${item._id}`,
        purchaseId: purchase._id,
        purchaseNumber: purchase.purchaseNumber,
        date: purchase.date,
        company: {
          _id: purchase.supplier?._id,
          name: purchase.supplier?.name || 'Unknown Supplier',
          businessName: purchase.supplier?.companyName || purchase.supplier?.name || 'Unknown Supplier',
          contactNumber: purchase.supplier?.contactNumber
        },
        product: {
          _id: item.product?._id,
          name: item.product?.name || 'Unknown Product'
        },
        quantity: item.quantity,
        rate: item.unitPrice,
        total: item.quantity * item.unitPrice,
        reason: reason
      });
    });
  });

  // Calculate summary statistics
  let totalValue = 0;
  let totalQuantity = 0;
  const productCount = {};
  
  returnedItems.forEach(item => {
    totalValue += item.total;
    totalQuantity += item.quantity;
    const prodName = item.product.name;
    if (prodName) {
      productCount[prodName] = (productCount[prodName] || 0) + item.quantity;
    }
  });

  // Find most returned product
  let mostReturnedProduct = 'N/A';
  let maxQty = 0;
  for (const [prod, qty] of Object.entries(productCount)) {
    if (qty > maxQty) {
      maxQty = qty;
      mostReturnedProduct = prod;
    }
  }

  const summary = {
    totalValue,
    totalQuantity,
    averageRate: totalQuantity ? (totalValue / totalQuantity) : 0,
    mostReturnedProduct,
    returnCount: returnedItems.length
  };

  res.status(200).json({
    success: true,
    count: returnedItems.length,
    data: returnedItems,
    summary
  });
});


// @desc    Get Purchase Top Sheet
// @route   GET /api/reports/purchase-top-sheet
// @access  Private

const getPurchaseTopSheet = asyncHandler(async (req, res) => {
  const { startDate, endDate, limit = 50 } = req.query;
  
  let matchCondition = {};
  
  if (req.shopId) {
    const shopObjId = mongoose.Types.ObjectId.isValid(req.shopId) ? new mongoose.Types.ObjectId(req.shopId) : req.shopId;
    matchCondition.$or = [
      { shop: shopObjId },
      { shop: null },
      { shop: { $exists: false } }
    ];
  }

  if (startDate || endDate) {
    matchCondition.createdAt = {};
    if (startDate) {
      matchCondition.createdAt.$gte = new Date(startDate);
    }
    if (endDate) {
      matchCondition.createdAt.$lte = new Date(endDate);
    }
  }

  // Aggregate purchase data by product and supplier
  const topPurchases = await Purchase.aggregate([
    { $match: matchCondition },
    { $unwind: '$items' },
    {
      $group: {
        _id: {
          product: '$items.product',
          productName: '$items.name',
          supplier: '$supplier'
        },
        totalQuantity: { $sum: '$items.quantity' },
        totalValue: { $sum: { $multiply: ['$items.quantity', '$items.unitPrice'] } },
        avgRate: { $avg: '$items.unitPrice' },
        purchaseCount: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: 'products',
        localField: '_id.product',
        foreignField: '_id',
        as: 'productInfo'
      }
    },
    {
      $lookup: {
        from: 'suppliers',
        localField: '_id.supplier',
        foreignField: '_id',
        as: 'supplierInfo'
      }
    },
    {
      $project: {
        productName: { $arrayElemAt: ['$productInfo.name', 0] },
        supplierName: { $arrayElemAt: ['$supplierInfo.name', 0] },
        supplierCompanyName: { $arrayElemAt: ['$supplierInfo.companyName', 0] },
        totalQuantity: 1,
        totalValue: 1,
        avgRate: { $round: ['$avgRate', 2] },
        purchaseCount: 1
      }
    },
    { $sort: { totalValue: -1 } },
    { $limit: parseInt(limit) }
  ]);

  // Add rank
  const rankedPurchases = topPurchases.map((purchase, index) => ({
    ...purchase,
    rank: index + 1
  }));

  res.status(200).json({
    success: true,
    count: rankedPurchases.length,
    data: rankedPurchases
  });
});

// @desc    Get Sales Top Sheet
// @route   GET /api/reports/sales-top-sheet
// @access  Private

const getPurchaseCommissionReport = asyncHandler(async (req, res) => {
  const { startDate, endDate, limit = 50 } = req.query;
  
  let matchCondition = {};
  
  if (req.shopId) {
    const shopObjId = mongoose.Types.ObjectId.isValid(req.shopId) ? new mongoose.Types.ObjectId(req.shopId) : req.shopId;
    matchCondition.$or = [
      { shop: shopObjId },
      { shop: null },
      { shop: { $exists: false } }
    ];
  }

  if (startDate || endDate) {
    matchCondition.createdAt = {};
    if (startDate) {
      matchCondition.createdAt.$gte = new Date(startDate);
    }
    if (endDate) {
      matchCondition.createdAt.$lte = new Date(endDate);
    }
  }

  // Aggregate purchase commission data
  const commissionData = await Purchase.aggregate([
    { $match: matchCondition },
    { $unwind: '$items' },
    {
      $group: {
        _id: {
          supplier: '$supplier',
          product: '$items.product'
        },
        supplierName: { $first: '$supplierName' },
        productName: { $first: '$items.name' },
        totalPurchase: { $sum: { $multiply: ['$items.quantity', '$items.unitPrice'] } },
        totalQuantity: { $sum: '$items.quantity' },
        purchaseCount: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: 'suppliers',
        localField: '_id.supplier',
        foreignField: '_id',
        as: 'supplierInfo'
      }
    },
    {
      $lookup: {
        from: 'products',
        localField: '_id.product',
        foreignField: '_id',
        as: 'productInfo'
      }
    },
    {
      $project: {
        supplierName: { $arrayElemAt: ['$supplierInfo.name', 0] },
        supplierCompanyName: { $arrayElemAt: ['$supplierInfo.companyName', 0] },
        productName: { $arrayElemAt: ['$productInfo.name', 0] },
        totalPurchase: 1,
        totalQuantity: 1,
        purchaseCount: 1,
        // Assuming 5% commission rate - this should be configurable
        commissionRate: 5,
        commissionAmount: { $multiply: ['$totalPurchase', 0.05] },
        status: 'Paid' // This should come from actual commission payment data
      }
    },
    { $sort: { commissionAmount: -1 } },
    { $limit: parseInt(limit) }
  ]);

  // Add rank
  const rankedCommissions = commissionData.map((commission, index) => ({
    ...commission,
    rank: index + 1
  }));

  res.status(200).json({
    success: true,
    count: rankedCommissions.length,
    data: rankedCommissions
  });
});

// @desc    Get Consolidated Invoice Report
// @route   GET /api/reports/consolidated-invoice
// @access  Private

module.exports = {
  getPurchaseReports,
  getProductWisePurchaseReport,
  getProductPurchaseInvoices,
  getSupplierWisePurchaseReport,
  getPurchaseDueReport,
  getPurchaseReturnReport,
  getPurchaseTopSheet,
  getPurchaseCommissionReport
};
