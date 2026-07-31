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

const getConsolidatedInvoice = asyncHandler(async (req, res) => {
  const { startDate, endDate, customerGroup, status } = req.query;
  
  let matchCondition = { type: 'wholesale' };
  
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

  if (status) {
    matchCondition.status = status;
  }

  // Group invoices by customer for consolidation
  const consolidatedInvoices = await SaleOrder.aggregate([
    { $match: matchCondition },
    {
      $group: {
        _id: '$customer',
        customerName: { $first: '$customerName' },
        customerContact: { $first: '$customerContact' },
        totalInvoices: { $sum: 1 },
        totalQuantity: { $sum: { $size: '$items' } },
        subTotal: { $sum: '$subTotal' },
        discount: { $sum: '$discount' },
        tax: { $sum: '$tax' },
        totalAmount: { $sum: '$total' },
        paidAmount: { $sum: '$paidAmount' },
        dueAmount: { $sum: '$dueAmount' },
        invoiceNumbers: { $push: '$orderNumber' },
        firstInvoiceDate: { $min: '$date' },
        lastInvoiceDate: { $max: '$date' }
      }
    },
    {
      $project: {
        customerName: 1,
        customerContact: 1,
        totalInvoices: 1,
        totalQuantity: 1,
        subTotal: { $round: ['$subTotal', 2] },
        discount: { $round: ['$discount', 2] },
        tax: { $round: ['$tax', 2] },
        totalAmount: { $round: ['$totalAmount', 2] },
        paidAmount: { $round: ['$paidAmount', 2] },
        dueAmount: { $round: ['$dueAmount', 2] },
        invoiceNumbers: 1,
        period: {
          from: '$firstInvoiceDate',
          to: '$lastInvoiceDate'
        }
      }
    },
    { $sort: { totalAmount: -1 } }
  ]);

  res.status(200).json({
    success: true,
    count: consolidatedInvoices.length,
    data: consolidatedInvoices
  });
});

// @desc    Get Customer Ledger Report
// @route   GET /api/reports/customer-ledger
// @access  Private

module.exports = {
  getConsolidatedInvoice
};
