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
const Supplier = require('../../models/Supplier');
const asyncHandler = require('express-async-handler');
const moment = require('moment');
const mongoose = require('mongoose');
const { getMergedNotificationFeed } = require('../../utils/notificationFeed');
// const ExcelJS removed

const getCustomerLedger = asyncHandler(async (req, res) => {
  const { customerId, startDate, endDate, transactionType } = req.query;
  
  let matchCondition = {};
  
  // Clean query params
  let qShopId = req.query.shopId;
  if (qShopId === 'null' || qShopId === 'undefined' || qShopId === '') qShopId = null;
  
  let qCustomerId = req.query.customerId;
  if (qCustomerId === 'null' || qCustomerId === 'undefined' || qCustomerId === '') qCustomerId = null;

  // Use shopId from query OR from shop context middleware
  const shopId = qShopId || req.shopId;
  if (shopId && mongoose.Types.ObjectId.isValid(shopId)) {
    matchCondition.shop = new mongoose.Types.ObjectId(shopId);
  } else if (shopId) {
    matchCondition.shop = shopId;
  }

  // Filter by customer if provided
  if (qCustomerId && mongoose.Types.ObjectId.isValid(qCustomerId)) {
    matchCondition.customer = new mongoose.Types.ObjectId(qCustomerId);
  } else if (qCustomerId) {
    matchCondition.customer = qCustomerId;
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

  // Get all customers — Customer model stores shop reference but we don't
  // strictly filter by shop here to avoid missing customers due to schema mismatch.
  // Instead we rely on the SaleOrder/Sale match to scope results.
  let customerMatch = {};
  if (qCustomerId && mongoose.Types.ObjectId.isValid(qCustomerId)) {
    customerMatch._id = new mongoose.Types.ObjectId(qCustomerId);
  } else if (qCustomerId) {
    customerMatch._id = qCustomerId;
  }

  // Also optionally scope by shop if the Customer model has a shop field
  if (shopId && mongoose.Types.ObjectId.isValid(shopId)) {
    customerMatch.shop = new mongoose.Types.ObjectId(shopId);
  }

  let allCustomers = await Customer.find(customerMatch);
  // Fallback: if no customers found (possibly shop filter too strict), fetch without shop filter
  if (allCustomers.length === 0 && shopId) {
    const fallbackMatch = { ...customerMatch };
    delete fallbackMatch.shop;
    allCustomers = await Customer.find(fallbackMatch);
  }

  // Initialize ledger structure for all matching customers
  const customerTransactions = {};
  allCustomers.forEach(cust => {
    customerTransactions[cust._id.toString()] = {
      customer: {
        _id: cust._id,
        name: cust.contactName,
        contact: cust.contactNumber,
        address: cust.address
      },
      transactions: [],
      summary: {
        totalSales: 0,
        totalPaid: 0,
        totalDue: 0,
        openingBalance: cust.openingBalance || 0,
        closingBalance: cust.openingBalance || 0
      }
    };
  });

  // Get all transactions for customers (wholesale sale orders)
  // Exclude Converted orders to prevent double counting.
  // Do NOT add shop filter here — many SaleOrders might not have a shop field set;
  // we already scoped customers above. We just need all orders for those customers.
  const customerIds = allCustomers.map(c => c._id);
  const orderMatchCondition = {
    status: { $ne: 'Converted' },
    ...(customerIds.length > 0 ? { customer: { $in: customerIds } } : {}),
    ...(matchCondition.date ? { date: matchCondition.date } : {})
  };
  const wholesaleTransactions = await SaleOrder.aggregate([
    { $match: orderMatchCondition },
    {
      $lookup: {
        from: 'customers',
        localField: 'customer',
        foreignField: '_id',
        as: 'customerInfo'
      }
    },
    {
      $unwind: { path: '$customerInfo', preserveNullAndEmptyArrays: true }
    },
    {
      $project: {
        orderNumber: 1,
        invoiceNumber: 1,
        date: 1,
        // Use customerInfo._id if lookup succeeded, otherwise fall back to the raw customer field
        customer: { $ifNull: ['$customerInfo._id', '$customer'] },
        customerName: { $ifNull: ['$customerInfo.contactName', ''] },
        customerContact: { $ifNull: ['$customerInfo.contactNumber', ''] },
        customerAddress: { $ifNull: ['$customerInfo.address', ''] },
        type: 1,
        status: 1,
        subTotal: 1,
        discount: 1,
        tax: 1,
        total: 1,
        paidAmount: 1,
        dueAmount: 1,
        paymentMethod: 1,
        items: 1
      }
    },
    { $sort: { date: -1, orderNumber: -1 } }
  ]);
  
  // Also get retail/wholesale sales — scope by customerIds list, not the matchCondition
  // which carries a shop filter that Sale model may not respect the same way
  const retailMatchCondition = {
    ...(customerIds.length > 0 ? { customer: { $in: customerIds } } : {}),
    ...(matchCondition.date ? { date: matchCondition.date } : {})
  };
  const retailTransactions = await Sale.aggregate([
    { $match: retailMatchCondition },
    {
      $lookup: {
        from: 'customers',
        localField: 'customer',
        foreignField: '_id',
        as: 'customerInfo'
      }
    },
    {
      $unwind: { path: '$customerInfo', preserveNullAndEmptyArrays: true }
    },
    {
      $project: {
        invoiceNumber: 1,
        date: 1,
        customer: { $ifNull: ['$customerInfo._id', '$customer'] },
        customerName: { $ifNull: ['$customerInfo.contactName', ''] },
        customerContact: { $ifNull: ['$customerInfo.contactNumber', ''] },
        customerAddress: { $ifNull: ['$customerInfo.address', ''] },
        type: '$type',
        status: 1,
        subTotal: 1,
        discount: 1,
        tax: 1,
        total: 1,
        paidAmount: 1,
        dueAmount: 1,
        paymentMethod: 1,
        items: 1
      }
    },
    { $sort: { date: -1, invoiceNumber: -1 } }
  ]);
  
  // Combine both wholesale and retail transactions
  const ledger = [...wholesaleTransactions, ...retailTransactions];

  // Calculate running balance for each customer.
  // NOTE: after $project in the aggregate, transaction.customer is a raw ObjectId
  // (not a nested object), so we must NOT use transaction.customer?._id.
  ledger.forEach(transaction => {
    const rawCustomer = transaction.customer;
    const custId = rawCustomer ? rawCustomer.toString() : '';
    
    if (custId && customerTransactions[custId]) {
      // Add transaction
      customerTransactions[custId].transactions.push({
        id: transaction._id,
        sourceType: transaction.type === 'retail' ? 'sale' : 'order',
        date: transaction.date,
        reference: transaction.invoiceNumber || transaction.orderNumber,
        type: 'Sale',
        debit: transaction.total || 0,
        credit: transaction.paidAmount || 0,
        balance: 0,
        details: {
          items: transaction.items?.length || 0,
          subTotal: transaction.subTotal || 0,
          discount: transaction.discount || 0,
          tax: transaction.tax || 0
        }
      });
      
      // Update summary
      customerTransactions[custId].summary.totalSales += (transaction.total || 0);
      customerTransactions[custId].summary.totalPaid += (transaction.paidAmount || 0);
      customerTransactions[custId].summary.totalDue += (transaction.dueAmount || 0);
    }
  });
  
  // Calculate closing balance: openingBalance + totalSales - totalPaid
  Object.values(customerTransactions).forEach(customerData => {
    customerData.summary.closingBalance = 
      customerData.summary.openingBalance + customerData.summary.totalSales - customerData.summary.totalPaid;
  });
  
  res.status(200).json({
    success: true,
    count: Object.keys(customerTransactions).length,
    data: Object.values(customerTransactions)
  });
});

// @desc    Get Sales Due Report (Outstanding Dues)
// @route   GET /api/reports/sales-due-report
// @access  Private

const getCustomerDues = asyncHandler(async (req, res) => {
  let filterCondition = { totalDue: { $gt: 0 } };
  if (req.shopId) {
    filterCondition.shop = req.shopId;
  }

  const customers = await Customer.find(filterCondition)
    .select('contactName contactNumber totalDue address')
    .sort({ totalDue: -1 });

  const totalOutstanding = customers.reduce((sum, customer) => sum + customer.totalDue, 0);

  res.status(200).json({
    success: true,
    data: {
      customers,
      totalOutstanding,
      customerCount: customers.length
    }
  });
});

// @desc    Get comprehensive dashboard data based on user role
// @route   GET /api/reports/role-dashboard
// @access  Private

const getSupplierLedger = asyncHandler(async (req, res) => {
  const { supplierId, startDate, endDate } = req.query;

  let matchCondition = {};
  
  // Clean query params
  let qShopId = req.query.shopId;
  if (qShopId === 'null' || qShopId === 'undefined' || qShopId === '') qShopId = null;
  
  let qSupplierId = req.query.supplierId;
  if (qSupplierId === 'null' || qSupplierId === 'undefined' || qSupplierId === '') qSupplierId = null;

  // Use shopId from query OR from shop context middleware
  const shopId = qShopId || req.shopId;
  if (shopId) {
    const shopObjId = mongoose.Types.ObjectId.isValid(shopId) ? new mongoose.Types.ObjectId(shopId) : shopId;
    matchCondition.$or = [
      { shop: shopObjId },
      { shop: null },
      { shop: { $exists: false } }
    ];
  }

  // Filter by supplier if provided
  if (qSupplierId && mongoose.Types.ObjectId.isValid(qSupplierId)) {
    matchCondition.supplier = new mongoose.Types.ObjectId(qSupplierId);
  } else if (qSupplierId) {
    matchCondition.supplier = qSupplierId;
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

  // Get all companies matching shop and supplierId criteria
  let companyMatch = {};
  if (shopId) {
    const shopObjId = mongoose.Types.ObjectId.isValid(shopId) ? new mongoose.Types.ObjectId(shopId) : shopId;
    companyMatch.$or = [
      { shop: shopObjId },
      { shop: null },
      { shop: { $exists: false } }
    ];
  }

  if (qSupplierId && mongoose.Types.ObjectId.isValid(qSupplierId)) {
    companyMatch._id = new mongoose.Types.ObjectId(qSupplierId);
  } else if (qSupplierId) {
    companyMatch._id = qSupplierId;
  }

  const allCompanies = await Supplier.find(companyMatch);

  // Initialize ledger structure for all matching companies (suppliers)
  const supplierTransactions = {};
  allCompanies.forEach(comp => {
    supplierTransactions[comp._id.toString()] = {
      supplier: {
        _id: comp._id,
        businessName: comp.supplierName || comp.name,
        contactPersonName: comp.contactName,
        contactNumber: comp.contactNumber,
        address: comp.address
      },
      transactions: [],
      summary: {
        totalPurchase: 0,
        totalPaid: 0,
        totalDue: 0,
        openingBalance: comp.openingBalance || 0,
        closingBalance: comp.openingBalance || 0,
        lastTransactionDate: null
      }
    };
  });

  // Get all purchases for these companies
  const purchases = await Purchase.aggregate([
    { $match: matchCondition },
    {
      $lookup: {
        from: 'suppliers',
        localField: 'supplier',
        foreignField: '_id',
        as: 'supplierInfo'
      }
    },
    { $unwind: '$supplierInfo' },
    {
      $project: {
        purchaseNumber: 1,
        date: 1,
        supplier: '$supplierInfo._id',
        subTotal: 1,
        discount: 1,
        tax: 1,
        total: 1,
        paidAmount: 1,
        dueAmount: 1,
        paymentMethod: 1,
        items: 1
      }
    },
    { $sort: { date: -1, purchaseNumber: -1 } }
  ]);

  purchases.forEach(purchase => {
    const compId = (purchase.supplier || '').toString();
    if (supplierTransactions[compId]) {
      // Add transaction
      supplierTransactions[compId].transactions.push({
        id: purchase._id,
        date: purchase.date,
        reference: purchase.purchaseNumber,
        type: 'Purchase',
        debit: purchase.total,
        credit: purchase.paidAmount,
        balance: 0,
        details: {
          items: purchase.items?.length || 0,
          subTotal: purchase.subTotal,
          discount: purchase.discount,
          tax: purchase.tax
        }
      });

      // Update summary
      supplierTransactions[compId].summary.totalPurchase += purchase.total;
      supplierTransactions[compId].summary.totalPaid += purchase.paidAmount;
      supplierTransactions[compId].summary.totalDue += purchase.dueAmount;
      
      // Track last transaction date
      if (!supplierTransactions[compId].summary.lastTransactionDate || 
          new Date(purchase.date) > new Date(supplierTransactions[compId].summary.lastTransactionDate)) {
        supplierTransactions[compId].summary.lastTransactionDate = purchase.date;
      }
    }
  });

  // Calculate closing balance: openingBalance + totalPurchase - totalPaid
  Object.values(supplierTransactions).forEach(supplierData => {
    supplierData.summary.closingBalance = 
      supplierData.summary.openingBalance + supplierData.summary.totalPurchase - supplierData.summary.totalPaid;
  });

  // Calculate overall summary statistics
  const summaryStats = Object.values(supplierTransactions).reduce((acc, supplier) => {
    acc.totalSuppliers += 1;
    acc.totalPurchases += supplier.summary.totalPurchase;
    acc.totalPaid += supplier.summary.totalPaid;
    acc.totalDue += supplier.summary.closingBalance;
    return acc;
  }, { totalSuppliers: 0, totalPurchases: 0, totalPaid: 0, totalDue: 0 });

  res.status(200).json({
    success: true,
    count: Object.keys(supplierTransactions).length,
    data: {
      suppliers: Object.values(supplierTransactions),
      summary: summaryStats
    }
  });
});

// @desc    Get SR-wise sales and commission report
// @route   GET /api/reports/sr-sales
// @access  Private

module.exports = {
  getCustomerLedger,
  getCustomerDues,
  getSupplierLedger
};
