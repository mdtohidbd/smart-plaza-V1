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
const getShopMatch = (shopId) => {
  if (!shopId) return {};
  if (mongoose.Types.ObjectId.isValid(shopId)) {
    return { shop: new mongoose.Types.ObjectId(shopId) };
  }
  return { shop: shopId };
};

const getSalesAnalytics = asyncHandler(async (req, res) => {
  const { startDate, endDate, type, userId, supplierId } = req.query;

  let matchCondition = { ...getShopMatch(req.shopId) };  
  if (type) {
    matchCondition.type = type;
  }
  if (userId) {
    matchCondition.assignedSR = userId;
  }

  if (startDate || endDate) {
    matchCondition.date = {};
    if (startDate) {
      matchCondition.date.$gte = new Date(startDate);
    }
    if (endDate) {
      matchCondition.date.$lte = new Date(endDate);
    }
  }

  // First get all sales orders with approved/delivered status
  const salesData = await SaleOrder.aggregate([
    { $match: { ...matchCondition, status: { $in: ['Approved', 'Delivered'] } } },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } }
        },
        totalSales: { $sum: "$total" },
        totalOrders: { $sum: 1 },
        totalItems: { $sum: { $size: "$items" } },
        avgOrderValue: { $avg: "$total" }
      }
    },
    { $sort: { "_id.date": 1 } }
  ]);

  // Also get traditional sales data (exclude Cancelled)
  const traditionalSalesData = await Sale.aggregate([
    { $match: { ...matchCondition, status: { $ne: 'Cancelled' } } },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } }
        },
        totalSales: { $sum: "$total" },
        totalOrders: { $sum: 1 },
        totalItems: { $sum: { $size: "$items" } },
        avgOrderValue: { $avg: "$total" }
      }
    },
    { $sort: { "_id.date": 1 } }
  ]);

  // Combine both datasets
  const combinedSalesData = [...salesData, ...traditionalSalesData];

  // Calculate summary statistics
  const summary = combinedSalesData.reduce((acc, curr) => {
    acc.totalSales += curr.totalSales;
    acc.totalOrders += curr.totalOrders;
    acc.totalItems += curr.totalItems;
    return acc;
  }, { totalSales: 0, totalOrders: 0, totalItems: 0 });

  res.status(200).json({
    success: true,
    data: {
      dailySales: combinedSalesData,
      summary
    }
  });
});

// @desc    Get product-wise sales report
// @route   GET /api/reports/product-wise-sales
// @access  Private

const getProductWiseSales = asyncHandler(async (req, res) => {
  const { startDate, endDate, type } = req.query;
  
  let matchCondition = {};
  
  // Add shop context
  Object.assign(matchCondition, getShopMatch(req.shopId));
  
  // Add date range filtering
  if (startDate || endDate) {
    matchCondition.date = {};
    if (startDate) matchCondition.date.$gte = new Date(startDate);
    if (endDate) matchCondition.date.$lte = new Date(endDate);
  }
  
  // Helper function to build aggregation pipeline
  const getPipeline = (match) => [
    { $match: match },
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
      $lookup: {
        from: "brands",
        localField: "productInfo.brand",
        foreignField: "_id",
        as: "brandInfo"
      }
    },
    { $unwind: { path: "$brandInfo", preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: "$items.product",
        productName: { $first: "$productInfo.name" },
        image: { $first: "$productInfo.image" },
        sku: { $first: "$productInfo.sku" },
        model: { $first: "$productInfo.model" },
        category: { $first: { $ifNull: ["$categoryInfo.name", "Uncategorized"] } },
        brand: { $first: { $ifNull: ["$brandInfo.name", "N/A"] } },
        totalQuantity: { $sum: "$items.quantity" },
        totalValue: { $sum: { $multiply: ["$items.quantity", "$items.unitPrice"] } },
        totalCost: { $sum: { $ifNull: ["$items.purchaseCost", 0] } },
        allBatches: { $push: "$items.batchesUsed" },
        salesCount: { $sum: 1 }
      }
    }
  ];

  let orderData = [];
  let saleData = [];

  // Fetch from SaleOrder for wholesale (only non-converted orders)
  if (!type || type === 'wholesale') {
    const orderMatch = { ...matchCondition, type: 'wholesale', status: { $in: ['Approved', 'Delivered'] } };
    orderData = await SaleOrder.aggregate(getPipeline(orderMatch));
  }

  // Fetch from Sale for all completed/pending sales
  const saleStatus = { $in: ['Completed', 'Pending', 'Partial'] };
  if (!type) {
    saleData = await Sale.aggregate(getPipeline({ ...matchCondition, status: saleStatus }));
  } else {
    saleData = await Sale.aggregate(getPipeline({ ...matchCondition, type, status: saleStatus }));
  }

  // Combine orderData and saleData
  const combinedMap = new Map();
  [...orderData, ...saleData].forEach(item => {
    const id = item._id.toString();
    
    // Process batches
    let consolidatedBatches = {};
    if (item.allBatches && Array.isArray(item.allBatches)) {
      item.allBatches.forEach(batchArray => {
        if (batchArray && Array.isArray(batchArray)) {
          batchArray.forEach(b => {
            if (b && b.batch) {
              const batchId = b.batch.toString();
              if (consolidatedBatches[batchId]) {
                consolidatedBatches[batchId].quantity += b.quantity;
              } else {
                consolidatedBatches[batchId] = { ...b };
              }
            }
          });
        }
      });
    }

    if (combinedMap.has(id)) {
      const existing = combinedMap.get(id);
      existing.totalQuantity += item.totalQuantity;
      existing.totalValue += item.totalValue;
      existing.totalCost += item.totalCost;
      existing.salesCount += item.salesCount;
      
      // Merge batches
      Object.values(consolidatedBatches).forEach(b => {
        const batchId = b.batch.toString();
        const exBatchIndex = existing.batchesUsed.findIndex(exB => exB.batch.toString() === batchId);
        if (exBatchIndex > -1) {
          existing.batchesUsed[exBatchIndex].quantity += b.quantity;
        } else {
          existing.batchesUsed.push(b);
        }
      });
    } else {
      combinedMap.set(id, { 
        ...item, 
        batchesUsed: Object.values(consolidatedBatches) 
      });
    }
  });

  const productWiseSales = Array.from(combinedMap.values()).map(item => {
    // If totalCost is 0 (old data), we can optionally estimate, but for now we use what we have
    const profit = item.totalValue - item.totalCost;
    return {
      ...item,
      profit,
      avgRate: item.totalQuantity > 0 ? item.totalValue / item.totalQuantity : 0
    };
  }).sort((a, b) => b.totalValue - a.totalValue);
  
  // Fetch batch details (batchNumber, etc.)
  const StockBatch = mongoose.model('StockBatch');
  const allBatchIds = new Set();
  productWiseSales.forEach(product => {
    if (product.batchesUsed) {
      product.batchesUsed.forEach(b => {
        if (b.batch) allBatchIds.add(b.batch.toString());
      });
    }
  });

  const batchesData = await StockBatch.find({ _id: { $in: Array.from(allBatchIds) } }, 'batchNumber').lean();
  const batchMap = {};
  batchesData.forEach(b => {
    batchMap[b._id.toString()] = b.batchNumber;
  });
  
  // Add rank and format data
  const rankedProducts = productWiseSales.map((product, index) => {
    const populatedBatches = (product.batchesUsed || []).map(b => ({
      ...b,
      batchNumber: batchMap[b.batch.toString()] || 'Unknown'
    }));
    
    return {
      ...product,
      rank: index + 1,
      avgRate: Math.round(product.avgRate * 100) / 100,
      totalValue: Math.round(product.totalValue * 100) / 100,
      totalCost: Math.round(product.totalCost * 100) / 100,
      profit: Math.round(product.profit * 100) / 100,
      allBatches: undefined, // Remove raw arrays
      batchesUsed: populatedBatches
    };
  });
  
  res.status(200).json({
    success: true,
    count: rankedProducts.length,
    data: rankedProducts
  });
});

// @desc    Get company-wise sales report
// @route   GET /api/reports/company-sales
// @access  Private

const getSupplierWiseSales = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  console.log('=== COMPANY SALES REPORT DEBUG ===');
  console.log('Query params:', { startDate, endDate });
  console.log('Shop ID:', req.shopId);

  let matchCondition = { status: { $in: ['Approved', 'Delivered'] } };

  Object.assign(matchCondition, getShopMatch(req.shopId));
  if (startDate || endDate) {
    matchCondition.date = {};
    if (startDate) {
      matchCondition.date.$gte = new Date(startDate);
    }
    if (endDate) {
      matchCondition.date.$lte = new Date(endDate);
    }
  }

  console.log('Match condition:', JSON.stringify(matchCondition, null, 2));

  // Aggregate sales by company through products
  const supplierSales = await SaleOrder.aggregate([
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
      $group: {
        _id: "$productInfo.supplier",
        totalSales: { $sum: { $multiply: ["$items.quantity", "$items.unitPrice"] } },
        totalQuantity: { $sum: "$items.quantity" },
        orderCount: { $sum: 1 },
        avgOrderValue: { $avg: { $multiply: ["$items.quantity", "$items.unitPrice"] } }
      }
    },
    {
      $lookup: {
        from: "suppliers",
        localField: "_id",
        foreignField: "_id",
        as: "supplierDetails"
      }
    },
    {
      $unwind: { path: "$supplierDetails", preserveNullAndEmptyArrays: true }
    },
    {
      $project: {
        _id: 1,
        supplierName: { $ifNull: ["$supplierDetails.name", "Unknown"] },
        supplierAddress: { $ifNull: ["$supplierDetails.address", ""] },
        totalSales: 1,
        totalQuantity: 1,
        orderCount: 1,
        avgOrderValue: 1
      }
    }
  ]);

  console.log('Company sales result count:', supplierSales.length);
  console.log('=================================\n');

  res.status(200).json({
    success: true,
    data: supplierSales
  });
});

// @desc    Get supplier-wise sales report
// @route   GET /api/reports/supplier-sales
// @access  Private

const getDailySales = asyncHandler(async (req, res) => {
  const { date } = req.query;

  const targetDate = date ? new Date(date) : new Date();
  // Set to start of day
  const startDate = new Date(targetDate.setHours(0, 0, 0, 0));
  // Set to end of day
  const endDate = new Date(targetDate.setHours(23, 59, 59, 999));

  // Get daily sales from SaleOrder
  const dailySaleOrders = await SaleOrder.aggregate([
    {
      $match: {
        ...getShopMatch(req.shopId),
        status: { $ne: 'Cancelled' },
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: null,
        totalSales: { $sum: "$total" },
        totalOrders: { $sum: 1 },
        totalItems: { $sum: { $size: "$items" } },
        cashSales: {
          $sum: {
            $cond: [{ $eq: ["$paymentMethod", "Cash"] }, "$total", 0]
          }
        },
        creditSales: {
          $sum: {
            $cond: [{ $eq: ["$paymentMethod", "Credit"] }, "$total", 0]
          }
        }
      }
    }
  ]);

  // Get daily sales from traditional Sale
  const dailyTraditionalSales = await Sale.aggregate([
    {
      $match: {
        ...getShopMatch(req.shopId),
        status: { $ne: 'Cancelled' },
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: null,
        totalSales: { $sum: "$total" },
        totalOrders: { $sum: 1 },
        totalItems: { $sum: { $size: "$items" } },
        cashSales: {
          $sum: {
            $cond: [{ $eq: ["$paymentMethod", "Cash"] }, "$total", 0]
          }
        },
        creditSales: {
          $sum: {
            $cond: [{ $eq: ["$paymentMethod", "Credit"] }, "$total", 0]
          }
        }
      }
    }
  ]);

  // Calculate combined totals
  const combinedTotalSales = (dailySaleOrders[0]?.totalSales || 0) + (dailyTraditionalSales[0]?.totalSales || 0);
  const combinedTotalOrders = (dailySaleOrders[0]?.totalOrders || 0) + (dailyTraditionalSales[0]?.totalOrders || 0);
  const combinedTotalItems = (dailySaleOrders[0]?.totalItems || 0) + (dailyTraditionalSales[0]?.totalItems || 0);
  const combinedCashSales = (dailySaleOrders[0]?.cashSales || 0) + (dailyTraditionalSales[0]?.cashSales || 0);
  const combinedCreditSales = (dailySaleOrders[0]?.creditSales || 0) + (dailyTraditionalSales[0]?.creditSales || 0);

  // Get daily orders from both collections
  const saleOrderOrders = await SaleOrder.countDocuments({
    ...getShopMatch(req.shopId),
    status: { $ne: 'Cancelled' },
    date: { $gte: startDate, $lte: endDate }
  });
  
  const traditionalSaleOrders = await Sale.countDocuments({
    ...getShopMatch(req.shopId),
    status: { $ne: 'Cancelled' },
    date: { $gte: startDate, $lte: endDate }
  });
  
  const combinedOrders = saleOrderOrders + traditionalSaleOrders;

  // Get daily customers from both collections
  const saleOrderCustomers = await SaleOrder.aggregate([
    {
      $match: {
        ...getShopMatch(req.shopId),
        status: { $ne: 'Cancelled' },
        
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: "$customer"
      }
    }
  ]);
  
  const traditionalSaleCustomers = await Sale.aggregate([
    {
      $match: {
        ...getShopMatch(req.shopId),
        status: { $ne: 'Cancelled' },
        
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: "$customer"
      }
    }
  ]);
  
  // Combine unique customers
  const allCustomerIds = new Set();
  saleOrderCustomers.forEach(customer => allCustomerIds.add(customer._id.toString()));
  traditionalSaleCustomers.forEach(customer => allCustomerIds.add(customer._id.toString()));
  const combinedCustomerCount = allCustomerIds.size;

  res.status(200).json({
    success: true,
    data: {
      date: targetDate.toDateString(),
      totalSales: combinedTotalSales,
      totalOrders: combinedTotalOrders,
      totalCustomers: combinedCustomerCount,
      totalItems: combinedTotalItems,
      cashSales: combinedCashSales,
      creditSales: combinedCreditSales
    }
  });
});

// @desc    Get today's sales report
// @route   GET /api/reports/today-sales
// @access  Private

const getTodaySales = asyncHandler(async (req, res) => {
  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  const endOfDay = new Date(today.setHours(23, 59, 59, 999));

  // Get today's sales from SaleOrder
  const todaySaleOrders = await SaleOrder.aggregate([
    {
      $match: {
        ...getShopMatch(req.shopId),
        status: { $ne: 'Cancelled' },
        
        date: { $gte: startOfDay, $lte: endOfDay }
      }
    },
    {
      $group: {
        _id: null,
        totalSales: { $sum: "$total" },
        totalOrders: { $sum: 1 },
        totalItems: { $sum: { $size: "$items" } },
        cashSales: {
          $sum: {
            $cond: [{ $eq: ["$paymentMethod", "Cash"] }, "$total", 0]
          }
        },
        creditSales: {
          $sum: {
            $cond: [{ $eq: ["$paymentMethod", "Credit"] }, "$total", 0]
          }
        }
      }
    }
  ]);

  // Get today's sales from traditional Sale
  const todayTraditionalSales = await Sale.aggregate([
    {
      $match: {
        ...getShopMatch(req.shopId),
        status: { $ne: 'Cancelled' },
        
        date: { $gte: startOfDay, $lte: endOfDay }
      }
    },
    {
      $group: {
        _id: null,
        totalSales: { $sum: "$total" },
        totalOrders: { $sum: 1 },
        totalItems: { $sum: { $size: "$items" } },
        cashSales: {
          $sum: {
            $cond: [{ $eq: ["$paymentMethod", "Cash"] }, "$total", 0]
          }
        },
        creditSales: {
          $sum: {
            $cond: [{ $eq: ["$paymentMethod", "Credit"] }, "$total", 0]
          }
        }
      }
    }
  ]);

  // Combine the sales data
  const combinedTotalSales = (todaySaleOrders[0]?.totalSales || 0) + (todayTraditionalSales[0]?.totalSales || 0);
  const combinedTotalOrders = (todaySaleOrders[0]?.totalOrders || 0) + (todayTraditionalSales[0]?.totalOrders || 0);
  const combinedTotalItems = (todaySaleOrders[0]?.totalItems || 0) + (todayTraditionalSales[0]?.totalItems || 0);
  const combinedCashSales = (todaySaleOrders[0]?.cashSales || 0) + (todayTraditionalSales[0]?.cashSales || 0);
  const combinedCreditSales = (todaySaleOrders[0]?.creditSales || 0) + (todayTraditionalSales[0]?.creditSales || 0);

  // Get today's sales by company from both collections
  const todaySaleOrdersByCompany = await SaleOrder.aggregate([
    {
      $match: {
        ...getShopMatch(req.shopId),
        status: { $ne: 'Cancelled' },
        
        date: { $gte: startOfDay, $lte: endOfDay }
      }
    },
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
      $group: {
        _id: "$productInfo.supplier",
        totalSales: { $sum: { $multiply: ["$items.quantity", "$items.unitPrice"] } },
        totalQuantity: { $sum: "$items.quantity" },
        orderCount: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: "suppliers",
        localField: "_id",
        foreignField: "_id",
        as: "supplierDetails"
      }
    },
    {
      $unwind: { path: "$supplierDetails", preserveNullAndEmptyArrays: true }
    },
    {
      $project: {
        _id: 1,
        supplierName: { $ifNull: ["$supplierDetails.name", "Unknown"] },
        totalSales: 1,
        totalQuantity: 1,
        orderCount: 1
      }
    }
  ]);

  const todayTraditionalSalesByCompany = await Sale.aggregate([
    {
      $match: {
        ...getShopMatch(req.shopId),
        status: { $ne: 'Cancelled' },
        
        date: { $gte: startOfDay, $lte: endOfDay }
      }
    },
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
      $group: {
        _id: "$productInfo.supplier",
        totalSales: { $sum: { $multiply: ["$items.quantity", "$items.unitPrice"] } },
        totalQuantity: { $sum: "$items.quantity" },
        orderCount: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: "suppliers",
        localField: "_id",
        foreignField: "_id",
        as: "supplierDetails"
      }
    },
    {
      $unwind: { path: "$supplierDetails", preserveNullAndEmptyArrays: true }
    },
    {
      $project: {
        _id: 1,
        supplierName: { $ifNull: ["$supplierDetails.name", "Unknown"] },
        totalSales: 1,
        totalQuantity: 1,
        orderCount: 1
      }
    }
  ]);

  // Combine sales by company data
  const combinedSalesByCompany = [...todaySaleOrdersByCompany, ...todayTraditionalSalesByCompany];

  res.status(200).json({
    success: true,
    data: {
      totalSales: combinedTotalSales,
      totalOrders: combinedTotalOrders,
      totalItems: combinedTotalItems,
      cashSales: combinedCashSales,
      creditSales: combinedCreditSales,
      salesBySupplier: combinedSalesByCompany
    }
  });
});

// @desc    Get weekly sales report
// @route   GET /api/reports/weekly-sales
// @access  Private

const getWeeklySales = asyncHandler(async (req, res) => {
  const { weekStart } = req.query;

  const startDate = weekStart ? new Date(weekStart) : moment().startOf('week').toDate();
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6); // End of the week

  // Get weekly sales from SaleOrder
  const weeklySaleOrders = await SaleOrder.aggregate([
    {
      $match: {
        ...getShopMatch(req.shopId),
        status: { $ne: 'Cancelled' },
        
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
        totalSales: { $sum: "$total" },
        totalOrders: { $sum: 1 },
        totalItems: { $sum: { $size: "$items" } }
      }
    },
    { $sort: { "_id": 1 } }
  ]);

  // Get weekly sales from traditional Sale
  const weeklyTraditionalSales = await Sale.aggregate([
    {
      $match: {
        ...getShopMatch(req.shopId),
        status: { $ne: 'Cancelled' },
        
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
        totalSales: { $sum: "$total" },
        totalOrders: { $sum: 1 },
        totalItems: { $sum: { $size: "$items" } }
      }
    },
    { $sort: { "_id": 1 } }
  ]);

  // Combine weekly sales data
  const combinedWeeklySales = [...weeklySaleOrders, ...weeklyTraditionalSales];
  
  const summary = combinedWeeklySales.reduce((acc, curr) => {
    acc.totalSales += curr.totalSales;
    acc.totalOrders += curr.totalOrders;
    acc.totalItems += curr.totalItems;
    return acc;
  }, { totalSales: 0, totalOrders: 0, totalItems: 0 });

  // Get weekly sales by company from both collections
  const weeklySaleOrdersByCompany = await SaleOrder.aggregate([
    {
      $match: {
        ...getShopMatch(req.shopId),
        status: { $ne: 'Cancelled' },
        
        date: { $gte: startDate, $lte: endDate }
      }
    },
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
      $group: {
        _id: "$productInfo.supplier",
        totalSales: { $sum: { $multiply: ["$items.quantity", "$items.unitPrice"] } },
        totalQuantity: { $sum: "$items.quantity" },
        orderCount: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: "suppliers",
        localField: "_id",
        foreignField: "_id",
        as: "supplierDetails"
      }
    },
    {
      $unwind: { path: "$supplierDetails", preserveNullAndEmptyArrays: true }
    },
    {
      $project: {
        _id: 1,
        supplierName: { $ifNull: ["$supplierDetails.name", "Unknown"] },
        totalSales: 1,
        totalQuantity: 1,
        orderCount: 1
      }
    }
  ]);

  const weeklyTraditionalSalesByCompany = await Sale.aggregate([
    {
      $match: {
        ...getShopMatch(req.shopId),
        status: { $ne: 'Cancelled' },
        
        date: { $gte: startDate, $lte: endDate }
      }
    },
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
      $group: {
        _id: "$productInfo.supplier",
        totalSales: { $sum: { $multiply: ["$items.quantity", "$items.unitPrice"] } },
        totalQuantity: { $sum: "$items.quantity" },
        orderCount: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: "suppliers",
        localField: "_id",
        foreignField: "_id",
        as: "supplierDetails"
      }
    },
    {
      $unwind: { path: "$supplierDetails", preserveNullAndEmptyArrays: true }
    },
    {
      $project: {
        _id: 1,
        supplierName: { $ifNull: ["$supplierDetails.name", "Unknown"] },
        totalSales: 1,
        totalQuantity: 1,
        orderCount: 1
      }
    }
  ]);

  // Combine sales by company data
  const combinedWeeklySalesByCompany = [...weeklySaleOrdersByCompany, ...weeklyTraditionalSalesByCompany];

  res.status(200).json({
    success: true,
    data: {
      weekStartDate: startDate,
      weekEndDate: endDate,
      dailyBreakdown: combinedWeeklySales,
      summary,
      salesBySupplier: combinedWeeklySalesByCompany
    }
  });
});

// @desc    Get monthly sales report
// @route   GET /api/reports/monthly-sales
// @access  Private

const getMonthlySales = asyncHandler(async (req, res) => {
  const { month, year } = req.query;

  const targetMonth = month ? parseInt(month) : new Date().getMonth() + 1;
  const targetYear = year ? parseInt(year) : new Date().getFullYear();

  const startDate = new Date(targetYear, targetMonth - 1, 1);
  const endDate = new Date(targetYear, targetMonth, 0); // Last day of the month

  // Get monthly sales from SaleOrder
  const monthlySaleOrders = await SaleOrder.aggregate([
    {
      $match: {
        ...getShopMatch(req.shopId),
        status: { $ne: 'Cancelled' },
        
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: { $dayOfMonth: "$date" },
        totalSales: { $sum: "$total" },
        totalOrders: { $sum: 1 },
        totalItems: { $sum: { $size: "$items" } }
      }
    },
    { $sort: { "_id": 1 } }
  ]);

  // Get monthly sales from traditional Sale
  const monthlyTraditionalSales = await Sale.aggregate([
    {
      $match: {
        ...getShopMatch(req.shopId),
        status: { $ne: 'Cancelled' },
        
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: { $dayOfMonth: "$date" },
        totalSales: { $sum: "$total" },
        totalOrders: { $sum: 1 },
        totalItems: { $sum: { $size: "$items" } }
      }
    },
    { $sort: { "_id": 1 } }
  ]);

  // Combine monthly sales data
  const combinedMonthlySales = [...monthlySaleOrders, ...monthlyTraditionalSales];
  
  const summary = combinedMonthlySales.reduce((acc, curr) => {
    acc.totalSales += curr.totalSales;
    acc.totalOrders += curr.totalOrders;
    acc.totalItems += curr.totalItems;
    return acc;
  }, { totalSales: 0, totalOrders: 0, totalItems: 0 });

  // Get monthly sales by company from both collections
  const monthlySaleOrdersByCompany = await SaleOrder.aggregate([
    {
      $match: {
        ...getShopMatch(req.shopId),
        status: { $ne: 'Cancelled' },
        
        date: { $gte: startDate, $lte: endDate }
      }
    },
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
      $group: {
        _id: "$productInfo.supplier",
        totalSales: { $sum: { $multiply: ["$items.quantity", "$items.unitPrice"] } },
        totalQuantity: { $sum: "$items.quantity" },
        orderCount: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: "suppliers",
        localField: "_id",
        foreignField: "_id",
        as: "supplierDetails"
      }
    },
    {
      $unwind: { path: "$supplierDetails", preserveNullAndEmptyArrays: true }
    },
    {
      $project: {
        _id: 1,
        supplierName: { $ifNull: ["$supplierDetails.name", "Unknown"] },
        totalSales: 1,
        totalQuantity: 1,
        orderCount: 1
      }
    }
  ]);

  const monthlyTraditionalSalesByCompany = await Sale.aggregate([
    {
      $match: {
        ...getShopMatch(req.shopId),
        status: { $ne: 'Cancelled' },
        
        date: { $gte: startDate, $lte: endDate }
      }
    },
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
      $group: {
        _id: "$productInfo.supplier",
        totalSales: { $sum: { $multiply: ["$items.quantity", "$items.unitPrice"] } },
        totalQuantity: { $sum: "$items.quantity" },
        orderCount: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: "suppliers",
        localField: "_id",
        foreignField: "_id",
        as: "supplierDetails"
      }
    },
    {
      $unwind: { path: "$supplierDetails", preserveNullAndEmptyArrays: true }
    },
    {
      $project: {
        _id: 1,
        supplierName: { $ifNull: ["$supplierDetails.name", "Unknown"] },
        totalSales: 1,
        totalQuantity: 1,
        orderCount: 1
      }
    }
  ]);

  // Combine sales by company data
  const combinedMonthlySalesByCompany = [...monthlySaleOrdersByCompany, ...monthlyTraditionalSalesByCompany];

  res.status(200).json({
    success: true,
    data: {
      month: targetMonth,
      year: targetYear,
      dailyBreakdown: combinedMonthlySales,
      summary,
      salesBySupplier: combinedMonthlySalesByCompany
    }
  });
});



// @desc    Get customer due report
// @route   GET /api/reports/customer-dues
// @access  Private

const getSalesTopSheet = asyncHandler(async (req, res) => {
  const { startDate, endDate, limit = 50 } = req.query;
  
  let matchCondition = { ...getShopMatch(req.shopId) };

  if (startDate || endDate) {
    matchCondition.date = {};
    if (startDate) {
      matchCondition.date.$gte = new Date(startDate);
    }
    if (endDate) {
      matchCondition.date.$lte = new Date(endDate);
    }
  }

  const pipeline = (statusFilter) => [
    { $match: { ...matchCondition, ...statusFilter } },
    { $unwind: '$items' },
    {
      $group: {
        _id: {
          product: '$items.product',
          productName: '$items.name',
          customer: '$customer'
        },
        totalQuantity: { $sum: '$items.quantity' },
        totalValue: { $sum: { $multiply: ['$items.quantity', '$items.unitPrice'] } },
        avgRate: { $avg: '$items.unitPrice' },
        salesCount: { $sum: 1 }
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
        from: 'customers',
        localField: '_id.customer',
        foreignField: '_id',
        as: 'customerInfo'
      }
    },
    {
      $project: {
        productName: { $arrayElemAt: ['$productInfo.name', 0] },
        customerName: { $arrayElemAt: ['$customerInfo.contactName', 0] },
        totalQuantity: 1,
        totalValue: 1,
        avgRate: { $round: ['$avgRate', 2] },
        salesCount: 1
      }
    }
  ];

  const orderSales = await SaleOrder.aggregate(pipeline({ status: { $in: ['Approved', 'Delivered'] } }));
  const traditionalSales = await Sale.aggregate(pipeline({ status: { $ne: 'Cancelled' } }));

  const combinedMap = new Map();
  [...orderSales, ...traditionalSales].forEach(item => {
    const key = `${item._id?.product}_${item._id?.customer}`;
    if (!combinedMap.has(key)) {
      combinedMap.set(key, { ...item });
    } else {
      const existing = combinedMap.get(key);
      existing.totalQuantity += item.totalQuantity || 0;
      existing.totalValue += item.totalValue || 0;
      existing.salesCount += item.salesCount || 0;
      existing.avgRate = existing.totalQuantity > 0 ? Number((existing.totalValue / existing.totalQuantity).toFixed(2)) : 0;
    }
  });

  const rankedSales = Array.from(combinedMap.values())
    .sort((a, b) => b.totalValue - a.totalValue)
    .slice(0, parseInt(limit))
    .map((sale, index) => ({
      ...sale,
      rank: index + 1
    }));

  res.status(200).json({
    success: true,
    count: rankedSales.length,
    data: rankedSales
  });
});

// @desc    Get Product Wise Top Chart
// @route   GET /api/reports/product-wise-top-chart
// @access  Private

const getProductWiseTopChart = asyncHandler(async (req, res) => {
  const { startDate, endDate, type = 'quantity', limit = 20 } = req.query;
  
  let matchCondition = { status: { $in: ['Approved', 'Delivered'] } };
  
  // Use shopId from query OR from shop context middleware
  const shopId = req.query.shopId || req.shopId;
  if (shopId && mongoose.Types.ObjectId.isValid(shopId)) {
    matchCondition.shop = new mongoose.Types.ObjectId(shopId);
  } else if (shopId) {
    matchCondition.shop = shopId;
  }

  if (startDate || endDate) {
    matchCondition.date = {};
    if (startDate) {
      matchCondition.date.$gte = new Date(startDate);
    }
    if (endDate) {
      matchCondition.date.$lte = new Date(endDate);
    }
  }

  // Sort field based on type
  let sortField = type === 'revenue' ? { totalValue: -1 } : 
                  type === 'profit' ? { totalProfit: -1 } : 
                  { totalQuantity: -1 };

  const topProducts = await SaleOrder.aggregate([
    { $match: matchCondition },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.product',
        productName: { $first: '$items.name' },
        totalQuantity: { $sum: '$items.quantity' },
        totalValue: { $sum: { $multiply: ['$items.quantity', '$items.unitPrice'] } }, // Fixed: use unitPrice instead of rate
        avgRate: { $avg: '$items.unitPrice' }, // Fixed: use unitPrice instead of rate
        salesCount: { $sum: 1 },
        // Simple profit calculation (30% margin assumption)
        totalProfit: { $sum: { $multiply: ['$items.quantity', { $subtract: ['$items.unitPrice', { $multiply: ['$items.unitPrice', 0.7] }] }] } }
      }
    },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'productInfo'
      }
    },
    {
      $project: {
        productName: { $ifNull: ['$productName', { $arrayElemAt: ['$productInfo.name', 0] }] }, // Fallback to product name
        totalQuantity: 1,
        totalValue: 1,
        avgRate: { $round: ['$avgRate', 2] },
        salesCount: 1,
        totalProfit: { $round: ['$totalProfit', 2] },
        category: { $arrayElemAt: ['$productInfo.category', 0] }
      }
    },
    { $sort: sortField },
    { $limit: parseInt(limit) }
  ]);

  // Add rank
  const rankedProducts = topProducts.map((product, index) => ({
    ...product,
    rank: index + 1
  }));

  res.status(200).json({
    success: true,
    count: rankedProducts.length,
    data: rankedProducts
  });
});

// @desc    Get Delivery Wise Top Chart
// @route   GET /api/reports/delivery-wise-top-chart
// @access  Private

const getDeliveryWiseTopChart = asyncHandler(async (req, res) => {
  const { startDate, endDate, limit = 20 } = req.query;
  
  let matchCondition = { status: { $in: ['Approved', 'Delivered'] } };
  
  // Use shopId from query OR from shop context middleware
  const shopId = req.query.shopId || req.shopId;
  if (shopId) {
    matchCondition.shop = shopId;
  }

  if (startDate || endDate) {
    matchCondition.date = {};
    if (startDate) {
      matchCondition.date.$gte = new Date(startDate);
    }
    if (endDate) {
      matchCondition.date.$lte = new Date(endDate);
    }
  }

  const topDeliveries = await SaleOrder.aggregate([
    { $match: matchCondition },
    {
      $group: {
        _id: '$deliveredBy', // Fixed: use deliveredBy instead of deliveryPerson
        deliveryPersonName: { $first: '$deliveredByName' }, // Fixed: use deliveredByName
        totalOrders: { $sum: 1 },
        totalValue: { $sum: '$total' },
        totalItems: { $sum: { $size: '$items' } },
        avgOrderValue: { $avg: '$total' }
      }
    },
    { $match: { _id: { $ne: null }, deliveryPersonName: { $ne: null, $ne: '' } } },
    { $sort: { totalValue: -1 } },
    { $limit: parseInt(limit) }
  ]);

  // Add rank
  const rankedDeliveries = topDeliveries.map((delivery, index) => ({
    ...delivery,
    rank: index + 1
  }));

  res.status(200).json({
    success: true,
    count: rankedDeliveries.length,
    data: rankedDeliveries
  });
});

// @desc    Get Route Wise Top Chart
// @route   GET /api/reports/route-wise-top-chart
// @access  Private

const getRouteWiseTopChart = asyncHandler(async (req, res) => {
  const { startDate, endDate, limit = 20 } = req.query;
  
  let matchCondition = { status: { $in: ['Approved', 'Delivered'] } };
  
  // Use shopId from query OR from shop context middleware
  const shopId = req.query.shopId || req.shopId;
  if (shopId) {
    matchCondition.shop = shopId;
  }

  if (startDate || endDate) {
    matchCondition.date = {};
    if (startDate) {
      matchCondition.date.$gte = new Date(startDate);
    }
    if (endDate) {
      matchCondition.date.$lte = new Date(endDate);
    }
  }

  const topRoutes = await SaleOrder.aggregate([
    { $match: matchCondition },
    {
      $group: {
        _id: '$route',
        routeName: { $first: '$routeName' },
        totalOrders: { $sum: 1 },
        totalValue: { $sum: '$total' },
        totalItems: { $sum: { $size: '$items' } },
        avgOrderValue: { $avg: '$total' },
        uniqueCustomers: { $addToSet: '$customer' }
      }
    },
    { $match: { _id: { $ne: null }, routeName: { $ne: null, $ne: '' } } },
    {
      $project: {
        routeName: 1,
        totalOrders: 1,
        totalValue: 1,
        totalItems: 1,
        avgOrderValue: { $round: ['$avgOrderValue', 2] },
        customerCount: { $size: '$uniqueCustomers' }
      }
    },
    { $sort: { totalValue: -1 } },
    { $limit: parseInt(limit) }
  ]);

  // Add rank
  const rankedRoutes = topRoutes.map((route, index) => ({
    ...route,
    rank: index + 1
  }));

  res.status(200).json({
    success: true,
    count: rankedRoutes.length,
    data: rankedRoutes
  });
});

// @desc    Get Purchase Commission Report
// @route   GET /api/reports/purchase-commission
// @access  Private

const getSalesDueReport = asyncHandler(async (req, res) => {
  const { customerId, startDate, endDate, minDue } = req.query;
  
  let matchCondition = { 
    type: 'wholesale',
    dueAmount: { $gt: 0 } // Only show orders with outstanding dues
  };
  
  // Use shopId from query OR from shop context middleware
  const shopId = req.query.shopId || req.shopId;
  if (shopId && mongoose.Types.ObjectId.isValid(shopId)) {
    matchCondition.shop = new mongoose.Types.ObjectId(shopId);
  } else if (shopId) {
    matchCondition.shop = shopId;
  }

  // Filter by customer if provided
  if (customerId && mongoose.Types.ObjectId.isValid(customerId)) {
    matchCondition.customer = new mongoose.Types.ObjectId(customerId);
  } else if (customerId) {
    matchCondition.customer = customerId;
  }

  // Build date filter
  if (startDate || endDate) {
    matchCondition.date = {};
    if (startDate) {
      matchCondition.date.$gte = new Date(startDate);
    }
    if (endDate) {
      matchCondition.date.$lte = new Date(endDate);
    }
  }

  // Minimum due amount filter
  if (minDue) {
    matchCondition.dueAmount.$gte = parseFloat(minDue);
  }

  // Aggregate SaleOrders (wholesale/online)
  const wholesaleMatch = { ...matchCondition, type: { $in: ['wholesale', 'online'] } };
  const wholesaleDueData = await SaleOrder.aggregate([
    { $match: wholesaleMatch },
    {
      $lookup: {
        from: 'customers',
        localField: 'customer',
        foreignField: '_id',
        as: 'customerInfo'
      }
    },
    { $unwind: '$customerInfo' },
    {
      $project: {
        orderNumber: 1,
        invoiceNumber: 1,
        date: 1,
        customer: {
          _id: '$customerInfo._id',
          name: '$customerInfo.contactName',
          contact: '$customerInfo.contactNumber',
          address: '$customerInfo.address'
        },
        items: 1,
        subTotal: 1,
        discount: 1,
        tax: 1,
        total: 1,
        paidAmount: 1,
        dueAmount: 1,
        status: 1,
        paymentMethod: 1,
        type: 1,
        daysOverdue: {
          $floor: {
            $divide: [
              { $subtract: [new Date(), '$date'] },
              1000 * 60 * 60 * 24 // Convert milliseconds to days
            ]
          }
        }
      }
    }
  ]);

  // Aggregate Sales (retail)
  const retailDueData = await Sale.aggregate([
    { $match: matchCondition },
    {
      $lookup: {
        from: 'customers',
        localField: 'customer',
        foreignField: '_id',
        as: 'customerInfo'
      }
    },
    { $unwind: '$customerInfo' },
    {
      $project: {
        invoiceNumber: 1,
        date: 1,
        customer: {
          _id: '$customerInfo._id',
          name: '$customerInfo.contactName',
          contact: '$customerInfo.contactNumber',
          address: '$customerInfo.address'
        },
        items: 1,
        subTotal: 1,
        discount: 1,
        tax: 1,
        total: 1,
        paidAmount: 1,
        dueAmount: 1,
        status: 1,
        paymentMethod: 1,
        type: { $literal: 'retail' },
        daysOverdue: {
          $floor: {
            $divide: [
              { $subtract: [new Date(), '$date'] },
              1000 * 60 * 60 * 24 // Convert milliseconds to days
            ]
          }
        }
      }
    }
  ]);

  const salesDueData = [...wholesaleDueData, ...retailDueData].sort((a, b) => b.dueAmount - a.dueAmount || b.date - a.date);

  // Populate items.product to get product name & category
  await Sale.populate(salesDueData, [
    { path: 'items.product', select: 'name category', populate: { path: 'category', select: 'name' } }
  ]);

  // Calculate summary
  const summary = {
    totalDues: 0,
    totalOrders: salesDueData.length,
    averageDue: 0,
    agingAnalysis: {
      current: 0,      // 0-30 days
      days30_60: 0,    // 31-60 days
      days60_90: 0,    // 61-90 days
      above90: 0       // Above 90 days
    }
  };

  salesDueData.forEach(order => {
    summary.totalDues += order.dueAmount;
    
    // Aging analysis based on days overdue
    const days = order.daysOverdue || 0;
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
    count: salesDueData.length,
    data: salesDueData,
    summary
  });
});

// @desc    Get Sales Return Report
// @route   GET /api/reports/sales-return-report
// @access  Private

const getSalesReturnReport = asyncHandler(async (req, res) => {
  const { startDate, endDate, customerId, productId, returnReason } = req.query;
  
  // Match SaleOrders that have returnedItems (returnedItems lives on SaleOrder, NOT Sale)
  let matchCondition = { 
    returnedItems: { $exists: true, $not: { $size: 0 } }
  };
  
  // Use shopId from auth middleware (x-shop-id header is parsed by auth middleware into req.shopId)
  if (req.shopId && mongoose.Types.ObjectId.isValid(req.shopId)) {
    matchCondition.shop = new mongoose.Types.ObjectId(req.shopId);
  } else if (req.shopId) {
    matchCondition.shop = req.shopId;
  }

  // Filter by customer if provided
  if (customerId && mongoose.Types.ObjectId.isValid(customerId)) {
    matchCondition.customer = new mongoose.Types.ObjectId(customerId);
  } else if (customerId) {
    matchCondition.customer = customerId;
  }

  // Build date filter (use createdAt as fallback if date is missing)
  if (startDate || endDate) {
    matchCondition.date = {};
    if (startDate) {
      matchCondition.date.$gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      matchCondition.date.$lte = end;
    }
  }

  // Query SaleOrder (not Sale) because returnedItems is defined on SaleOrder schema
  const pipeline = [
    { $match: matchCondition },
    {
      $lookup: {
        from: 'customers',
        localField: 'customer',
        foreignField: '_id',
        as: 'customerInfo'
      }
    },
    { $unwind: { path: '$customerInfo', preserveNullAndEmptyArrays: true } },
    { $unwind: '$returnedItems' },
    {
      $lookup: {
        from: 'products',
        localField: 'returnedItems.product',
        foreignField: '_id',
        as: 'productInfo'
      }
    },
    { $unwind: { path: '$productInfo', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        orderNumber: 1,
        invoiceNumber: 1,
        date: 1,
        returnDate: { $ifNull: ['$returnedItems.returnDate', '$date'] },
        returnReason: { $ifNull: ['$returnedItems.note', 'Sales Return'] },
        customer: {
          _id: { $ifNull: ['$customerInfo._id', null] },
          name: { $ifNull: ['$customerInfo.contactName', 'Unknown Customer'] },
          contact: { $ifNull: ['$customerInfo.contactNumber', ''] }
        },
        product: {
          _id: { $ifNull: ['$productInfo._id', null] },
          name: { $ifNull: ['$productInfo.name', 'Unknown Product'] },
          sku: { $ifNull: ['$productInfo.sku', ''] }
        },
        quantity: '$returnedItems.quantity',
        unitPrice: '$returnedItems.unitPrice',
        totalValue: {
          $multiply: ['$returnedItems.quantity', { $ifNull: ['$returnedItems.unitPrice', 0] }]
        },
        status: 1,
        note: '$returnedItems.note'
      }
    }
  ];

  // Add post-projection filters for productId and returnReason
  const postMatch = {};
  if (productId && mongoose.Types.ObjectId.isValid(productId)) {
    postMatch['product._id'] = new mongoose.Types.ObjectId(productId);
  }
  if (returnReason) {
    postMatch['returnReason'] = { $regex: returnReason, $options: 'i' };
  }

  if (Object.keys(postMatch).length > 0) {
    pipeline.push({ $match: postMatch });
  }

  pipeline.push({ $sort: { date: -1 } });

  // *** KEY FIX: use Sale (not SaleOrder) – returns are logged against Sale collection ***
  const salesReturns = await Sale.aggregate(pipeline);

  // Calculate summary
  const summary = {
    totalReturns: 0,
    totalQuantity: 0,
    totalValue: 0,
    returnCount: salesReturns.length,
    byReason: {}
  };

  salesReturns.forEach(ret => {
    summary.totalReturns += ret.totalValue;
    summary.totalValue += ret.totalValue;
    summary.totalQuantity += ret.quantity;
    
    // Group by reason
    const reason = ret.returnReason || 'Not Specified';
    if (summary.byReason[reason]) {
      summary.byReason[reason].count++;
      summary.byReason[reason].value += ret.totalValue;
    } else {
      summary.byReason[reason] = {
        count: 1,
        value: ret.totalValue
      };
    }
  });

  res.status(200).json({
    success: true,
    count: salesReturns.length,
    data: salesReturns,
    summary
  });
});

const exportSalesReportExcel = asyncHandler(async (req, res) => {
  const { reportType, startDate, endDate, supplierId, srId } = req.query;

  let reportData = [];

  // Get data based on report type
  if (reportType === "supplier") {
    // Get company-wise sales report
    let matchCondition = { status: { $in: ['Approved', 'Delivered'] } };
    
    // Add shop context
    if (req.shopId) {
      matchCondition.shop = req.shopId;
    }
    
    if (startDate || endDate) {
      matchCondition.date = {};
      if (startDate) matchCondition.date.$gte = new Date(startDate);
      if (endDate) matchCondition.date.$lte = new Date(endDate);
    }
    
    if (supplierId) {
      matchCondition.supplier = mongoose.Types.ObjectId(supplierId);
    }
    
    reportData = await SaleOrder.aggregate([
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
        $group: {
          _id: "$productInfo.supplier",
          totalSales: { $sum: { $multiply: ["$items.quantity", "$items.unitPrice"] } },
          totalQuantity: { $sum: "$items.quantity" },
          orderCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: "suppliers",
          localField: "_id",
          foreignField: "_id",
          as: "supplierDetails"
        }
      },
      {
        $unwind: { path: "$supplierDetails", preserveNullAndEmptyArrays: true }
      },
      {
        $project: {
          _id: 1,
          supplierName: { $ifNull: ["$supplierDetails.name", "Unknown"] },
          totalSales: 1,
          totalQuantity: 1,
          orderCount: 1
        }
      }
    ]);
  } else if (reportType === 'sr') {
    // Get SR-wise sales report
    let matchCondition = { status: { $in: ['Approved', 'Delivered'] } };
    
    // Add shop context
    if (req.shopId) {
      matchCondition.shop = req.shopId;
    }
    
    if (startDate || endDate) {
      matchCondition.date = {};
      if (startDate) matchCondition.date.$gte = new Date(startDate);
      if (endDate) matchCondition.date.$lte = new Date(endDate);
    }
    
    if (srId) {
      matchCondition.assignedSR = mongoose.Types.ObjectId(srId);
    }
    
    reportData = await SaleOrder.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: "$assignedSR",
          totalSales: { $sum: "$total" },
          totalOrders: { $sum: 1 },
          deliveredOrders: { $sum: { $cond: [{ $eq: ["$status", "Delivered"] }, 1, 0] } },
          totalCommission: { $sum: "$commissionAmount" }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "srDetails"
        }
      },
      {
        $unwind: { path: "$srDetails", preserveNullAndEmptyArrays: true }
      },
      {
        $project: {
          _id: 1,
          srName: { $ifNull: ["$srDetails.name", "Unknown"] },
          totalSales: 1,
          totalOrders: 1,
          deliveredOrders: 1,
          totalCommission: 1
        }
      }
    ]);
  } else if (reportType === 'wholesale') {
    // Get wholesale sales report (both Sales and SaleOrders)
    let matchCondition = { type: 'wholesale' };
    
    // Add shop context
    if (req.shopId) {
      matchCondition.shop = req.shopId;
    }
    
    if (startDate || endDate) {
      matchCondition.date = {};
      if (startDate) matchCondition.date.$gte = new Date(startDate);
      if (endDate) matchCondition.date.$lte = new Date(endDate);
    }
    
    const [sales, saleOrders] = await Promise.all([
      Sale.find(matchCondition)
        .populate('customer', 'contactName contactNumber phone')
        .populate('assignedSR', 'name')
        .populate('createdBy', 'name')
        .lean(),
      SaleOrder.find(matchCondition)
        .populate('customer', 'contactName contactNumber phone')
        .populate('assignedSR', 'name')
        .populate('approvedBy', 'name')
        .lean()
    ]);
    
    const salesData = sales.map(sale => ({
      ...sale,
      sourceType: 'sale'
    }));
    
    const ordersData = saleOrders.map(order => ({
      ...order,
      sourceType: 'order',
      invoiceNumber: order.invoiceNumber || order.orderNumber,
      status: order.status === 'Delivered' ? 'Completed' : `Order ${order.approvalStatus}`
    }));
    
    const combinedData = [...salesData, ...ordersData].sort((a, b) => 
      new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)
    );
    
    reportData = combinedData.map(item => ({
      invoiceNumber: item.invoiceNumber || 'N/A',
      customerName: item.customer?.contactName || 'N/A',
      customerContact: item.customer?.contactNumber || item.customer?.phone || 'N/A',
      srName: item.assignedSR?.name || 'N/A',
      formattedDate: new Date(item.date || item.createdAt).toLocaleDateString(),
      total: item.total || 0,
      paidAmount: item.paidAmount || 0,
      dueAmount: item.dueAmount || 0,
      status: item.status || 'Pending'
    }));
  } else if (reportType === 'product-wise') {
    // Get product-wise sales report
    let matchCondition = { status: { $in: ['Approved', 'Delivered', 'Completed', 'Pending', 'Partial'] } };
    if (req.shopId) {
      matchCondition.shop = req.shopId;
    }
    if (startDate || endDate) {
      matchCondition.date = {};
      if (startDate) matchCondition.date.$gte = new Date(startDate);
      if (endDate) matchCondition.date.$lte = new Date(endDate);
    }
    const getPipeline = (match) => [
      { $match: match },
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
        $lookup: {
          from: "brands",
          localField: "productInfo.brand",
          foreignField: "_id",
          as: "brandInfo"
        }
      },
      { $unwind: { path: "$brandInfo", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: "$items.product",
          productName: { $first: "$productInfo.name" },
          sku: { $first: "$productInfo.sku" },
          model: { $first: "$productInfo.model" },
          category: { $first: { $ifNull: ["$categoryInfo.name", "Uncategorized"] } },
          brand: { $first: { $ifNull: ["$brandInfo.name", "N/A"] } },
          totalQuantity: { $sum: "$items.quantity" },
          totalValue: { $sum: { $multiply: ["$items.quantity", "$items.unitPrice"] } },
          totalCost: { $sum: { $ifNull: ["$items.purchaseCost", 0] } },
          allBatches: { $push: "$items.batchesUsed" },
          salesCount: { $sum: 1 }
        }
      }
    ];

    const orderData = await SaleOrder.aggregate(getPipeline({ ...matchCondition, type: 'wholesale', status: { $in: ['Approved', 'Delivered'] } }));
    const saleData = await Sale.aggregate(getPipeline({ ...matchCondition, status: { $in: ['Completed', 'Pending', 'Partial'] } }));
    
    const combinedMap = new Map();
    [...orderData, ...saleData].forEach(item => {
      const id = item._id.toString();
      
      let consolidatedBatches = {};
      if (item.allBatches && Array.isArray(item.allBatches)) {
        item.allBatches.forEach(batchArray => {
          if (batchArray && Array.isArray(batchArray)) {
            batchArray.forEach(b => {
              if (b && b.batch) {
                const batchId = b.batch.toString();
                if (consolidatedBatches[batchId]) {
                  consolidatedBatches[batchId].quantity += b.quantity;
                } else {
                  consolidatedBatches[batchId] = { ...b };
                }
              }
            });
          }
        });
      }

      if (combinedMap.has(id)) {
        const existing = combinedMap.get(id);
        existing.totalQuantity += item.totalQuantity;
        existing.totalValue += item.totalValue;
        existing.totalCost += item.totalCost;
        existing.salesCount += item.salesCount;
        
        Object.values(consolidatedBatches).forEach(b => {
          const batchId = b.batch.toString();
          const exBatchIndex = existing.batchesUsed.findIndex(exB => exB.batch.toString() === batchId);
          if (exBatchIndex > -1) {
            existing.batchesUsed[exBatchIndex].quantity += b.quantity;
          } else {
            existing.batchesUsed.push(b);
          }
        });
      } else {
        combinedMap.set(id, { 
          ...item,
          batchesUsed: Object.values(consolidatedBatches)
        });
      }
    });

    // Fetch batch numbers for Excel export
    const StockBatch = mongoose.model('StockBatch');
    const allBatchIds = new Set();
    Array.from(combinedMap.values()).forEach(product => {
      if (product.batchesUsed) {
        product.batchesUsed.forEach(b => {
          if (b.batch) allBatchIds.add(b.batch.toString());
        });
      }
    });

    const batchesData = await StockBatch.find({ _id: { $in: Array.from(allBatchIds) } }, 'batchNumber').lean();
    const batchMap = {};
    batchesData.forEach(b => {
      batchMap[b._id.toString()] = b.batchNumber;
    });

    reportData = Array.from(combinedMap.values()).map((item, index) => {
      const profit = item.totalValue - item.totalCost;
      const batchesString = (item.batchesUsed || []).map(b => {
        const bNo = batchMap[b.batch.toString()] || 'Unknown';
        return `${bNo} (Qty: ${b.quantity}, Rate: ৳${b.purchasePrice})`;
      }).join(' | ');

      return {
        rank: index + 1,
        productName: item.productName || 'Unknown',
        sku: item.sku || 'N/A',
        model: item.model || 'N/A',
        category: item.category,
        brand: item.brand,
        salesCount: item.salesCount,
        totalQuantity: item.totalQuantity,
        avgRate: item.totalQuantity > 0 ? (item.totalValue / item.totalQuantity).toFixed(2) : '0.00',
        totalValue: item.totalValue.toFixed(2),
        totalCost: item.totalCost.toFixed(2),
        profit: profit.toFixed(2),
        batchesInfo: batchesString
      };
    }).sort((a, b) => parseFloat(b.totalValue) - parseFloat(a.totalValue));;
  } else {
    // Default to general sales report
    let matchCondition = { status: { $in: ['Approved', 'Delivered'] } };
    
    // Add shop context
    if (req.shopId) {
      matchCondition.shop = req.shopId;
    }
    
    if (startDate || endDate) {
      matchCondition.date = {};
      if (startDate) matchCondition.date.$gte = new Date(startDate);
      if (endDate) matchCondition.date.$lte = new Date(endDate);
    }
    
    reportData = await SaleOrder.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          totalSales: { $sum: "$total" },
          totalOrders: { $sum: 1 },
          totalItems: { $sum: { $size: "$items" } }
        }
      },
      { $sort: { "_id": 1 } }
    ]);
  }

  // Create workbook and worksheet
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Sales Report');

  // Define headers based on report type
  if (reportType === "supplier") {
    worksheet.columns = [
      { header: 'Company ID', key: '_id', width: 20 },
      { header: 'Company Name', key: 'supplierName', width: 25 },
      { header: 'Total Sales', key: 'totalSales', width: 15 },
      { header: 'Total Quantity', key: 'totalQuantity', width: 15 },
      { header: 'Order Count', key: 'orderCount', width: 15 }
    ];
  } else if (reportType === 'sr') {
    worksheet.columns = [
      { header: 'SR ID', key: '_id', width: 20 },
      { header: 'SR Name', key: 'srName', width: 25 },
      { header: 'Total Sales', key: 'totalSales', width: 15 },
      { header: 'Total Orders', key: 'totalOrders', width: 15 },
      { header: 'Delivered Orders', key: 'deliveredOrders', width: 15 },
      { header: 'Total Commission', key: 'totalCommission', width: 15 }
    ];
  } else if (reportType === 'wholesale') {
    worksheet.columns = [
      { header: 'Invoice Number', key: 'invoiceNumber', width: 25 },
      { header: 'Customer Name', key: 'customerName', width: 25 },
      { header: 'Customer Contact', key: 'customerContact', width: 20 },
      { header: 'Assigned SR', key: 'srName', width: 20 },
      { header: 'Date', key: 'formattedDate', width: 15 },
      { header: 'Total (৳)', key: 'total', width: 15 },
      { header: 'Paid (৳)', key: 'paidAmount', width: 15 },
      { header: 'Due (৳)', key: 'dueAmount', width: 15 },
      { header: 'Status', key: 'status', width: 15 }
    ];
  } else if (reportType === 'product-wise') {
    worksheet.columns = [
      { header: 'Product Name', key: 'productName', width: 35 },
      { header: 'SKU', key: 'sku', width: 20 },
      { header: 'Model', key: 'model', width: 20 },
      { header: 'Category', key: 'category', width: 25 },
      { header: 'Brand', key: 'brand', width: 25 },
      { header: 'Times Sold', key: 'salesCount', width: 15 },
      { header: 'Total Quantity', key: 'totalQuantity', width: 15 },
      { header: 'Total Revenue (৳)', key: 'totalValue', width: 20 },
      { header: 'Average Rate (৳)', key: 'avgRate', width: 20 }
    ];
  } else {
    worksheet.columns = [
      { header: 'Date', key: '_id', width: 15 },
      { header: 'Total Sales', key: 'totalSales', width: 15 },
      { header: 'Total Orders', key: 'totalOrders', width: 15 },
      { header: 'Total Items', key: 'totalItems', width: 15 }
    ];
  }

  // Add data rows
  reportData.forEach(row => {
    worksheet.addRow(row);
  });

  // Style headers
  worksheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  // Auto-fit columns
  worksheet.columns.forEach(column => {
    column.width = column.header.length > 10 ? column.header.length : 15;
  });

  // Set response headers
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=sales-report-${reportType}-${new Date().toISOString().slice(0, 10)}.xlsx`
  );

  // Write workbook to response
  await workbook.xlsx.write(res);
  res.end();
});


// @desc    Get supplier ledger report
// @route   GET /api/reports/supplier-ledger
// @access  Private

module.exports = {
  getSalesAnalytics,
  getProductWiseSales,
  getSupplierWiseSales,
  getDailySales,
  getTodaySales,
  getWeeklySales,
  getMonthlySales,
  getSalesTopSheet,
  getProductWiseTopChart,
  getDeliveryWiseTopChart,
  getRouteWiseTopChart,
  getSalesDueReport,
  getSalesReturnReport,
  exportSalesReportExcel,
  getSupplierWiseSales
};
