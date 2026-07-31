const Account = require('../models/Account');
const Income = require('../models/Income');
const Expense = require('../models/Expense');
const asyncHandler = require('express-async-handler');

// @desc    Get all accounts
// @route   GET /api/accounts
// @access  Private
const getAccounts = asyncHandler(async (req, res) => {
  const shopFilter = req.shopId ? { shop: req.shopId } : {};
  const accounts = await Account.find(shopFilter).sort({ createdAt: -1 });

  // Get totals for all accounts via aggregation
  const incomeTotals = await Income.aggregate([
    { $match: shopFilter },
    { $group: { _id: '$accountId', total: { $sum: '$amount' } } }
  ]);
  const expenseTotals = await Expense.aggregate([
    { $match: shopFilter },
    { $group: { _id: '$accountId', total: { $sum: '$amount' } } }
  ]);

  const incomeMap = incomeTotals.reduce((map, item) => {
    if (item._id) map[item._id.toString()] = item.total;
    return map;
  }, {});
  
  const expenseMap = expenseTotals.reduce((map, item) => {
    if (item._id) map[item._id.toString()] = item.total;
    return map;
  }, {});

  const accountsWithBalance = accounts.map(account => {
    const acc = account.toObject();
    const inc = incomeMap[acc._id.toString()] || 0;
    const exp = expenseMap[acc._id.toString()] || 0;
    acc.currentBalance = (acc.openingBalance || 0) + inc - exp;
    return acc;
  });

  res.status(200).json({
    success: true,
    count: accountsWithBalance.length,
    data: accountsWithBalance
  });
});

// @desc    Get single account
// @route   GET /api/accounts/:id
// @access  Private
const getAccount = asyncHandler(async (req, res) => {
  const account = await Account.findOne({
    _id: req.params.id,
    shop: req.shopId
  });

  if (!account) {
    return res.status(404).json({ 
      success: false,
      message: `Account not found with id ${req.params.id}` 
    });
  }

  res.status(200).json({
    success: true,
    data: account
  });
});

// @desc    Create account
// @route   POST /api/accounts
// @access  Private
const createAccount = asyncHandler(async (req, res) => {
  const accountData = {
    ...req.body,
    ...(req.shopId && { shop: req.shopId })
  };
  const account = await Account.create(accountData);

  res.status(201).json({
    success: true,
    data: account
  });
});

// @desc    Update account
// @route   PUT /api/accounts/:id
// @access  Private
const updateAccount = asyncHandler(async (req, res) => {
  let account = await Account.findOne({
    _id: req.params.id,
    shop: req.shopId
  });

  if (!account) {
    return res.status(404).json({ 
      success: false,
      message: `Account not found with id ${req.params.id}` 
    });
  }

  // Update account
  account = await Account.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: account
  });
});

// @desc    Delete account
// @route   DELETE /api/accounts/:id
// @access  Private
const deleteAccount = asyncHandler(async (req, res) => {
  const account = await Account.findOne({
    _id: req.params.id,
    shop: req.shopId
  });

  if (!account) {
    return res.status(404).json({ 
      success: false,
      message: `Account not found with id ${req.params.id}` 
    });
  }

  await account.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get account balance
// @route   GET /api/accounts/:id/balance
// @access  Private
const getAccountBalance = asyncHandler(async (req, res) => {
  const account = await Account.findOne({
    _id: req.params.id,
    shop: req.shopId
  });

  if (!account) {
    return res.status(404).json({ 
      success: false,
      message: `Account not found with id ${req.params.id}` 
    });
  }

  // Calculate balance based on income and expenses
  const income = await Income.find({ accountId: account._id, shop: req.shopId });
  const expense = await Expense.find({ accountId: account._id, shop: req.shopId });
  
  const totalIncome = income.reduce((sum, inc) => sum + inc.amount, 0);
  const totalExpense = expense.reduce((sum, exp) => sum + exp.amount, 0);
  
  const balance = account.openingBalance + totalIncome - totalExpense;

  res.status(200).json({
    success: true,
    data: {
      account: account.name,
      balance: balance,
      openingBalance: account.openingBalance,
      totalIncome,
      totalExpense,
      type: account.type
    }
  });
});

// @desc    Get account transactions (income + expense log)
// @route   GET /api/accounts/:id/transactions
// @access  Private
const getAccountTransactions = asyncHandler(async (req, res) => {
  const account = await Account.findOne({
    _id: req.params.id,
    shop: req.shopId
  });

  if (!account) {
    return res.status(404).json({
      success: false,
      message: `Account not found with id ${req.params.id}`
    });
  }

  const [incomes, expenses] = await Promise.all([
    Income.find({ accountId: account._id, shop: req.shopId })
      .populate('incomeHead', 'name')
      .populate('addedBy', 'name')
      .sort({ date: -1 }),
    Expense.find({ accountId: account._id, shop: req.shopId })
      .populate('expenseHead', 'name')
      .populate('addedBy', 'name')
      .sort({ date: -1 })
  ]);

  const totalIncome = incomes.reduce((s, r) => s + r.amount, 0);
  const totalExpense = expenses.reduce((s, r) => s + r.amount, 0);
  const currentBalance = account.openingBalance + totalIncome - totalExpense;

  // Merge and tag
  const transactions = [
    ...incomes.map(r => ({ ...r.toObject(), _type: 'income', head: r.incomeHead })),
    ...expenses.map(r => ({ ...r.toObject(), _type: 'expense', head: r.expenseHead }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  res.status(200).json({
    success: true,
    data: {
      account,
      openingBalance: account.openingBalance,
      totalIncome,
      totalExpense,
      currentBalance,
      transactions
    }
  });
});

module.exports = {
  getAccounts,
  getAccount,
  createAccount,
  updateAccount,
  deleteAccount,
  getAccountBalance,
  getAccountTransactions
};