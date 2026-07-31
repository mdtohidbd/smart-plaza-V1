const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const moment = require('moment');

// Models
const Purchase = require('../models/Purchase');
const Investor = require('../models/Investor');
const Income = require('../models/Income');
const EMICollection = require('../models/EMICollection');

const {
  aggregateLedgerTotals,
  aggregateIncomeByHead,
  aggregateExpenseByHead,
  resyncAllSalesLedger,
} = require('../utils/accountLedgerSync');

// Helper to calculate late fees in period
const calculateLateFees = async (shopId, startDate, endDate) => {
  const query = {
    date: { $gte: startDate, $lte: endDate },
    reference: { $regex: /^auto:emi:/ }
  };
  if (shopId) query.shop = new mongoose.Types.ObjectId(shopId);
  
  const incomeRecords = await Income.find(query);
  const collectionIds = incomeRecords.map(r => {
    const parts = r.reference.split(':');
    return parts[parts.length - 1];
  }).filter(id => mongoose.Types.ObjectId.isValid(id));
  
  if (collectionIds.length === 0) return 0;
  
  const collections = await EMICollection.find({ _id: { $in: collectionIds } });
  return collections.reduce((sum, c) => sum + (c.lateFee || 0), 0);
};

// Helper to calculate P&L data from synced income/expense ledger (excludes purchase payments)
const calculateProfitAndLoss = async (shopId, startDate, endDate) => {
  const shopObjectId = shopId ? new mongoose.Types.ObjectId(shopId) : null;
  return aggregateLedgerTotals(shopObjectId, startDate, endDate);
};

// @desc    Get Profit & Loss Statement
// @route   GET /api/finance/profit-loss
// @access  Private
const getProfitLossStatement = asyncHandler(async (req, res) => {
  const { startDate, endDate, type } = req.query;

  let start, end;

  if (type === 'daily') {
    start = moment().startOf('day').toDate();
    end = moment().endOf('day').toDate();
  } else if (type === 'monthly') {
    start = moment().startOf('month').toDate();
    end = moment().endOf('month').toDate();
  } else if (startDate && endDate) {
    start = moment(startDate).startOf('day').toDate();
    end = moment(endDate).endOf('day').toDate();
  } else {
    start = moment().startOf('month').toDate();
    end = moment().endOf('month').toDate();
  }

  const [plData, totalLateFees] = await Promise.all([
    calculateProfitAndLoss(req.shopId, start, end),
    calculateLateFees(req.shopId, start, end)
  ]);

  res.status(200).json({
    success: true,
    data: {
      dateRange: { start, end },
      ...plData,
      totalLateFees,
      formulas: {
        totalIncome: 'Sales Revenue + Down Payment + EMI Collections + Due Collections + Other Income',
        grossProfit: 'Total Income − COGS',
        netProfit: 'Total Income − Total Expenses (COGS + Operating)',
      },
      notes: [
        'Down Payment is recorded only for Retail (EMI) sales at invoice creation.',
        'Sales Revenue is recorded for cash, wholesale, and partial retail/wholesale payments at sale time.',
        'Each sale also creates a matching COGS expense (customer name) tied to the same invoice in description.',
        'Purchase payments are excluded from expenses — product cost is counted once via COGS on each sale.',
      ],
    },
  });
});

// @desc    Get Cash Flow Statement
// @route   GET /api/finance/cash-flow
// @access  Private
const getCashFlowStatement = asyncHandler(async (req, res) => {
  const { startDate, endDate, type } = req.query;

  let start, end;

  if (type === 'daily') {
    start = moment().startOf('day').toDate();
    end = moment().endOf('day').toDate();
  } else if (type === 'monthly') {
    start = moment().startOf('month').toDate();
    end = moment().endOf('month').toDate();
  } else if (startDate && endDate) {
    start = moment(startDate).startOf('day').toDate();
    end = moment(endDate).endOf('day').toDate();
  } else {
    start = moment().startOf('month').toDate();
    end = moment().endOf('month').toDate();
  }

  const matchCondition = { date: { $gte: start, $lte: end } };
  if (req.shopId) matchCondition.shop = new mongoose.Types.ObjectId(req.shopId);

  const shopObjectId = req.shopId ? new mongoose.Types.ObjectId(req.shopId) : null;

  const [incomeData, expenseData, purchaseCashData, totalLateFees] = await Promise.all([
    aggregateIncomeByHead(shopObjectId, start, end),
    aggregateExpenseByHead(shopObjectId, start, end),
    Purchase.aggregate([
      { $match: matchCondition },
      { $group: { _id: null, paidAmount: { $sum: '$paidAmount' } } },
    ]),
    calculateLateFees(req.shopId, start, end)
  ]);

  const ib = incomeData.breakdown;
  const eb = expenseData.breakdown;

  const salesCollections =
    ib.salesRevenue + ib.downPayment + ib.salesDueCollection;

  const totalInflow = incomeData.total;
  const purchasePayments = purchaseCashData[0]?.paidAmount || 0;
  const totalOutflow = purchasePayments + expenseData.total;

  res.status(200).json({
    success: true,
    data: {
      dateRange: { start, end },
      totalLateFees,
      inflows: {
        salesRevenue: ib.salesRevenue,
        downPayment: ib.downPayment,
        salesDueCollection: ib.salesDueCollection,
        salesCollections,
        emiCollections: ib.emiCollection,
        otherIncome: ib.otherIncome,
        total: totalInflow,
        details: incomeData.details,
      },
      outflows: {
        purchasePayments,
        cogs: eb.cogs,
        delivery: eb.delivery,
        installation: eb.installation,
        saleExpense: eb.saleExpense,
        paymentFee: eb.paymentFee,
        otherOperating: eb.otherOperating,
        operatingExpenses: expenseData.operatingExpenses,
        expenses: expenseData.total,
        total: totalOutflow,
        details: expenseData.details,
      },
      netCashFlow: totalInflow - totalOutflow,
      formulas: {
        totalInflow: 'Sales Revenue + Down Payment + Due Collections + EMI Collections + Other Income',
        totalOutflow: 'Purchase Payments + All Expenses (COGS + Operating)',
        netCashFlow: 'Total Inflow − Total Outflow',
      },
      notes: [
        'Down Payment appears only for Retail (EMI) sales — not for regular cash/wholesale sales.',
        'COGS outflows are auto-created per sale and linked to the invoice number in expense description.',
        'Purchase module payments are tracked separately and are not duplicated in the expense module.',
      ],
    },
  });
});

// @desc    Re-sync income/expense ledger from all sales (fixes misclassified entries)
// @route   POST /api/finance/resync-ledger
// @access  Private (Admin)
const resyncLedger = asyncHandler(async (req, res) => {
  const result = await resyncAllSalesLedger(req.shopId, req.user?.id);
  res.status(200).json({
    success: true,
    message: `Re-synced ledger entries for ${result.synced} sale(s).`,
    data: result,
  });
});

// @desc    Get Investor Profit Distribution
// @route   GET /api/finance/investor-distribution
// @access  Private
const getInvestorProfitDistribution = asyncHandler(async (req, res) => {
  const { month, year } = req.query;

  const m = month ? parseInt(month) - 1 : moment().month(); // 0-indexed
  const y = year ? parseInt(year) : moment().year();

  const start = moment([y, m]).startOf('month').toDate();
  const end = moment([y, m]).endOf('month').toDate();

  const plData = await calculateProfitAndLoss(req.shopId, start, end);
  const netProfit = plData.netProfit;

  const investors = await Investor.find({ isActive: true, status: 'Active' });

  // Distribute only if profit is positive
  let distributableProfit = netProfit > 0 ? netProfit : 0;
  
  const distribution = investors.map(inv => {
    return {
      investorId: inv._id,
      name: inv.name,
      investmentAmount: inv.investmentAmount,
      profitSharePercentage: inv.profitSharePercentage,
      calculatedShare: (distributableProfit * (inv.profitSharePercentage / 100))
    };
  });

  res.status(200).json({
    success: true,
    data: {
      period: { month: m + 1, year: y },
      netProfit,
      distributableProfit,
      distributions: distribution
    }
  });
});

module.exports = {
  getProfitLossStatement,
  getCashFlowStatement,
  getInvestorProfitDistribution,
  resyncLedger,
};
