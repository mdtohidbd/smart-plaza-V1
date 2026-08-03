const Sale = require('../../models/Sale');
const SaleOrder = require('../../models/SaleOrder');
const Product = require('../../models/Product');
const Customer = require('../../models/Customer');
const User = require('../../models/User');

const Purchase = require('../../models/Purchase');
const Account = require('../../models/Account');
const StockBatch = require('../../models/StockBatch');
const Income = require('../../models/Income');
const Expense = require('../../models/Expense');
const Inventory = require('../../models/Inventory');
const Warranty = require('../../models/Warranty');
const Category = require('../../models/Category');
const Supplier = require('../../models/Supplier');
const EMIInvoice = require('../../models/EMIInvoice');
const asyncHandler = require('express-async-handler');
const NodeCache = require('node-cache');
const moment = require('moment');
const mongoose = require('mongoose');
const { getMergedNotificationFeed } = require('../../utils/notificationFeed');
const { getPurchaseExpenseHeadIds } = require('../../utils/accountLedgerSync');
const { isSalesStaff } = require('../../utils/roleUtils');

// Initialize cache with 30 seconds TTL to keep data fresh while preventing spam-refresh load
const dashboardCache = new NodeCache({ stdTTL: 30 });

const getSaleTypeLabel = (record, source) => {
  if (source === 'order') {
    if (record.type === 'online') return 'E-Commerce';
    if (record.type === 'retail') return 'Retail';
    return 'Wholesale';
  }

  if (record.type === 'online') return 'E-Commerce';
  if (record.type === 'retail') {
    return record.invoiceType === 'EMI' || record.isEmi ? 'Retail (EMI)' : 'Retail';
  }
  return 'Wholesale';
};

const getRecentSales = async (matchCondition, { srId = null, limit = 5 } = {}) => {
  const saleOrderMatch = srId ? { ...matchCondition, assignedSR: srId } : matchCondition;
  const saleMatch = srId
    ? { ...matchCondition, assignedSR: srId }
    : matchCondition;

  const [recentSaleOrders, recentSales] = await Promise.all([
    SaleOrder.find(saleOrderMatch)
      .populate('customer', 'contactName')
      .populate('assignedSR', 'name')
      .populate('deliveredBy', 'name')
      .sort({ date: -1 })
      .limit(limit)
      .lean(),
    Sale.find(saleMatch)
      .populate('customer', 'contactName')
      .populate('createdBy', 'name')
      .populate('assignedSR', 'name')
      .sort({ date: -1 })
      .limit(limit)
      .lean()
  ]);

  const normalizedOrders = recentSaleOrders.map((order) => ({
    _id: order._id,
    invoiceNumber: order.invoiceNumber,
    customerName: order.customer?.contactName || 'N/A',
    total: order.total,
    status: order.status || order.orderStatus || 'Pending',
    date: order.date || order.createdAt,
    saleType: getSaleTypeLabel(order, 'order'),
    paymentMethod: order.paymentMethod || 'Cash',
    soldBy: order.assignedSR?.name || order.deliveredBy?.name || 'N/A',
    source: 'order'
  }));

  const normalizedSales = recentSales.map((sale) => ({
    _id: sale._id,
    invoiceNumber: sale.invoiceNumber,
    customerName: sale.customer?.contactName || 'N/A',
    total: sale.total,
    status: sale.status || 'Completed',
    date: sale.date || sale.createdAt,
    saleType: getSaleTypeLabel(sale, 'sale'),
    paymentMethod: sale.invoiceType === 'EMI' || sale.isEmi ? 'EMI' : (sale.paymentMethod || 'Cash'),
    soldBy: sale.assignedSR?.name || sale.createdBy?.name || 'N/A',
    source: 'sale'
  }));

  return [...normalizedOrders, ...normalizedSales]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, limit);
};

const getRoleBasedDashboard = asyncHandler(async (req, res) => {
  try {

    
    // Validate shopId if present
    if (req.shopId && !mongoose.Types.ObjectId.isValid(req.shopId)) {
      console.error('Invalid shopId format:', req.shopId);
      return res.status(400).json({
        success: false,
        message: 'Invalid shop ID format'
      });
    }
    
    const userRole = req.user.role;
    const { startDate, endDate, refresh } = req.query;

    const cacheKey = `dashboard_${req.user._id}_${req.shopId || 'all'}_${startDate || 'all'}_${endDate || 'all'}`;
    const cachedData = dashboardCache.get(cacheKey);
    
    // Serve from cache if it exists AND the client isn't explicitly requesting a refresh
    if (cachedData && refresh !== 'true') {
      return res.status(200).json({
        success: true,
        data: cachedData
      });
    }

  let matchCondition = {};
  
  if (startDate || endDate) {
    matchCondition.date = {};
    if (startDate) matchCondition.date.$gte = new Date(startDate);
    if (endDate) matchCondition.date.$lte = new Date(endDate);
  }

  // Get date range for calculations - FIXED DATE LOGIC
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  
  // Create separate date objects for week calculations to avoid mutation
  const todayForWeek = new Date();
  const startOfWeek = new Date(todayForWeek.getFullYear(), todayForWeek.getMonth(), todayForWeek.getDate() - todayForWeek.getDay());
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);

  // Create separate date objects for month calculations to avoid mutation
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
  const startOfPrevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const endOfPrevMonth = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);
  
  // Allow matching records with specific shop OR records created without explicit shop binding (fallback)
  const allTimeMatch = req.shopId ? {
    $or: [
      { shop: new mongoose.Types.ObjectId(req.shopId) },
      { shop: { $exists: false } },
      { shop: null }
    ]
  } : {};
  // EMIInvoice has NO `shop` field (uses `showroom` string) — use a separate match object
  const emiMatch = {};
  
  // Build dashboard data based on user permissions (not just role)
  // Check if user has any read permission for modules
  const hasAnyPermission = userRole === 'Super Admin' || userRole === 'Admin' || userRole === 'Manager' ||
    (req.user.permissions && (
      req.user.permissions.sales?.read ||
      req.user.permissions.retail?.read ||
      req.user.permissions.products?.read ||
      req.user.permissions.contacts?.read ||
      req.user.permissions.inventory?.read ||
      req.user.permissions.accounts?.read ||
      req.user.permissions.reports?.read ||
      req.user.permissions.warranty?.read ||
      req.user.permissions.routes?.read
    ));
  

  
  if (hasAnyPermission) {
    // Admin/Manager gets full access to all data
    
    // Get today's sales from both SaleOrder and traditional Sale
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    
    const todayMatch = { 
      ...(req.shopId && {
        $or: [
          { shop: new mongoose.Types.ObjectId(req.shopId) },
          { shop: { $exists: false } },
          { shop: null }
        ]
      }), 
      date: { 
        $gte: todayStart, 
        $lte: todayEnd 
      } 
    };
    
    const [todaySaleOrders, todayTraditionalSales] = await Promise.all([
      SaleOrder.aggregate([
        { $match: todayMatch },
        { $group: { 
          _id: null, 
          total: { $sum: "$total" }, 
          count: { $sum: 1 },
          creditSales: { 
            $sum: { $cond: [{ $eq: ["$paymentMethod", "Credit"] }, "$total", 0] } 
          }
        } }
      ]),
      Sale.aggregate([
        { $match: todayMatch },
        { $group: { 
          _id: null, 
          total: { $sum: "$total" }, 
          count: { $sum: 1 },
          creditSales: { 
            $sum: { $cond: [{ $eq: ["$paymentMethod", "Credit"] }, "$total", 0] } 
          }
        } }
      ])
    ]);
    
    // Combine today's sales data
    const todaySalesTotal = (todaySaleOrders[0]?.total || 0) + (todayTraditionalSales[0]?.total || 0);
    const todaySalesCount = (todaySaleOrders[0]?.count || 0) + (todayTraditionalSales[0]?.count || 0);
    
    // Get this week's, month's, prev-month's, and all-time sales — all in parallel
    const weekMatch = { ...(req.shopId && { shop: new mongoose.Types.ObjectId(req.shopId) }), date: { $gte: startOfWeek, $lt: endOfWeek } };
    const monthMatch = { ...(req.shopId && { shop: new mongoose.Types.ObjectId(req.shopId) }), date: { $gte: startOfMonth, $lte: endOfMonth } };
    const prevMonthMatch = { ...(req.shopId && { shop: new mongoose.Types.ObjectId(req.shopId) }), date: { $gte: startOfPrevMonth, $lte: endOfPrevMonth } };

    const [
      weekSaleOrders, weekTraditionalSales,
      monthSaleOrders, monthTraditionalSales,
      prevMonthSaleOrders, prevMonthTraditionalSales,
      saleOrderSales, traditionalSales,
      totalDues, recentOrders,
      totalCustomers, totalProducts
    ] = await Promise.all([
      SaleOrder.aggregate([
        { $match: { ...weekMatch, status: { $in: ['Pending', 'Approved', 'Delivered'] } } },
        { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } }
      ]),
      Sale.aggregate([
        { $match: { ...weekMatch, status: 'Completed' } },
        { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } }
      ]),
      SaleOrder.aggregate([
        { $match: { ...monthMatch, status: { $in: ['Pending', 'Approved', 'Delivered'] } } },
        { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } }
      ]),
      Sale.aggregate([
        { $match: { ...monthMatch, status: 'Completed' } },
        { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } }
      ]),
      SaleOrder.aggregate([
        { $match: { ...prevMonthMatch, status: { $in: ['Pending', 'Approved', 'Delivered'] } } },
        { $group: { _id: null, total: { $sum: "$total" } } }
      ]),
      Sale.aggregate([
        { $match: { ...prevMonthMatch, status: 'Completed' } },
        { $group: { _id: null, total: { $sum: "$total" } } }
      ]),
      SaleOrder.aggregate([
        { $match: { ...allTimeMatch, status: { $in: ['Pending', 'Approved', 'Delivered'] } } },
        { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 }, totalFees: { $sum: { $sum: { $ifNull: ["$payments.feeAmount", 0] } } } } }
      ]),
      Sale.aggregate([
        { $match: { ...allTimeMatch, status: 'Completed' } },
        { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 }, totalFees: { $sum: { $sum: { $ifNull: ["$payments.feeAmount", 0] } } } } }
      ]),
      Customer.aggregate([
        { $match: allTimeMatch },
        { $group: { _id: null, totalDue: { $sum: "$totalDue" } } }
      ]),
      getRecentSales(allTimeMatch, { limit: 5 }),
      Customer.countDocuments(allTimeMatch),
      Product.countDocuments(allTimeMatch)
    ]);

    // Derived totals
    const weekSalesTotal = (weekSaleOrders[0]?.total || 0) + (weekTraditionalSales[0]?.total || 0);
    const weekSalesCount = (weekSaleOrders[0]?.count || 0) + (weekTraditionalSales[0]?.count || 0);
    const monthSalesTotal = (monthSaleOrders[0]?.total || 0) + (monthTraditionalSales[0]?.total || 0);
    const monthSalesCount = (monthSaleOrders[0]?.count || 0) + (monthTraditionalSales[0]?.count || 0);
    const prevMonthSales = (prevMonthSaleOrders[0]?.total || 0) + (prevMonthTraditionalSales[0]?.total || 0);
    const monthSalesGrowth = prevMonthSales > 0 ? ((monthSalesTotal - prevMonthSales) / prevMonthSales) * 100 : 0;
    const allSalesTotal = (saleOrderSales[0]?.total || 0) + (traditionalSales[0]?.total || 0);
    const allSalesCount = (saleOrderSales[0]?.count || 0) + (traditionalSales[0]?.count || 0);
    const allSalesFees = (saleOrderSales[0]?.totalFees || 0) + (traditionalSales[0]?.totalFees || 0);

    // --- Dashboard Enhancements — all parallel ---
    const dashboardPurchaseHeadIds = await getPurchaseExpenseHeadIds(
      req.shopId ? new mongoose.Types.ObjectId(req.shopId) : null
    );
    const monthlyExpenseMatch = { ...monthMatch };
    if (dashboardPurchaseHeadIds.length > 0) {
      monthlyExpenseMatch.expenseHead = { $nin: dashboardPurchaseHeadIds };
    }

    const [
      upcomingEMIs,
      lowStockProducts,
      inventoryStatus,
      monthlyRevenue,
      monthlyTraditionalRevenue,
      monthlyExpenses,
      emiStats,
      revenueByCategory,
      weeklyPerformance,
      weeklyProfitPerformance,
      salesByBrand,
      overallStockStats,
      notifications
    ] = await Promise.all([
      // 1. Upcoming & Overdue EMIs
      EMIInvoice.aggregate([
      { $match: { ...emiMatch, status: 'active' } },
      { $unwind: "$instalments" },
      { $match: { "instalments.status": { $in: ['pending', 'overdue'] } } },
      { $sort: { "instalments.dueDate": 1 } },
      { $limit: 10 },
      { $project: {
        customerName: 1,
        contactNumber: "$customerPhone",
        invoiceNumber: 1,
        productName: { $arrayElemAt: ["$products.name", 0] },
        amount: "$instalments.amount",
        dueDate: "$instalments.dueDate",
        instalmentNumber: "$instalments.instalmentNumber",
        totalInstalments: "$emiPlan.duration",
        status: "$instalments.status",
        daysUntilDue: {
          $divide: [
            { $subtract: ["$instalments.dueDate", new Date()] },
            1000 * 60 * 60 * 24
          ]
        }
      }}
      ]),
      // 2. Stock Alerts (Low Stock)
      Product.aggregate([
      { $match: allTimeMatch },
      { $lookup: {
          from: 'stockbatches',
          let: { productId: '$_id' },
          pipeline: [
            { $match: { $expr: { $and: [{ $eq: ['$product', '$$productId'] }, { $eq: ['$isActive', true] }] } } },
            { $group: { _id: null, totalQty: { $sum: '$remainingQty' } } }
          ],
          as: 'stockData'
      }},
      { $addFields: {
          currentStock: { $ifNull: [{ $arrayElemAt: ['$stockData.totalQty', 0] }, 0] }
      }},
      { $match: { $expr: { $lte: ['$currentStock', '$alertQuantity'] } } },
      { $limit: 10 },
      { $project: { name: 1, openingStock: '$currentStock', alertQuantity: 1 } }
      ]),
      // 3. Inventory Status by Product
      Product.aggregate([
      { $match: allTimeMatch },
      { $lookup: {
          from: 'stockbatches',
          let: { productId: '$_id' },
          pipeline: [
            { $match: { $expr: { $and: [{ $eq: ['$product', '$$productId'] }, { $eq: ['$isActive', true] }] } } },
            { $group: { _id: null, totalQty: { $sum: '$remainingQty' }, totalValue: { $sum: { $multiply: ['$remainingQty', '$sellingPrice'] } } } }
          ],
          as: 'stockData'
      }},
      { $addFields: {
          currentStock: { $ifNull: [{ $arrayElemAt: ['$stockData.totalQty', 0] }, 0] },
          currentValue: { $ifNull: [{ $arrayElemAt: ['$stockData.totalValue', 0] }, 0] }
      }},
      { $lookup: { from: 'categories', localField: 'category', foreignField: '_id', as: 'categoryInfo' } },
      { $unwind: { path: '$categoryInfo', preserveNullAndEmptyArrays: true } },
      { $project: {
        _id: 1,
        name: 1,
        sku: 1,
        model: 1,
        category: '$categoryInfo.name',
        currentStock: 1,
        currentValue: 1,
        alertQuantity: 1,
        status: {
          $cond: [
            { $lte: ['$currentStock', 0] },
            'Out of Stock',
            { $cond: [
              { $and: [{ $gt: ['$currentStock', 0] }, { $lte: ['$currentStock', '$alertQuantity'] }] },
              'Low Stock',
              'In Stock'
            ]}
          ]
        }
      }},
      { $sort: { name: 1 } }
      ]),
      // 4. Monthly Revenue
      SaleOrder.aggregate([
        { $match: { ...monthMatch, status: { $in: ['Approved', 'Delivered'] } } },
        { $group: { _id: null, total: { $sum: "$total" }, totalFees: { $sum: { $sum: { $ifNull: ["$payments.feeAmount", 0] } } } } }
      ]),
      Sale.aggregate([
        { $match: { ...monthMatch, status: 'Completed' } },
        { $group: { _id: null, total: { $sum: "$total" }, totalFees: { $sum: { $sum: { $ifNull: ["$payments.feeAmount", 0] } } } } }
      ]),
      Expense.aggregate([
        { $match: monthlyExpenseMatch },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]),
      // 5. EMI Stats
      EMIInvoice.aggregate([
      { $match: emiMatch },
      { $unwind: "$instalments" },
      { $group: {
        _id: null,
        totalOutstanding: { $sum: { $cond: [{ $in: ["$instalments.status", ['pending', 'overdue', 'partial']] }, { $subtract: ["$instalments.amount", "$instalments.paidAmount"] }, 0] } },
        totalPayable: { $sum: "$instalments.amount" },
        dueThisWeek: { $sum: { $cond: [{ 
          $and: [
            { $in: ["$instalments.status", ['pending', 'overdue', 'partial']] },
            { $gte: ["$instalments.dueDate", startOfWeek] },
            { $lt: ["$instalments.dueDate", endOfWeek] }
          ]
        }, { $subtract: ["$instalments.amount", "$instalments.paidAmount"] }, 0] } },
        dueToday: { $sum: { $cond: [{ 
          $and: [
            { $in: ["$instalments.status", ['pending', 'partial']] },
            { $gte: ["$instalments.dueDate", startOfToday] },
            { $lt: ["$instalments.dueDate", endOfToday] }
          ]
        }, { $subtract: ["$instalments.amount", "$instalments.paidAmount"] }, 0] } },
        overdue: { $sum: { $cond: [{ 
          $and: [
            { $in: ["$instalments.status", ['pending', 'overdue', 'partial']] },
            { $lt: ["$instalments.dueDate", startOfToday] }
          ]
        }, { $subtract: ["$instalments.amount", "$instalments.paidAmount"] }, 0] } },
        collectedToday: { $sum: { $cond: [{ 
          $and: [
            { $in: ["$instalments.status", ['paid', 'partial']] },
            { $gte: ["$instalments.paidDate", startOfToday] },
            { $lt: ["$instalments.paidDate", endOfToday] }
          ]
        }, "$instalments.paidAmount", 0] } }
      }}
      ]),
      // 6. Revenue by category
      SaleOrder.aggregate([
      { $match: { ...monthMatch, status: { $in: ['Approved', 'Delivered'] } } },
      { $unwind: "$items" },
      { $lookup: { from: 'products', localField: 'items.product', foreignField: '_id', as: 'productInfo' } },
      { $unwind: '$productInfo' },
      { $lookup: { from: 'categories', localField: 'productInfo.category', foreignField: '_id', as: 'categoryInfo' } },
      { $unwind: '$categoryInfo' },
      { $group: { _id: '$categoryInfo.name', value: { $sum: { $multiply: ['$items.quantity', '$items.unitPrice'] } } } },
      { $project: { name: '$_id', value: 1 } }
      ]),
      // 7. Weekly Sales Performance
      SaleOrder.aggregate([
      { $match: { ...allTimeMatch, date: { $gte: startOfWeek, $lt: endOfWeek }, status: { $in: ['Pending', 'Approved', 'Delivered'] } } },
      { $group: {
        _id: { $dayOfWeek: "$date" },
        sales: { $sum: "$total" }
      }},
      { $sort: { "_id": 1 } }
      ]),
      // 8. Weekly Profit Performance
      SaleOrder.aggregate([
      { $match: { ...allTimeMatch, date: { $gte: startOfWeek, $lt: endOfWeek }, status: { $in: ['Pending', 'Approved', 'Delivered'] } } },
      { $unwind: "$items" },
      { $lookup: { from: 'products', localField: 'items.product', foreignField: '_id', as: 'productInfo' } },
      { $unwind: '$productInfo' },
      { $group: {
        _id: { $dayOfWeek: "$date" },
        profit: { $sum: { $subtract: [
          { $multiply: ["$items.quantity", "$items.unitPrice"] },
          { $multiply: ["$items.quantity", { $ifNull: ["$productInfo.purchasePrice", 0] }] }
        ] } }
      }},
      { $sort: { "_id": 1 } }
      ]),
      // 9. Notifications
      getMergedNotificationFeed(req, { limit: 25 }),
      // 10. Sales by Brand
      SaleOrder.aggregate([
      { $match: { ...allTimeMatch, status: { $in: ['Approved', 'Delivered'] } } },
      { $unwind: "$items" },
      { $lookup: { from: 'products', localField: 'items.product', foreignField: '_id', as: 'productInfo' } },
      { $unwind: '$productInfo' },
      { $group: {
        _id: '$productInfo.supplier',
        totalSales: { $sum: { $multiply: ['$items.quantity', '$items.unitPrice'] } },
        totalQuantity: { $sum: '$items.quantity' },
        orderCount: { $sum: 1 }
      }},
      { $lookup: { from: 'suppliers', localField: '_id', foreignField: '_id', as: 'supplierInfo' } },
      { $unwind: { path: '$supplierInfo', preserveNullAndEmptyArrays: true } },
      { $project: {
        brand: { $ifNull: ['$supplierInfo.supplierName', '$supplierInfo.name'] },
        totalSales: 1,
        totalQuantity: 1,
        orderCount: 1,
        logo: '$supplierInfo.photo'
      }},
      { $sort: { totalSales: -1 } }
      ]),
      // 11. Overall Stock Stats
      Product.aggregate([
      { $match: allTimeMatch },
      { $lookup: {
          from: 'stockbatches',
          let: { productId: '$_id' },
          pipeline: [
            { $match: { $expr: { $and: [{ $eq: ['$product', '$$productId'] }, { $eq: ['$isActive', true] }] } } },
            { $group: { _id: null, totalQty: { $sum: '$remainingQty' } } }
          ],
          as: 'stockData'
      }},
      { $addFields: {
          currentStock: { $ifNull: [{ $arrayElemAt: ['$stockData.totalQty', 0] }, 0] }
      }},
      { $group: {
        _id: null,
        totalInStock: { $sum: { $cond: [{ $gt: ['$currentStock', 0] }, 1, 0] } },
        lowStockCount: { $sum: { $cond: [{ $and: [{ $gt: ['$currentStock', 0] }, { $lte: ['$currentStock', '$alertQuantity'] }] }, 1, 0] } },
        outOfStockCount: { $sum: { $cond: [{ $lte: ['$currentStock', 0] }, 1, 0] } }
      }}
      ])
    ]);
    // --- END: Dashboard Enhancements ---
    
    // Calculate yesterday and last-week date ranges
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStart = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
    const yesterdayEnd = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate() + 1);
    const lastWeekToday = new Date();
    const lastWeekStart = new Date(lastWeekToday.getFullYear(), lastWeekToday.getMonth(), lastWeekToday.getDate() - lastWeekToday.getDay() - 7);
    const lastWeekEnd = new Date(lastWeekStart);
    lastWeekEnd.setDate(lastWeekStart.getDate() + 7);

    const todayPurchaseStart = new Date();
    todayPurchaseStart.setHours(0, 0, 0, 0);
    const todayPurchaseEnd = new Date();
    todayPurchaseEnd.setHours(23, 59, 59, 999);

    const monthIncomeMatch = {
      ...(req.shopId && { shop: new mongoose.Types.ObjectId(req.shopId) }),
      date: { $gte: startOfMonth, $lte: endOfMonth }
    };
    // Reuse dashboardPurchaseHeadIds (already fetched above for monthlyExpenseMatch)
    const allTimePurchaseHeadIds = dashboardPurchaseHeadIds;
    const allTimeExpenseMatch = { ...allTimeMatch };
    if (allTimePurchaseHeadIds.length > 0) {
      allTimeExpenseMatch.expenseHead = { $nin: allTimePurchaseHeadIds };
    }
    const monthExpenseMatch = {
      ...(req.shopId && { shop: new mongoose.Types.ObjectId(req.shopId) }),
      date: { $gte: startOfMonth, $lte: endOfMonth }
    };
    if (dashboardPurchaseHeadIds.length > 0) {
      monthExpenseMatch.expenseHead = { $nin: dashboardPurchaseHeadIds };
    }
    const activeAccountsQuery = req.shopId
      ? { shop: new mongoose.Types.ObjectId(req.shopId), isActive: true }
      : { isActive: true };

    const [
      todayPurchases, allPurchases, monthPurchases,
      supplierDueResult, stockValueResult,
      totalAccounts, activeAccountsCount,
      totalIncome, totalExpense,
      monthIncome, monthIncomeCount,
      monthExpense, monthExpenseCount,
      yesterdaySaleOrders, yesterdayTraditionalSales,
      prevWeekSaleOrders, prevWeekTraditionalSales,
      topSellingProducts, bestCustomerOrders, bestCustomerSales,
      totalIncomeCountVal, totalExpenseCountVal
    ] = await Promise.all([
      Purchase.aggregate([
        { $match: { ...(req.shopId && { shop: new mongoose.Types.ObjectId(req.shopId) }), date: { $gte: todayPurchaseStart, $lte: todayPurchaseEnd } } },
        { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } }
      ]),
      Purchase.aggregate([
        { $match: allTimeMatch },
        { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } }
      ]),
      Purchase.aggregate([
        { $match: { ...(req.shopId && { shop: new mongoose.Types.ObjectId(req.shopId) }), date: { $gte: startOfMonth, $lte: endOfMonth } } },
        { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } }
      ]),
      Supplier.aggregate([
        { $match: allTimeMatch },
        { $group: { _id: null, totalDue: { $sum: "$totalDue" } } }
      ]),
      StockBatch.aggregate([
        { $match: { ...allTimeMatch, isActive: true, remainingQty: { $gt: 0 } } },
        { $group: { _id: null, totalValue: { $sum: { $multiply: ["$remainingQty", "$purchasePrice"] } } } }
      ]),
      Account.countDocuments(allTimeMatch),
      Account.countDocuments(activeAccountsQuery),
      Income.aggregate([
        { $match: allTimeMatch },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]),
      Expense.aggregate([
        { $match: allTimeExpenseMatch },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]),
      Income.aggregate([
        { $match: monthIncomeMatch },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]),
      Income.countDocuments(monthIncomeMatch),
      Expense.aggregate([
        { $match: monthExpenseMatch },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]),
      Expense.countDocuments(monthExpenseMatch),
      SaleOrder.aggregate([
        { $match: { ...allTimeMatch, date: { $gte: yesterdayStart, $lt: yesterdayEnd }, status: { $in: ['Pending', 'Approved', 'Delivered'] } } },
        { $group: { _id: null, total: { $sum: "$total" } } }
      ]),
      Sale.aggregate([
        { $match: { ...allTimeMatch, date: { $gte: yesterdayStart, $lt: yesterdayEnd }, status: 'Completed' } },
        { $group: { _id: null, total: { $sum: "$total" } } }
      ]),
      SaleOrder.aggregate([
        { $match: { ...allTimeMatch, date: { $gte: lastWeekStart, $lt: lastWeekEnd }, status: { $in: ['Pending', 'Approved', 'Delivered'] } } },
        { $group: { _id: null, total: { $sum: "$total" } } }
      ]),
      Sale.aggregate([
        { $match: { ...allTimeMatch, date: { $gte: lastWeekStart, $lt: lastWeekEnd }, status: 'Completed' } },
        { $group: { _id: null, total: { $sum: "$total" } } }
      ]),
      SaleOrder.aggregate([
        { $match: allTimeMatch },
        { $unwind: "$items" },
        { $group: { _id: "$items.product", quantity: { $sum: "$items.quantity" }, totalSales: { $sum: { $multiply: ["$items.quantity", "$items.unitPrice"] } } } },
        { $sort: { quantity: -1 } },
        { $limit: 1 },
        { $lookup: { from: "products", localField: "_id", foreignField: "_id", as: "product" } },
        { $unwind: "$product" },
        { $project: { name: "$product.name", quantity: 1, totalSales: 1 } }
      ]),
      SaleOrder.aggregate([
        { $match: allTimeMatch },
        { $group: { _id: "$customer", totalSpent: { $sum: "$total" } } },
        { $sort: { totalSpent: -1 } },
        { $limit: 5 },
        { $lookup: { from: "customers", localField: "_id", foreignField: "_id", as: "customer" } },
        { $unwind: "$customer" },
        { $project: { customerId: "$_id", name: "$customer.contactName", totalSpent: 1 } }
      ]),
      Sale.aggregate([
        { $match: allTimeMatch },
        { $group: { _id: "$customer", totalSpent: { $sum: "$total" } } },
        { $sort: { totalSpent: -1 } },
        { $limit: 5 },
        { $lookup: { from: "customers", localField: "_id", foreignField: "_id", as: "customer" } },
        { $unwind: "$customer" },
        { $project: { customerId: "$_id", name: "$customer.contactName", totalSpent: 1 } }
      ]),
      Income.countDocuments(allTimeMatch),
      Expense.countDocuments(allTimeExpenseMatch)
    ]);

    // Derive top product (SaleOrder wins; fall back to Sale if empty — already both fetched)
    // topSellingProducts comes from SaleOrder aggregation above; bestCustomerOrders and bestCustomerSales also included
    const topSellingProductResult = topSellingProducts;

    const prevDaySales = (yesterdaySaleOrders[0]?.total || 0) + (yesterdayTraditionalSales[0]?.total || 0);
    const prevWeekSales = (prevWeekSaleOrders[0]?.total || 0) + (prevWeekTraditionalSales[0]?.total || 0);
    const todaySalesGrowth = prevDaySales > 0 ? ((todaySalesTotal - prevDaySales) / prevDaySales) * 100 : 0;
    const salesGrowth = prevWeekSales > 0 ? ((weekSalesTotal - prevWeekSales) / prevWeekSales) * 100 : 0;

    const allCustomers = [...bestCustomerOrders, ...bestCustomerSales];
    const overallBestCustomer = allCustomers.sort((a, b) => b.totalSpent - a.totalSpent)[0] || { name: 'N/A', totalSpent: 0 };
    
    dashboardData = {
      todaySales: todaySalesTotal,
      todayOrders: todaySalesCount,
      weekSales: weekSalesTotal,
      weekOrders: weekSalesCount,
      monthSales: monthSalesTotal,
      monthOrders: monthSalesCount,
      monthSalesGrowth: parseFloat(monthSalesGrowth.toFixed(2)),
      totalSales: allSalesTotal,
      totalOrders: allSalesCount,
      totalDues: totalDues[0]?.totalDue || 0,
      recentOrders,
      totalCustomers,
      totalProducts,
      totalPurchases: allPurchases[0]?.total || 0,
      monthPurchases: monthPurchases[0]?.total || 0,
      monthPurchasesCount: monthPurchases[0]?.count || 0,
      todayPurchases: todayPurchases[0]?.total || 0,
      todayPurchasesCount: todayPurchases[0]?.count || 0,
      totalCustomerDue: totalDues[0]?.totalDue || 0,
      totalSupplierDue: supplierDueResult[0]?.totalDue || 0,
      stockValue: stockValueResult[0]?.totalValue || 0,
      totalIncome: totalIncome[0]?.total || 0,
      monthIncome: monthIncome[0]?.total || 0,
      monthIncomeCount: monthIncomeCount,
      totalExpense: totalExpense[0]?.total || 0,
      monthExpense: monthExpense[0]?.total || 0,
      monthExpenseCount: monthExpenseCount,
      totalIncomeCount: totalIncomeCountVal,
      totalExpenseCount: totalExpenseCountVal,
      netProfit: allSalesTotal - (allPurchases[0]?.total || 0) - allSalesFees,
      salesGrowth: parseFloat(salesGrowth.toFixed(2)),
      todaySalesGrowth: parseFloat(todaySalesGrowth.toFixed(2)),
      topSellingProduct: topSellingProductResult[0]?.name || 'N/A',
      topSellingProductCount: topSellingProductResult[0]?.quantity || 0,
      bestCustomer: overallBestCustomer?.name || 'N/A',
      bestCustomerSpending: overallBestCustomer?.totalSpent || 0,
      conversionRate: 0, // Placeholder - would need more complex calculation
      conversionRateImprovement: 0,
      revenueGrowth: parseFloat(salesGrowth.toFixed(2)),
      purchasesGrowth: 0, // Placeholder - calculate similar to sales growth
      stockGrowth: 0, // Placeholder
      totalAccounts,
      activeAccounts: activeAccountsCount,
      todayCreditSales: (todaySaleOrders[0]?.creditSales || 0) + (todayTraditionalSales[0]?.creditSales || 0),
      todaySalesCount: todaySalesCount,
      todayPurchasesCount: todayPurchases[0]?.count || 0,
      // Enhanced dashboard data
      upcomingEMIs,
      lowStockProducts,
      inventoryStatus,
      salesByBrand,
      emiStats: emiStats[0] || { totalOutstanding: 0, totalPayable: 0, dueThisWeek: 0, dueToday: 0, overdue: 0, collectedToday: 0 },
      overallStockStats: overallStockStats[0] || { totalInStock: 0, lowStockCount: 0, outOfStockCount: 0 },
      weeklyProfitPerformance,
      monthlyFinancials: {
        revenue: (monthlyRevenue[0]?.total || 0) + (monthlyTraditionalRevenue[0]?.total || 0),
        expenses: monthlyExpenses[0]?.total || 0,
        netProfit: ((monthlyRevenue[0]?.total || 0) + (monthlyTraditionalRevenue[0]?.total || 0)) - (monthlyExpenses[0]?.total || 0) - ((monthlyRevenue[0]?.totalFees || 0) + (monthlyTraditionalRevenue[0]?.totalFees || 0)),
        revenueByCategory
      },
      weeklyPerformance,
      notifications,
      role: userRole
    };
  } else if (userRole === 'SR' || userRole === 'DSR') {
    // SR/DSR gets data related to their assigned orders/shops
    const srId = req.user._id;
    
    // Get today's sales for this SR from both SaleOrder and traditional Sale
    const todayMatch = { ...allTimeMatch, assignedSR: srId, date: { $gte: startOfToday, $lt: endOfToday } };
    const todaySaleOrders = await SaleOrder.aggregate([
      { $match: todayMatch },
      { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 }, commission: { $sum: "$commissionAmount" } } }
    ]);
    
    const todayTraditionalSales = await Sale.aggregate([
      { $match: todayMatch },
      { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 }, commission: { $sum: "$commissionAmount" } } }
    ]);
    
    // Combine today's sales data
    const todaySalesTotal = (todaySaleOrders[0]?.total || 0) + (todayTraditionalSales[0]?.total || 0);
    const todaySalesCount = (todaySaleOrders[0]?.count || 0) + (todayTraditionalSales[0]?.count || 0);
    const todayCommission = (todaySaleOrders[0]?.commission || 0) + (todayTraditionalSales[0]?.commission || 0);
    
    // Get this week's sales for this SR from both SaleOrder and traditional Sale
    const weekMatch = { ...allTimeMatch, assignedSR: srId, date: { $gte: startOfWeek, $lt: endOfWeek } };
    const weekSaleOrders = await SaleOrder.aggregate([
      { $match: { ...weekMatch, status: { $in: ['Approved', 'Delivered'] } } },
      { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 }, commission: { $sum: "$commissionAmount" } } }
    ]);
    
    const weekTraditionalSales = await Sale.aggregate([
      { $match: { ...weekMatch, status: 'Completed' } },
      { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 }, commission: { $sum: "$commissionAmount" } } }
    ]);
    
    // Combine week's sales data
    const weekSalesTotal = (weekSaleOrders[0]?.total || 0) + (weekTraditionalSales[0]?.total || 0);
    const weekSalesCount = (weekSaleOrders[0]?.count || 0) + (weekTraditionalSales[0]?.count || 0);
    const weekCommission = (weekSaleOrders[0]?.commission || 0) + (weekTraditionalSales[0]?.commission || 0);
    
    // Get all sales for this SR from both SaleOrder and traditional Sale
    const allSaleOrders = await SaleOrder.aggregate([
      { $match: { ...allTimeMatch, assignedSR: srId, status: { $in: ['Approved', 'Delivered'] } } },
      { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 }, commission: { $sum: "$commissionAmount" } } }
    ]);
    
    const allTraditionalSales = await Sale.aggregate([
      { $match: { ...allTimeMatch, assignedSR: srId, status: 'Completed' } },
      { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 }, commission: { $sum: "$commissionAmount" } } }
    ]);
    
    // Combine all sales data
    const allSalesTotal = (allSaleOrders[0]?.total || 0) + (allTraditionalSales[0]?.total || 0);
    const allSalesCount = (allSaleOrders[0]?.count || 0) + (allTraditionalSales[0]?.count || 0);
    const allCommission = (allSaleOrders[0]?.commission || 0) + (allTraditionalSales[0]?.commission || 0);
    
    // Get pending approvals for this SR
    const pendingApprovals = await SaleOrder.countDocuments({
      ...allTimeMatch,
      assignedSR: srId,
      approvalStatus: 'Pending'
    });
    
    // Calculate stock value from StockBatch (active batches: remainingQty * purchasePrice)
    const stockValueResult = await StockBatch.aggregate([
      { 
        $match: { 
          ...allTimeMatch, 
          isActive: true, 
          remainingQty: { $gt: 0 } 
        } 
      },
      { 
        $group: { 
          _id: null, 
          totalValue: { $sum: { $multiply: ["$remainingQty", "$purchasePrice"] } } 
        } 
      }
    ]);
    
    // Get supplier due and active accounts
    const supplierDueResult = await Supplier.aggregate([
      { $match: allTimeMatch },
      { $group: { _id: null, totalDue: { $sum: "$totalDue" } } }
    ]);
    
    const activeAccountsQuery = req.shopId 
      ? { shop: new mongoose.Types.ObjectId(req.shopId), isActive: true }
      : { isActive: true };
    const activeAccountsCount = await Account.countDocuments(activeAccountsQuery);
    const totalAccountsCount = await Account.countDocuments(allTimeMatch);
    
    // Get total customers
    const totalCustomers = await Customer.countDocuments(allTimeMatch);
    
    // Get total products
    const totalProducts = await Product.countDocuments(allTimeMatch);
    
    // Get customer due
    const totalDues = await SaleOrder.aggregate([
      { $match: { ...allTimeMatch, assignedSR: srId } },
      { $group: { _id: null, totalDue: { $sum: "$dueAmount" } } }
    ]);
    
    // Get recent sales for this SR from both collections
    const recentOrders = await getRecentSales(allTimeMatch, { srId, limit: 5 });
    
    dashboardData = {
      todaySales: todaySalesTotal,
      todayOrders: todaySalesCount,
      todayCommission: todayCommission,
      weekSales: weekSalesTotal,
      weekOrders: weekSalesCount,
      weekCommission: weekCommission,
      monthPurchases: 0,
      monthPurchasesCount: 0,
      monthIncome: 0,
      monthIncomeCount: 0,
      monthExpense: 0,
      monthExpenseCount: 0,
      totalSales: allSalesTotal,
      totalOrders: allSalesCount,
      totalCommission: allCommission,
      pendingApprovals,
      totalDues: totalDues[0]?.totalDue || 0,
      totalCustomerDue: totalDues[0]?.totalDue || 0,
      totalCustomers,
      totalProducts,
      stockValue: stockValueResult[0]?.totalValue || 0,
      totalSupplierDue: supplierDueResult[0]?.totalDue || 0,
      activeAccounts: activeAccountsCount,
      totalAccounts: totalAccountsCount,
      todayCreditSales: (todaySaleOrders[0]?.creditSales || 0) + (todayTraditionalSales[0]?.creditSales || 0),
      role: userRole,
      recentOrders
    };
  } else {
    // Other roles get limited data
    dashboardData = {
      role: userRole,
      todaySales: 0,
      todayOrders: 0,
      weekSales: 0,
      weekOrders: 0,
      monthPurchases: 0,
      monthPurchasesCount: 0,
      monthIncome: 0,
      monthIncomeCount: 0,
      monthExpense: 0,
      monthExpenseCount: 0,
      totalSales: 0,
      totalOrders: 0,
      totalDues: 0,
      totalCustomers: 0,
      totalProducts: 0
    };
  }

  // Selectively filter and redact dashboardData based on active user permissions for security
  if (dashboardData) {
    const permissions = req.user.permissions || {};
    
    // 1. Inventory & Stock Value Filtering
    const canReadInventory = permissions.inventory?.read === true;
    if (!canReadInventory) {
      delete dashboardData.stockValue;
      delete dashboardData.totalProducts;
      delete dashboardData.lowStockProducts;
      delete dashboardData.inventoryStatus;
      delete dashboardData.overallStockStats;
    }
    
    // 2. Financial, Accounts, and Purchases Filtering - OR if user is Sales Staff
    const canReadAccounts = permissions.accounts?.read === true;
    const canReadPurchases = permissions.purchase?.read === true;
    if (!canReadAccounts || !canReadPurchases || isSalesStaff(req.user)) {
      delete dashboardData.totalPurchases;
      delete dashboardData.todayPurchases;
      delete dashboardData.todayPurchasesCount;
      delete dashboardData.totalIncome;
      delete dashboardData.totalExpense;
      delete dashboardData.netProfit;
      delete dashboardData.totalIncomeCount;
      delete dashboardData.totalExpenseCount;
      delete dashboardData.purchasesGrowth;
      delete dashboardData.weeklyProfitPerformance;
      delete dashboardData.monthlyFinancials;
      delete dashboardData.totalSupplierDue;
      delete dashboardData.activeAccounts;
      delete dashboardData.totalAccounts;
      delete dashboardData.todayCreditSales;
    }
    
    // 3. Contacts / Customer Info Masking
    const canReadContacts = permissions.contacts?.read === true;
    if (!canReadContacts) {
      delete dashboardData.totalCustomers;
      delete dashboardData.bestCustomer;
      delete dashboardData.bestCustomerSpending;
      
      // Redact customer names from recent orders
      if (Array.isArray(dashboardData.recentOrders)) {
        dashboardData.recentOrders = dashboardData.recentOrders.map(order => ({
          ...order,
          customerName: 'Restricted'
        }));
      }
    }
  }

  if (dashboardData) {
    dashboardCache.set(cacheKey, dashboardData);
  }

  res.status(200).json({
    success: true,
    data: dashboardData
  });
  } catch (error) {
    console.error('=== DASHBOARD ERROR ===');
    console.error('Error details:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data',
      error: error.message
    });
  }
});

// const ExcelJS removed
const fs = require('fs');
const path = require('path');

// @desc    Export sales report to Excel
// @route   GET /api/reports/export/excel
// @access  Private

module.exports = {
  getRoleBasedDashboard
};
