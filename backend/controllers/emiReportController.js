const EMIInvoice = require('../models/EMIInvoice');
const EMICollection = require('../models/EMICollection');
const Customer = require('../models/Customer');
const asyncHandler = require('express-async-handler');

// @desc    Get EMI dashboard statistics
// @route   GET /api/emi/stats/dashboard
// @access  Private (Super Admin, Admin)
const getDashboardStats = asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Total active EMI invoices
  const totalActiveInvoices = await EMIInvoice.countDocuments({
    isActive: true,
    status: { $in: ['active', 'pending'] }
  });

  // Total completed invoices
  const totalCompleted = await EMIInvoice.countDocuments({
    status: 'completed'
  });

  // Total defaulted invoices
  const totalDefaulted = await EMIInvoice.countDocuments({
    status: 'defaulted'
  });

  // Total outstanding & paid from active invoices
  const activeInvoices = await EMIInvoice.find({
    isActive: true,
    status: { $in: ['active', 'pending'] }
  });

  const totalOutstanding = activeInvoices.reduce((sum, inv) => sum + (inv.outstandingBalance || 0), 0);
  const totalPaid = activeInvoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);

  // Today's collections — from paid instalments with paidDate today
  const todayCollectionsAgg = await EMIInvoice.aggregate([
    { $unwind: '$instalments' },
    { $match: {
      'instalments.status': 'paid',
      'instalments.paidDate': { $gte: today, $lt: tomorrow }
    }},
    { $group: { _id: null, totalAmount: { $sum: '$instalments.amount' }, count: { $sum: 1 } } }
  ]);

  const todayAmount = todayCollectionsAgg[0]?.totalAmount || 0;
  const todayCollections = todayCollectionsAgg[0]?.count || 0;

  // Overdue instalment count
  const overdueAgg = await EMIInvoice.aggregate([
    { $unwind: '$instalments' },
    { $match: {
      'instalments.status': { $in: ['overdue', 'pending'] },
      'instalments.dueDate': { $lt: new Date() }
    }},
    { $count: 'total' }
  ]);
  const overdueCount = overdueAgg[0]?.total || 0;

  res.status(200).json({
    success: true,
    data: {
      totalActiveInvoices,
      totalCompleted,
      totalDefaulted,
      totalOutstanding,
      totalPaid,
      todayAmount,
      todayCollections,
      overdueCount
    }
  });
});

// @desc    Get EMI receivable overview
// @route   GET /api/emi/stats/receivable
// @access  Private
const getReceivableOverview = asyncHandler(async (req, res) => {
  const { month, year } = req.query;

  const query = { isActive: true, status: { $in: ['active', 'pending'] } };

  // Filter by month/year if provided
  if (month && year) {
    const startDate = new Date(year, parseInt(month) - 1, 1);
    const endDate = new Date(year, parseInt(month), 0);
    query.createdAt = { $gte: startDate, $lte: endDate };
  }

  const invoices = await EMIInvoice.find(query)
    .populate('customer', 'contactName contactNumber');

  // --- Shared EMI calculation logic (mirrors frontend calcEMI utility) ---
  // Total Receivable = Total Price - Down Payment
  // Received = Instalments collected (paidAmount)
  // Outstanding = Total Receivable - Received
  const calcInv = (inv) => {
    const totalPrice = (inv.totalAmount || 0) + (inv.emiPlan?.interestAmount || 0);
    const downPayment = inv.downPayment?.amount || 0;
    
    // Total Receivable is the EMI portion (Total Price - Down Payment)
    const totalReceivable = inv.emiPlan?.totalPayableAmount || Math.max(0, totalPrice - downPayment);
    
    // Received is the amount collected via instalments (paidAmount represents ONLY instalments)
    const received = inv.paidAmount || 0;
    
    // What's still owed in instalments
    const outstanding = Math.max(0, totalReceivable - received);
    
    return { 
      totalPayable: totalReceivable, 
      downPayment, 
      emiPaid: received, 
      outstanding 
    };
  };

  // Calculate totals
  const totalReceivable = invoices.reduce((sum, inv) => sum + calcInv(inv).totalPayable, 0);
  const totalReceived   = invoices.reduce((sum, inv) => sum + calcInv(inv).emiPaid, 0);
  const totalOutstanding = invoices.reduce((sum, inv) => sum + calcInv(inv).outstanding, 0);
  const totalDownPayments = invoices.reduce((sum, inv) => sum + calcInv(inv).downPayment, 0);

  // Group by customer
  const customerWise = {};
  invoices.forEach(inv => {
    const customerId = inv.customer ? inv.customer._id.toString() : 'unknown';
    const c = calcInv(inv);
    if (!customerWise[customerId]) {
      customerWise[customerId] = {
        customer: {
          _id: customerId,
          name: inv.customerName || (inv.customer ? inv.customer.contactName : 'Unknown'),
          phone: inv.customerPhone || (inv.customer ? inv.customer.contactNumber : 'N/A')
        },
        totalInvoices: 0,
        totalReceivable: 0,
        totalReceived: 0,
        totalOutstanding: 0,
        totalDownPayments: 0
      };
    }
    customerWise[customerId].totalInvoices += 1;
    customerWise[customerId].totalReceivable += c.totalPayable;
    customerWise[customerId].totalReceived += c.emiPaid;
    customerWise[customerId].totalOutstanding += c.outstanding;
    customerWise[customerId].totalDownPayments += c.downPayment;
  });

  // Monthly breakdown (last 6 months) — query from EMIInvoice paid instalments
  const monthlyBreakdown = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

    const monthAgg = await EMIInvoice.aggregate([
      { $unwind: '$instalments' },
      { $match: {
        'instalments.status': 'paid',
        'instalments.paidDate': { $gte: monthStart, $lte: monthEnd }
      }},
      { $group: { _id: null, collectedAmount: { $sum: '$instalments.amount' }, count: { $sum: 1 } } }
    ]);

    const collectedAmount = monthAgg[0]?.collectedAmount || 0;
    const collectionCount = monthAgg[0]?.count || 0;

    monthlyBreakdown.push({
      month: date.toLocaleString('default', { month: 'short', year: 'numeric' }),
      collectedAmount,
      collectionCount
    });
  }

  // Calendar Events - fetch all instalments from all active/pending invoices
  const allActiveInvoices = await EMIInvoice.find({ isActive: true, status: { $in: ['active', 'pending'] } }, 'invoiceNumber customerName instalments');
  
  const calendarEvents = [];
  allActiveInvoices.forEach(inv => {
    inv.instalments.forEach(inst => {
      if (inst.dueDate) {
        calendarEvents.push({
          invoiceNumber: inv.invoiceNumber,
          customerName: inv.customerName || 'Unknown',
          dueDate: inst.dueDate,
          paidDate: inst.paidDate,
          status: inst.status,
          amount: inst.amount
        });
      }
    });
  });

  res.status(200).json({
    success: true,
    data: {
      summary: {
        totalReceivable,
        totalReceived,
        totalOutstanding,
        totalDownPayments,
        totalInvoices: invoices.length
      },
      customerWise: Object.values(customerWise),
      monthlyBreakdown,
      calendarEvents
    }
  });
});

// @desc    Get overdue EMI statistics
// @route   GET /api/emi/stats/overdue
// @access  Private
const getOverdueStats = asyncHandler(async (req, res) => {
  const { showroom } = req.query;
  const today = new Date();

  const query = { isActive: true, status: { $in: ['active', 'pending'] } };
  if (showroom) query.showroom = showroom;

  const invoices = await EMIInvoice.find(query).populate('customer', 'contactName contactNumber address');

  const overdueData = {
    total: 0,
    totalAmount: 0,
    byDays: {
      '1-7days': { count: 0, amount: 0 },
      '8-15days': { count: 0, amount: 0 },
      '16-30days': { count: 0, amount: 0 },
      '31-60days': { count: 0, amount: 0 },
      '60+days': { count: 0, amount: 0 }
    },
    customers: []
  };

  invoices.forEach(invoice => {
    invoice.instalments.forEach(instalment => {
      if (instalment.status !== 'paid' && instalment.dueDate && new Date(instalment.dueDate) < today) {
        const diffTime = Math.abs(today - new Date(instalment.dueDate));
        const daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const overdueAmount = instalment.amount - (instalment.paidAmount || 0);

        overdueData.total += 1;
        overdueData.totalAmount += overdueAmount;

        // Categorize by days
        if (daysOverdue <= 7) {
          overdueData.byDays['1-7days'].count += 1;
          overdueData.byDays['1-7days'].amount += overdueAmount;
        } else if (daysOverdue <= 15) {
          overdueData.byDays['8-15days'].count += 1;
          overdueData.byDays['8-15days'].amount += overdueAmount;
        } else if (daysOverdue <= 30) {
          overdueData.byDays['16-30days'].count += 1;
          overdueData.byDays['16-30days'].amount += overdueAmount;
        } else if (daysOverdue <= 60) {
          overdueData.byDays['31-60days'].count += 1;
          overdueData.byDays['31-60days'].amount += overdueAmount;
        } else {
          overdueData.byDays['60+days'].count += 1;
          overdueData.byDays['60+days'].amount += overdueAmount;
        }

        // Add to customer list
        const custId = invoice.customer ? invoice.customer._id.toString() : 'unknown';
        const existingCustomer = overdueData.customers.find(c => c.customerId === custId);
        if (existingCustomer) {
          existingCustomer.overdueAmount += overdueAmount;
          existingCustomer.overdueInstalments += 1;
          if (daysOverdue > existingCustomer.maxDaysOverdue) {
            existingCustomer.maxDaysOverdue = daysOverdue;
          }
        } else {
          overdueData.customers.push({
            customerId: custId,
            customerName: invoice.customerName || (invoice.customer ? invoice.customer.contactName : 'Unknown'),
            customerPhone: invoice.customerPhone || (invoice.customer ? invoice.customer.contactNumber : 'N/A'),
            customerAddress: invoice.customer ? invoice.customer.address : '',
            overdueAmount,
            overdueInstalments: 1,
            maxDaysOverdue: daysOverdue
          });
        }
      }
    });
  });

  // Sort customers by overdue amount
  overdueData.customers.sort((a, b) => b.overdueAmount - a.overdueAmount);

  res.status(200).json({
    success: true,
    data: overdueData
  });
});

// @desc    Get EMI collection report
// @route   GET /api/emi/reports/collection
// @access  Private
const getCollectionReport = asyncHandler(async (req, res) => {
  const { startDate, endDate, sr, paymentMethod } = req.query;

  const query = {};
  if (startDate && endDate) {
    query.collectionDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }
  if (sr) query.collectedBy = sr;
  if (paymentMethod) query.paymentMethod = paymentMethod;

  const collections = await EMICollection.find(query)
    .populate('collectedBy', 'name')
    .populate('customer', 'name');

  // Summary by SR
  const srWise = {};
  collections.forEach(col => {
    const srId = col.collectedBy?._id?.toString();
    if (srId) {
      if (!srWise[srId]) {
        srWise[srId] = {
          sr: col.collectedBy.name,
          totalCollections: 0,
          totalAmount: 0
        };
      }
      srWise[srId].totalCollections += 1;
      srWise[srId].totalAmount += col.collectedAmount || 0;
    }
  });

  // Summary by payment method
  const methodWise = {};
  collections.forEach(col => {
    const method = col.paymentMethod;
    if (!methodWise[method]) {
      methodWise[method] = {
        count: 0,
        amount: 0
      };
    }
    methodWise[method].count += 1;
    methodWise[method].amount += col.collectedAmount || 0;
  });

  const totalCollected = collections.reduce((sum, col) => sum + (col.collectedAmount || 0), 0);

  res.status(200).json({
    success: true,
    data: {
      summary: {
        totalCollections: collections.length,
        totalCollected,
        dateRange: { startDate, endDate }
      },
      srWise: Object.values(srWise),
      methodWise,
      transactions: collections
    }
  });
});

// @desc    Get EMI performance metrics
// @route   GET /api/emi/reports/performance
// @access  Private
const getPerformanceMetrics = asyncHandler(async (req, res) => {
  const { month, year } = req.query;

  const query = {};
  if (month && year) {
    const startDate = new Date(year, parseInt(month) - 1, 1);
    const endDate = new Date(year, parseInt(month), 0);
    query.createdAt = { $gte: startDate, $lte: endDate };
  }

  const invoices = await EMIInvoice.find(query);

  const totalInvoices = invoices.length;
  const activeInvoices = invoices.filter(inv => inv.isActive).length;
  const completedInvoices = invoices.filter(inv => inv.status === 'completed').length;
  const defaultedInvoices = invoices.filter(inv => inv.status === 'defaulted').length;

  const completionRate = totalInvoices > 0 ? (completedInvoices / totalInvoices) * 100 : 0;
  const defaultRate = totalInvoices > 0 ? (defaultedInvoices / totalInvoices) * 100 : 0;

  const totalValue = invoices.reduce((sum, inv) => {
    const totalPrice = (inv.totalAmount || 0) + (inv.emiPlan?.interestAmount || 0);
    const downPayment = inv.downPayment?.amount || 0;
    const receivable = inv.emiPlan?.totalPayableAmount || Math.max(0, totalPrice - downPayment);
    return sum + receivable;
  }, 0);
  const collectedValue = invoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);
  const recoveryRate = totalValue > 0 ? (collectedValue / totalValue) * 100 : 0;

  res.status(200).json({
    success: true,
    data: {
      invoiceMetrics: {
        totalInvoices,
        activeInvoices,
        completedInvoices,
        defaultedInvoices,
        completionRate: completionRate.toFixed(2),
        defaultRate: defaultRate.toFixed(2)
      },
      financialMetrics: {
        totalValue,
        collectedValue,
        outstandingValue: totalValue - collectedValue,
        recoveryRate: recoveryRate.toFixed(2)
      }
    }
  });
});

module.exports = {
  getDashboardStats,
  getReceivableOverview,
  getOverdueStats,
  getCollectionReport,
  getPerformanceMetrics
};
