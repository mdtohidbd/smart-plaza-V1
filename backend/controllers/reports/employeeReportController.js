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

const getSrWiseSales = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  console.log('=== SR SALES REPORT DEBUG ===');
  console.log('Query params:', { startDate, endDate });
  console.log('Shop ID:', req.shopId);

  let matchCondition = { status: { $in: ['Approved', 'Delivered'] } };

  if (req.shopId && mongoose.Types.ObjectId.isValid(req.shopId)) {
    matchCondition.shop = new mongoose.Types.ObjectId(req.shopId);
  } else if (req.shopId) {
    matchCondition.shop = req.shopId;
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

  console.log('Match condition:', JSON.stringify(matchCondition, null, 2));

  // Get SR sales from SaleOrder collection
  const srSaleOrders = await SaleOrder.aggregate([
    { $match: matchCondition },
    {
      $group: {
        _id: "$assignedSR",
        totalSales: { $sum: "$total" },
        totalOrders: { $sum: 1 },
        deliveredOrders: { $sum: { $cond: [{ $eq: ["$status", "Delivered"] }, 1, 0] } },
        pendingOrders: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } },
        approvedOrders: { $sum: { $cond: [{ $eq: ["$status", "Approved"] }, 1, 0] } },
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
        srName: { $ifNull: ["$srDetails.name", { $concat: ["SR_", { $toString: "$_id" }] }] },
        srEmail: { $ifNull: ["$srDetails.email", ""] },
        srPhone: { $ifNull: ["$srDetails.phone", ""] },
        totalSales: 1,
        totalOrders: 1,
        deliveredOrders: 1,
        pendingOrders: 1,
        approvedOrders: 1,
        totalCommission: 1
      }
    }
  ]);

  // Get SR sales from traditional Sale collection (status: 'Completed')
  let matchConditionSale = { status: 'Completed' };

  if (req.shopId) {
    matchConditionSale.shop = req.shopId;
  }
  if (startDate || endDate) {
    matchConditionSale.date = {};
    if (startDate) {
      matchConditionSale.date.$gte = new Date(startDate);
    }
    if (endDate) {
      matchConditionSale.date.$lte = new Date(endDate);
    }
  }

  const srTraditionalSales = await Sale.aggregate([
    { $match: matchConditionSale },
    {
      $group: {
        _id: "$assignedSR",
        totalSales: { $sum: "$total" },
        totalOrders: { $sum: 1 },
        totalCommission: { $sum: 0 } // Traditional sales don't have commission field
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
        srEmail: { $ifNull: ["$srDetails.email", ""] },
        srPhone: { $ifNull: ["$srDetails.phone", ""] },
        totalSales: 1,
        totalOrders: 1,
        deliveredOrders: { $literal: 0 }, // Not applicable for traditional sales
        pendingOrders: { $literal: 0 },
        approvedOrders: { $literal: 0 },
        totalCommission: { $literal: 0 } // Traditional sales don't have commission
      }
    }
  ]);

  // Combine the results from both collections
  const combinedSrSales = [];

  console.log('SR SaleOrders count:', srSaleOrders.length);
  console.log('SR Traditional Sales count:', srTraditionalSales.length);

  // Process SaleOrder results - skip entries with null assignedSR
  srSaleOrders.forEach(saleOrder => {
    // Skip if no SR assigned
    if (!saleOrder._id) return;
    
    const existingSr = combinedSrSales.find(sr => sr._id && saleOrder._id && sr._id.toString() === saleOrder._id.toString());
    if (existingSr) {
      // Combine data if SR exists in both collections
      existingSr.totalSales += saleOrder.totalSales;
      existingSr.totalOrders += saleOrder.totalOrders;
      existingSr.deliveredOrders += saleOrder.deliveredOrders;
      existingSr.pendingOrders += saleOrder.pendingOrders;
      existingSr.approvedOrders += saleOrder.approvedOrders;
      existingSr.totalCommission += saleOrder.totalCommission;
    } else {
      combinedSrSales.push({ ...saleOrder });
    }
  });

  // Process traditional Sale results - skip entries with null assignedSR
  srTraditionalSales.forEach(traditionalSale => {
    // Skip if no SR assigned
    if (!traditionalSale._id) return;
    
    const existingSr = combinedSrSales.find(sr => sr._id && traditionalSale._id && sr._id.toString() === traditionalSale._id.toString());
    if (existingSr) {
      // Combine data if SR exists in both collections
      existingSr.totalSales += traditionalSale.totalSales;
      existingSr.totalOrders += traditionalSale.totalOrders;
      // Don't update status fields as they're not applicable for traditional sales
      existingSr.totalCommission += traditionalSale.totalCommission;
    } else {
      combinedSrSales.push({ ...traditionalSale });
    }
  });

  console.log('Combined SR sales count:', combinedSrSales.length);
  console.log('=================================\n');

  res.status(200).json({
    success: true,
    data: combinedSrSales
  });
});

// @desc    Get DSR performance report
// @route   GET /api/reports/dsr-performance
// @access  Private

const getDsrPerformance = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  console.log('=== DSR PERFORMANCE REPORT DEBUG ===');
  console.log('Query params:', { startDate, endDate });
  console.log('Shop ID:', req.shopId);

  let matchCondition = { 
    status: 'Delivered',
    deliveredBy: { $exists: true, $ne: null }
  };

  if (req.shopId && mongoose.Types.ObjectId.isValid(req.shopId)) {
    matchCondition.shop = new mongoose.Types.ObjectId(req.shopId);
  } else if (req.shopId) {
    matchCondition.shop = req.shopId;
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

  console.log('Match condition:', JSON.stringify(matchCondition, null, 2));

  // Get DSR performance from SaleOrder collection
  const dsrSaleOrders = await SaleOrder.aggregate([
    { $match: matchCondition },
    {
      $group: {
        _id: "$deliveredBy",
        totalDeliveries: { $sum: 1 },
        totalSales: { $sum: "$total" },
        successfulDeliveries: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "dsrDetails"
      }
    },
    {
      $unwind: { path: "$dsrDetails", preserveNullAndEmptyArrays: true }
    },
    {
      $project: {
        _id: 1,
        dsrName: { $ifNull: ["$dsrDetails.name", "Unknown"] },
        totalDeliveries: 1,
        totalSales: 1,
        successfulDeliveries: 1,
        successRate: {
          $round: [
            { $multiply: [{ $divide: ["$successfulDeliveries", "$totalDeliveries"] }, 100] },
            2
          ]
        }
      }
    }
  ]);

  console.log('DSR SaleOrders count:', dsrSaleOrders.length);
  console.log('=================================\n');

  res.status(200).json({
    success: true,
    data: dsrSaleOrders
  });
});

// @desc    Get daily sales report
// @route   GET /api/reports/daily-sales
// @access  Private

module.exports = {
  getSrWiseSales,
  getDsrPerformance
};
