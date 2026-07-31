const Investor = require('../models/Investor');
const User = require('../models/User');
const ProfitDistribution = require('../models/ProfitDistribution');
const Sale = require('../models/Sale');
const Purchase = require('../models/Purchase');
const Expense = require('../models/Expense');
const Income = require('../models/Income');
const ExpenseHead = require('../models/ExpenseHead');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const {
  aggregateLedgerTotals,
  getPurchaseExpenseHeadIds,
  EXPENSE_TYPES,
} = require('../utils/accountLedgerSync');

async function buildDailyProfitForMonth(year, month, shopId = null) {
  const targetMonthStart = new Date(year, month - 1, 1);
  const targetMonthEnd = new Date(year, month, 0, 23, 59, 59, 999);
  const targetMatchStage = {
    date: { $gte: targetMonthStart, $lte: targetMonthEnd },
    ...(shopId && { shop: shopId }),
  };

  const purchaseHeadIds = await getPurchaseExpenseHeadIds(shopId);
  const cogsHead = await ExpenseHead.findOne({
    name: EXPENSE_TYPES.COGS,
    ...(shopId && { shop: shopId }),
  });

  const expenseMatch = { ...targetMatchStage };
  if (purchaseHeadIds.length > 0) {
    expenseMatch.expenseHead = { $nin: purchaseHeadIds };
  }

  const [targetIncomeAgg, targetCogsAgg, targetOperatingAgg] = await Promise.all([
    Income.aggregate([
      { $match: targetMatchStage },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$date', timezone: 'Asia/Dhaka' } }, total: { $sum: '$amount' } } },
    ]).catch(() => []),
    cogsHead
      ? Expense.aggregate([
          { $match: { ...expenseMatch, expenseHead: cogsHead._id } },
          { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$date', timezone: 'Asia/Dhaka' } }, total: { $sum: '$amount' } } },
        ]).catch(() => [])
      : [],
    cogsHead
      ? Expense.aggregate([
          { $match: { ...expenseMatch, expenseHead: { $ne: cogsHead._id } } },
          { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$date', timezone: 'Asia/Dhaka' } }, total: { $sum: '$amount' } } },
        ]).catch(() => [])
      : Expense.aggregate([
          { $match: expenseMatch },
          { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$date', timezone: 'Asia/Dhaka' } }, total: { $sum: '$amount' } } },
        ]).catch(() => []),
  ]);

  const dailyProfitMap = {};
  const daysInTargetMonth = new Date(year, month, 0).getDate();

  for (let i = 1; i <= daysInTargetMonth; i++) {
    const dayStr = `${year}-${String(month).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    dailyProfitMap[dayStr] = {
      date: dayStr,
      day: i,
      revenue: 0,
      cost: 0,
      expenses: 0,
      otherIncome: 0,
      netProfit: 0,
    };
  }

  targetIncomeAgg.forEach(item => {
    if (item?._id && dailyProfitMap[item._id]) dailyProfitMap[item._id].revenue += item.total || 0;
  });
  targetCogsAgg.forEach(item => {
    if (item?._id && dailyProfitMap[item._id]) dailyProfitMap[item._id].cost += item.total || 0;
  });
  targetOperatingAgg.forEach(item => {
    if (item?._id && dailyProfitMap[item._id]) dailyProfitMap[item._id].expenses += item.total || 0;
  });

  Object.values(dailyProfitMap).forEach(day => {
    day.netProfit = day.revenue - day.cost - day.expenses;
    day.otherIncome = 0;
  });

  return Object.values(dailyProfitMap).sort((a, b) => a.day - b.day);
}

function buildCumulativeProfitGrowth(dailyProfit, sharePercentage) {
  const currentDay = new Date().getDate();
  let cumulative = 0;

  const data = dailyProfit
    .filter(d => d.day <= currentDay)
    .map(d => {
      const dailyShare = (d.netProfit * sharePercentage) / 100;
      cumulative += dailyShare;
      return {
        day: d.day,
        date: d.date,
        label: String(d.day),
        dailyProfit: dailyShare,
        cumulativeProfit: cumulative
      };
    });

  return {
    data,
    currentTotalProfit: cumulative
  };
}

async function buildMonthlyProfitGrowth(sharePercentage) {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  try {
    const dailyProfit = await buildDailyProfitForMonth(year, month);
    const growth = buildCumulativeProfitGrowth(dailyProfit, sharePercentage);

    return {
      month,
      year,
      monthLabel: new Date(year, month - 1, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' }),
      currentTotalProfit: growth.currentTotalProfit,
      data: growth.data
    };
  } catch (error) {
    console.error('Failed to build monthly profit growth:', error);
    return {
      month,
      year,
      monthLabel: new Date(year, month - 1, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' }),
      currentTotalProfit: 0,
      data: []
    };
  }
}

// ==================== INVESTOR CRUD ====================

exports.getAllInvestors = async (req, res) => {
  try {
    // Get all investor records
    const investorRecords = await Investor.find({ isActive: true })
      .populate('userId', 'name email phone role isActive')
      .sort({ createdAt: -1 })
      .lean();

    // Get all users with Investor role
    const investorUsers = await User.find({ role: 'Investor' }, 'name email phone role isActive createdAt').lean();

    // Find users that already have an investor record
    const linkedUserIds = new Set(
      investorRecords
        .map(inv => inv.userId?._id?.toString() || inv.userId?.toString())
        .filter(Boolean)
    );

    // Users with Investor role but no investor record — show them too
    const unlinkedUsers = investorUsers.filter(u => !linkedUserIds.has(u._id.toString()));

    const totalInvestmentPool = investorRecords.reduce((sum, inv) => sum + (inv.investmentAmount || 0), 0);

    const processedInvestors = investorRecords.map(inv => {
      const dynamicSharePercentage = totalInvestmentPool > 0 ? (inv.investmentAmount / totalInvestmentPool) * 100 : 0;
      return {
        ...inv,
        availableBalance: Math.max(0, (inv.totalProfitEarned || 0) - (inv.totalWithdrawn || 0)),
        profitSharePercentage: dynamicSharePercentage
      };
    });

    // Merge unlinked investor-role users as placeholder entries
    const placeholders = unlinkedUsers.map(u => ({
      _id: null,
      userId: u,
      name: u.name,
      email: u.email,
      phone: u.phone,
      investmentAmount: 0,
      profitSharePercentage: 0,
      totalProfitEarned: 0,
      totalWithdrawn: 0,
      availableBalance: 0,
      status: 'Active',
      isActive: true,
      investedDate: u.createdAt,
      isPlaceholder: true
    }));

    res.json({
      success: true,
      data: [...processedInvestors, ...placeholders]
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching investors', error: error.message });
  }
};

exports.createInvestor = async (req, res) => {
  try {
    const { name, email, phone, password, investmentAmount, profitSharePercentage, investedDate, notes } = req.body;

    const trimmedName = (name || '').trim();
    const trimmedEmail = (email || '').trim().toLowerCase();
    const trimmedPhone = (phone || '').trim();
    const parsedAmount = Number(investmentAmount);

    if (!trimmedName || !trimmedEmail || !trimmedPhone || isNaN(parsedAmount) || parsedAmount < 0) {
      return res.status(400).json({ success: false, message: 'Name, email, phone, and a valid investment amount are required' });
    }

    // Check if user with this email or phone already exists (case-insensitive)
    let existingUser = await User.findOne({
      $or: [
        { email: trimmedEmail },
        { phone: trimmedPhone }
      ]
    });
    
    if (existingUser) {
      // If user exists, check for an active investor record
      const existingInvestor = await Investor.findOne({ userId: existingUser._id, isActive: true });
      if (existingInvestor) {
        return res.status(400).json({ success: false, message: 'An active investor profile already exists for this user' });
      }
      
      // Upgrade existing user to Investor
      existingUser.name = trimmedName;
      existingUser.email = trimmedEmail;
      existingUser.phone = trimmedPhone;
      if (password) existingUser.password = password;
      existingUser.role = 'Investor';
      existingUser.isActive = true;
      existingUser.isApproved = true;
      existingUser.approvalStatus = 'Approved';
      await existingUser.save();
    } else {
      if (!password) {
        return res.status(400).json({ success: false, message: 'Password is required for new accounts' });
      }
      // 1. Create the User account for this investor
      existingUser = await User.create({
        name: trimmedName,
        email: trimmedEmail,
        phone: trimmedPhone,
        password, // will be hashed by pre-save hook
        role: 'Investor',
        isActive: true,
        isApproved: true,
        approvalStatus: 'Approved'
      });
    }

    // 2. Create the Investor record linked to the user
    const investor = await Investor.create({
      userId: existingUser._id,
      name: trimmedName,
      email: trimmedEmail,
      phone: trimmedPhone,
      investmentAmount: parsedAmount,
      profitSharePercentage: 0, // No longer used, dynamically calculated
      investedDate: investedDate || new Date(),
      notes,
      status: 'Active',
      isActive: true
    });

    res.status(201).json({ success: true, message: 'Investor account created successfully', data: investor });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue || {})[0];
      return res.status(400).json({ success: false, message: `A user with this ${field || 'email or phone'} already exists` });
    }
    res.status(500).json({ success: false, message: 'Error creating investor', error: error.message });
  }
};

exports.getInvestorById = async (req, res) => {
  try {
    const investor = await Investor.findById(req.params.id).populate('userId', 'name email phone').lean();
    if (!investor) return res.status(404).json({ success: false, message: 'Investor not found' });
    investor.availableBalance = Math.max(0, (investor.totalProfitEarned || 0) - (investor.totalWithdrawn || 0));
    
    // Dynamic percentage
    const activeInvestors = await Investor.find({ isActive: true, status: 'Active' });
    const totalInvestmentPool = activeInvestors.reduce((sum, i) => sum + (i.investmentAmount || 0), 0);
    investor.profitSharePercentage = totalInvestmentPool > 0 ? (investor.investmentAmount / totalInvestmentPool) * 100 : 0;
    
    res.json({ success: true, data: investor });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching investor', error: error.message });
  }
};

exports.updateInvestor = async (req, res) => {
  try {
    const investor = await Investor.findById(req.params.id);
    if (!investor) return res.status(404).json({ success: false, message: 'Investor not found' });

    const { name, email, phone, investmentAmount, profitSharePercentage, investedDate, notes, status } = req.body;

    // Update the Investor record
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (email !== undefined) updates.email = email;
    if (phone !== undefined) updates.phone = phone;
    if (investmentAmount !== undefined) updates.investmentAmount = Number(investmentAmount);
    if (investedDate !== undefined) updates.investedDate = investedDate;
    if (notes !== undefined) updates.notes = notes;
    if (status !== undefined) updates.status = status;

    const updatedInvestor = await Investor.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });

    // Also sync name/email/phone to the linked User account
    if (investor.userId && (name || email || phone)) {
      const userUpdates = {};
      if (name) userUpdates.name = name;
      if (email) userUpdates.email = email;
      if (phone) userUpdates.phone = phone;
      await User.findByIdAndUpdate(investor.userId, userUpdates);
    }

    res.json({ success: true, message: 'Investor updated successfully', data: updatedInvestor });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating investor', error: error.message });
  }
};

exports.deleteInvestor = async (req, res) => {
  try {
    const investor = await Investor.findById(req.params.id);
    if (!investor) return res.status(404).json({ success: false, message: 'Investor not found' });

    investor.isActive = false;
    investor.status = 'Closed';
    await investor.save();

    // Also deactivate the linked user
    if (investor.userId) {
      await User.findByIdAndUpdate(investor.userId, { isActive: false });
    }

    res.json({ success: true, message: 'Investor removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting investor', error: error.message });
  }
};

exports.changeInvestorPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const investor = await Investor.findById(req.params.id);
    if (!investor) return res.status(404).json({ success: false, message: 'Investor not found' });
    if (!investor.userId) return res.status(400).json({ success: false, message: 'This investor has no linked user account' });

    const user = await User.findById(investor.userId).select('+password');
    if (!user) return res.status(404).json({ success: false, message: 'Linked user account not found' });

    user.password = newPassword; // pre-save hook will hash it
    await user.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error changing password', error: error.message });
  }
};

// ==================== DASHBOARD & STATS ====================

exports.getInvestorStats = async (req, res) => {
  try {
    const overallStats = await Investor.aggregate([
      { $match: { isActive: true, status: 'Active' } },
      { $group: {
          _id: null,
          totalInvestors: { $sum: 1 },
          totalInvestment: { $sum: '$investmentAmount' },
          totalProfitEarned: { $sum: '$totalProfitEarned' },
          totalWithdrawn: { $sum: '$totalWithdrawn' }
      }}
    ]);

    const stats = overallStats[0] || { totalInvestors: 0, totalInvestment: 0, totalProfitEarned: 0, totalWithdrawn: 0 };
    res.json({ success: true, data: { overall: stats } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching stats', error: error.message });
  }
};

exports.getInvestorDashboard = async (req, res) => {
  try {
    let investor;
    if (req.params.id === 'my') {
      investor = await Investor.findOne({ userId: req.user.id, isActive: true }).lean();
    } else {
      investor = await Investor.findById(req.params.id).lean();
    }

    if (!investor) {
      // Try to find investor by userId (for users with Investor role who have an investor record)
      investor = await Investor.findOne({ userId: req.params.id === 'my' ? req.user.id : req.params.id }).lean();
    }

    if (!investor) {
      return res.status(404).json({ success: false, message: 'Investor profile not found. Please contact your administrator.' });
    }

    // Restrict access — investors can only see their own dashboard
    if (req.user.role === 'Investor' && investor.userId?.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this dashboard' });
    }

    investor.availableBalance = Math.max(0, (investor.totalProfitEarned || 0) - (investor.totalWithdrawn || 0));

    const activeInvestors = await Investor.find({ isActive: true, status: 'Active' });
    const totalInvestmentPool = activeInvestors.reduce((sum, i) => sum + (i.investmentAmount || 0), 0);
    investor.profitSharePercentage = totalInvestmentPool > 0 ? (investor.investmentAmount / totalInvestmentPool) * 100 : 0;

    const withdrawalRequests = investor.withdrawalRequests || [];

    const profitHistory = await ProfitDistribution.find({
      'distributions.investor': investor._id,
      status: 'Finalized'
    }).sort({ 'period.year': -1, 'period.month': -1 }).limit(12).lean();

    const formattedProfitHistory = profitHistory.map(pd => {
      const dist = pd.distributions.find(d => d.investor.toString() === investor._id.toString());
      return {
        id: pd._id,
        period: `${pd.period.month}/${pd.period.year}`,
        netProfit: pd.netProfit,
        sharePercentage: dist?.sharePercentage || investor.profitSharePercentage || 0,
        profitEarned: dist?.profitAmount || 0,
        finalizedAt: pd.finalizedAt
      };
    });

    const profitGrowth = await buildMonthlyProfitGrowth(investor.profitSharePercentage || 0);

    res.json({
      success: true,
      data: {
        investor,
        profitHistory: formattedProfitHistory,
        profitGrowth,
        withdrawalRequests: withdrawalRequests.sort((a, b) => new Date(b.requestDate) - new Date(a.requestDate))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching dashboard', error: error.message });
  }
};

exports.getDemoInvestorView = async (req, res) => {
  try {
    const stats = await Investor.aggregate([
      { $match: { isActive: true, status: 'Active' } },
      { $group: {
          _id: null,
          totalInvestment: { $sum: '$investmentAmount' },
          totalProfitEarned: { $sum: '$totalProfitEarned' },
          totalWithdrawn: { $sum: '$totalWithdrawn' }
      }}
    ]);

    const globalStats = stats[0] || { totalInvestment: 0, totalProfitEarned: 0, totalWithdrawn: 0 };

    const simulatedInvestor = {
      _id: 'demo-investor',
      name: 'Demo — All Investors',
      investmentAmount: globalStats.totalInvestment,
      profitSharePercentage: 100,
      totalProfitEarned: globalStats.totalProfitEarned,
      totalWithdrawn: globalStats.totalWithdrawn,
      availableBalance: Math.max(0, globalStats.totalProfitEarned - globalStats.totalWithdrawn),
      status: 'Active',
      investedDate: new Date('2025-01-01')
    };

    const profitGrowth = await buildMonthlyProfitGrowth(100);

    res.json({
      success: true,
      data: { investor: simulatedInvestor, profitHistory: [], profitGrowth, withdrawalRequests: [], isDemo: true }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error loading demo view', error: error.message });
  }
};

// ==================== BUSINESS REPORTS ====================

exports.getBusinessReports = async (req, res) => {
  try {
    const now = new Date();

    const { targetMonth, targetYear } = req.query;
    const selectedMonth = targetMonth ? parseInt(targetMonth) : now.getMonth() + 1;
    const selectedYear = targetYear ? parseInt(targetYear) : now.getFullYear();
    const shopId = req.shopId ? new mongoose.Types.ObjectId(req.shopId) : null;
    const shopFilter = shopId ? { shop: shopId } : {};

    // --- Daily Sales + Monthly Sales — parallel ---
    const dailyMonthStart = new Date(selectedYear, selectedMonth - 1, 1);
    const dailyMonthEnd = new Date(selectedYear, selectedMonth, 0, 23, 59, 59, 999);
    const twelveMonthsStart = new Date(selectedYear, selectedMonth - 12, 1);

    const [dailySales, monthlySales] = await Promise.all([
      Sale.aggregate([
        { $match: { date: { $gte: dailyMonthStart, $lte: dailyMonthEnd }, ...shopFilter } },
        { $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
            totalAmount: { $sum: '$total' },
            count: { $sum: 1 }
        }},
        { $sort: { _id: -1 } },
      ]),
      Sale.aggregate([
        { $match: { date: { $gte: twelveMonthsStart, $lte: dailyMonthEnd }, ...shopFilter } },
        { $group: {
            _id: {
              year: { $year: '$date' },
              month: { $month: '$date' }
            },
            totalRevenue: { $sum: '$total' },
            count: { $sum: 1 }
        }},
        { $sort: { '_id.year': -1, '_id.month': -1 } },
        { $limit: 12 }
      ])
    ]);

    // --- Monthly Profit (12 months ending at selected month, from ledger) — all parallel ---
    const monthRanges = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(selectedYear, selectedMonth - 1 - i, 1);
      return {
        year: d.getFullYear(),
        month: d.getMonth() + 1,
        monthStart: new Date(d.getFullYear(), d.getMonth(), 1),
        monthEnd: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999),
      };
    });

    const ledgerResults = await Promise.all(
      monthRanges.map(({ monthStart, monthEnd }) =>
        aggregateLedgerTotals(shopId, monthStart, monthEnd)
      )
    );

    const monthlyProfitData = monthRanges.map(({ year, month }, i) => {
      const ledger = ledgerResults[i];
      return {
        year,
        month,
        period: `${month}/${year}`,
        revenue: ledger.revenue,
        cost: ledger.cogs,
        expenses: ledger.operatingExpenses,
        otherIncome: ledger.otherIncome,
        grossProfit: ledger.grossProfit,
        netProfit: ledger.netProfit,
      };
    });

    // --- Daily Profit (for selected month, from ledger) ---
    const dailyProfit = await buildDailyProfitForMonth(selectedYear, selectedMonth, shopId);

    // --- Investor Profit Share (active investors only) ---
    const cumulativeNetProfit = monthlyProfitData.reduce((sum, m) => sum + (m.netProfit || 0), 0);
    const activeInvestors = await Investor.find({ isActive: true, status: 'Active' }).lean();
    const investorProfitShares = activeInvestors.map(inv => ({
      _id: inv._id,
      name: inv.name,
      investmentAmount: inv.investmentAmount,
      profitSharePercentage: inv.profitSharePercentage,
      totalProfitEarned: inv.totalProfitEarned || 0,
      totalWithdrawn: inv.totalWithdrawn || 0,
      calculatedProfitShare: cumulativeNetProfit > 0
        ? cumulativeNetProfit * (inv.profitSharePercentage / 100)
        : 0,
      availableProfit: Math.max(0, (inv.totalProfitEarned || 0) - (inv.totalWithdrawn || 0)),
    }));

    res.json({
      success: true,
      data: {
        dailySales,
        monthlySales,
        monthlyProfit: monthlyProfitData,
        dailyProfit,
        selectedPeriod: { month: selectedMonth, year: selectedYear },
        cumulativeNetProfit,
        investorProfitShares,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching business reports', error: error.message });
  }
};

// ==================== WITHDRAWAL LOGIC ====================

exports.requestWithdrawal = async (req, res) => {
  try {
    const { amount, type, note, investorId } = req.body;

    let targetInvestorId = investorId;
    if (!targetInvestorId) {
      const inv = await Investor.findOne({ userId: req.user.id, isActive: true });
      if (!inv) return res.status(404).json({ success: false, message: 'Investor profile not found for your account' });
      targetInvestorId = inv._id;
    }

    const investor = await Investor.findById(targetInvestorId);
    if (!investor) return res.status(404).json({ success: false, message: 'Investor not found' });

    if (type === 'Profit') {
      const available = Math.max(0, (investor.totalProfitEarned || 0) - (investor.totalWithdrawn || 0));
      if (amount > available) {
        return res.status(400).json({ success: false, message: `Cannot withdraw more than available profit (৳${available})` });
      }
    } else if (type === 'Capital') {
      if (amount > investor.investmentAmount) {
        return res.status(400).json({ success: false, message: `Cannot withdraw more than invested capital (৳${investor.investmentAmount})` });
      }
    }

    const request = { amount, type, note, status: 'Pending', requestDate: new Date() };
    investor.withdrawalRequests.push(request);
    await investor.save();

    res.status(200).json({ success: true, message: 'Withdrawal request submitted', data: request });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error submitting request', error: error.message });
  }
};

exports.handleWithdrawalRequest = async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    const { investorId, requestId } = req.params;

    const investor = await Investor.findById(investorId);
    if (!investor) return res.status(404).json({ success: false, message: 'Investor not found' });

    const request = investor.withdrawalRequests.id(requestId);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
    if (request.status !== 'Pending') return res.status(400).json({ success: false, message: 'Request already processed' });

    if (status === 'Approved') {
      if (request.type === 'Profit') {
        investor.totalWithdrawn = (investor.totalWithdrawn || 0) + request.amount;
      } else if (request.type === 'Capital') {
        investor.investmentAmount = Math.max(0, investor.investmentAmount - request.amount);
      }
      request.status = 'Approved';
      request.processedDate = new Date();
    } else if (status === 'Rejected') {
      request.status = 'Rejected';
      request.processedDate = new Date();
    }

    if (adminNote) request.adminNote = adminNote;
    await investor.save();

    res.json({ success: true, message: `Request ${status.toLowerCase()}`, data: request });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error handling request', error: error.message });
  }
};

exports.getWithdrawalRequests = async (req, res) => {
  try {
    const investors = await Investor.find({ 'withdrawalRequests.0': { $exists: true } }, 'name email phone withdrawalRequests').lean();

    let allRequests = [];
    investors.forEach(inv => {
      inv.withdrawalRequests.forEach(wr => {
        allRequests.push({
          ...wr,
          investor: { _id: inv._id, name: inv.name, phone: inv.phone }
        });
      });
    });

    allRequests.sort((a, b) => new Date(b.requestDate) - new Date(a.requestDate));
    res.json({ success: true, data: allRequests });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching withdrawal requests', error: error.message });
  }
};

// ==================== PROFIT DISTRIBUTION ====================

exports.calculateProfitDistribution = async (req, res) => {
  try {
    const { month, year } = req.query;
    if (!month || !year) return res.status(400).json({ success: false, message: 'Month and year required' });

    const m = parseInt(month);
    const y = parseInt(year);
    const startDate = new Date(y, m - 1, 1);
    const endDate = new Date(y, m, 0, 23, 59, 59, 999);
    const daysInMonth = new Date(y, m, 0).getDate();

    const ledger = await aggregateLedgerTotals(req.shopId || null, startDate, endDate);
    const totalSalesRevenue = ledger.revenue;
    const totalPurchaseCost = ledger.cogs;
    const totalExpenses = ledger.totalExpense;
    const totalOtherIncome = ledger.otherIncome;
    const grossProfit = ledger.grossProfit;
    const netProfit = ledger.netProfit;

    const activeInvestors = await Investor.find({ isActive: true, status: 'Active' });
    const totalInvestmentPool = activeInvestors.reduce((sum, inv) => sum + (inv.investmentAmount || 0), 0);

    const distributions = [];
    for (const inv of activeInvestors) {
      const joinDate = new Date(inv.investedDate);
      let daysActive = daysInMonth;
      if (joinDate > endDate) daysActive = 0;
      else if (joinDate > startDate) daysActive = daysInMonth - joinDate.getDate() + 1;

      if (daysActive === 0) continue;

      const dynamicSharePercentage = totalInvestmentPool > 0 ? (inv.investmentAmount / totalInvestmentPool) * 100 : 0;
      const prorationFactor = daysActive / daysInMonth;
      const effectiveSharePercentage = dynamicSharePercentage * prorationFactor;
      const profitAmount = (netProfit * effectiveSharePercentage) / 100;

      distributions.push({
        investor: inv._id,
        investorName: inv.name,
        sharePercentage: Math.round(effectiveSharePercentage * 100) / 100,
        adminSetPercentage: Math.round(dynamicSharePercentage * 100) / 100,
        daysActive,
        profitAmount: Math.round(profitAmount)
      });
    }

    res.json({
      success: true,
      data: {
        period: { month: m, year: y },
        totalSalesRevenue, totalPurchaseCost, totalExpenses, totalOtherIncome,
        grossProfit, netProfit,
        distributions
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error calculating profit distribution', error: error.message });
  }
};

exports.finalizeProfitDistribution = async (req, res) => {
  try {
    const { period, totalSalesRevenue, totalPurchaseCost, totalExpenses, totalOtherIncome, grossProfit, netProfit, distributions } = req.body;

    const existing = await ProfitDistribution.findOne({ 'period.month': period.month, 'period.year': period.year });
    if (existing) return res.status(400).json({ success: false, message: 'Profit distribution for this period already exists' });

    const m = parseInt(period.month);
    const y = parseInt(period.year);

    const distributionDoc = new ProfitDistribution({
      period: { month: m, year: y },
      startDate: new Date(y, m - 1, 1),
      endDate: new Date(y, m, 0, 23, 59, 59, 999),
      totalSalesRevenue, totalPurchaseCost, totalExpenses, totalOtherIncome,
      grossProfit, netProfit,
      distributions: distributions.map(d => ({
        investor: d.investor,
        sharePercentage: d.sharePercentage,
        profitAmount: d.profitAmount
      })),
      status: 'Finalized',
      createdBy: req.user.id,
      finalizedAt: new Date()
    });

    await distributionDoc.save();

    for (const dist of distributions) {
      await Investor.findByIdAndUpdate(dist.investor, { $inc: { totalProfitEarned: dist.profitAmount } });
    }

    res.json({ success: true, message: 'Profit distribution finalized', data: distributionDoc });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ success: false, message: 'Distribution for this month already exists' });
    res.status(500).json({ success: false, message: 'Error finalizing distribution', error: error.message });
  }
};

exports.getProfitDistributions = async (req, res) => {
  try {
    const distributions = await ProfitDistribution.find().sort({ 'period.year': -1, 'period.month': -1 }).lean();
    res.json({ success: true, data: distributions });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching distributions', error: error.message });
  }
};
