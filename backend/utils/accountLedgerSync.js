const Income = require('../models/Income');
const Expense = require('../models/Expense');
const IncomeHead = require('../models/IncomeHead');
const ExpenseHead = require('../models/ExpenseHead');
const Sale = require('../models/Sale');

const INCOME_TYPES = {
  SALES_REVENUE: 'Sales Revenue',
  DOWN_PAYMENT: 'Down Payment',
  EMI_COLLECTION: 'EMI Collection',
  SALES_DUE_COLLECTION: 'Sales Due Collection',
};

const EXPENSE_TYPES = {
  COGS: 'COGS',
  DELIVERY: 'Delivery',
  INSTALLATION: 'Installation',
  SALE_EXPENSE: 'Sale Expense',
  PAYMENT_FEE: 'Payment Fee',
};

const PURCHASE_EXPENSE_HEADS = ['Purchase', 'Purchase Payment', 'Purchase Return'];

const saleAutoRefPrefix = (saleId) => `auto:sale:${saleId}`;
const saleAutoRef = (saleId, entryType) => `${saleAutoRefPrefix(saleId)}:${entryType}`;
const dueCollectionRef = (saleId, suffix) => `${saleAutoRefPrefix(saleId)}:due:${suffix}`;
const emiCollectionRef = (collectionId) => `auto:emi:${collectionId}`;

const normalizePaymentMethod = (method) => {
  const map = {
    cash: 'Cash',
    bank: 'Bank',
    card: 'Bank',
    mfs: 'Mobile Banking',
    'mobile banking': 'Mobile Banking',
  };
  if (!method) return 'Cash';
  const key = String(method).toLowerCase();
  return map[key] || (['Cash', 'Bank', 'Mobile Banking', 'Refund'].includes(method) ? method : 'Cash');
};

async function ensureIncomeHead(name, shopId, description) {
  let head = await IncomeHead.findOne({ name, shop: shopId });
  if (!head) {
    head = await IncomeHead.create({ name, description: description || name, shop: shopId });
  }
  return head;
}

async function ensureExpenseHead(name, shopId, description) {
  let head = await ExpenseHead.findOne({ name, shop: shopId });
  if (!head) {
    head = await ExpenseHead.create({ name, description: description || name, shop: shopId });
  }
  return head;
}

function computeSaleCogs(sale) {
  let cogs = sale.invoices?.customerTax?.totalPurchaseValue;
  if (cogs === undefined || cogs === null || cogs === 0) {
    cogs = (sale.items || []).reduce((sum, item) => {
      const cost = item.purchaseCost || (item.product && item.product.purchasePrice) || 0;
      return sum + (cost * (item.quantity || 0));
    }, 0);
  }
  return cogs || 0;
}

function computePaymentFees(sale) {
  return (sale.payments || []).reduce((sum, p) => sum + (p.feeAmount || 0), 0);
}

/** Down Payment applies only to retail sales sold on EMI terms */
function isEmiSale(sale) {
  return (
    sale.type === 'retail' &&
    sale.invoiceType === 'EMI' &&
    (sale.isEmi === true || Boolean(sale.emiOption?.duration))
  );
}

function getDownPaymentAmount(sale) {
  if (sale.emiOption?.downPayment != null) return sale.emiOption.downPayment;
  return sale.paidAmount || 0;
}

const SALES_INCOME_HEADS = [
  INCOME_TYPES.SALES_REVENUE,
  INCOME_TYPES.DOWN_PAYMENT,
  INCOME_TYPES.EMI_COLLECTION,
  INCOME_TYPES.SALES_DUE_COLLECTION,
];

const OPERATING_EXPENSE_HEADS = [
  EXPENSE_TYPES.DELIVERY,
  EXPENSE_TYPES.INSTALLATION,
  EXPENSE_TYPES.SALE_EXPENSE,
  EXPENSE_TYPES.PAYMENT_FEE,
];

async function clearSaleAutoEntries(saleId, shopId) {
  const prefix = saleAutoRefPrefix(saleId);
  const filter = {
    reference: { $regex: `^${prefix}` },
    ...(shopId && { shop: shopId }),
  };
  await Promise.all([
    Income.deleteMany(filter),
    Expense.deleteMany(filter),
  ]);
}

async function syncSaleLedgerEntries(saleInput, { customerName, userId, shopId } = {}) {
  const sale = saleInput?.items?.[0]?.purchaseCost !== undefined
    ? saleInput
    : await Sale.findById(saleInput._id || saleInput).populate('items.product');

  if (!sale) return;

  await clearSaleAutoEntries(sale._id, shopId);

  if (sale.status === 'Cancelled') return;

  const invoiceNumber = sale.invoiceNumber;
  const saleDate = sale.date || new Date();
  const cogs = computeSaleCogs(sale);
  const paymentFees = computePaymentFees(sale);

  const expenseRows = [];

  if (cogs > 0) {
    expenseRows.push({
      type: EXPENSE_TYPES.COGS,
      amount: cogs,
      description: invoiceNumber,
    });
  }

  if ((sale.deliveryCharge || 0) > 0 && sale.isOperatingDelivery) {
    expenseRows.push({
      type: EXPENSE_TYPES.DELIVERY,
      amount: sale.deliveryCharge,
      description: invoiceNumber,
    });
  }

  if ((sale.installationCost || 0) > 0 && sale.isOperatingInstallation) {
    expenseRows.push({
      type: EXPENSE_TYPES.INSTALLATION,
      amount: sale.installationCost,
      description: invoiceNumber,
    });
  }

  if ((sale.additionalExpense || 0) > 0 && sale.isOperatingExpense) {
    expenseRows.push({
      type: EXPENSE_TYPES.SALE_EXPENSE,
      amount: sale.additionalExpense,
      description: invoiceNumber,
    });
  }

  if (paymentFees > 0) {
    expenseRows.push({
      type: EXPENSE_TYPES.PAYMENT_FEE,
      amount: paymentFees,
      description: invoiceNumber,
    });
  }

  for (const row of expenseRows) {
    const head = await ensureExpenseHead(row.type, shopId, `Auto-synced ${row.type.toLowerCase()} from sales`);
    await Expense.create({
      expenseHead: head._id,
      name: customerName || 'Customer',
      amount: row.amount,
      date: saleDate,
      paymentMethod: normalizePaymentMethod(sale.paymentMethod),
      description: row.description,
      reference: saleAutoRef(sale._id, row.type.replace(/\s+/g, '_').toLowerCase()),
      addedBy: userId,
      shop: shopId,
    });
  }

  const incomeRows = [];

  if (isEmiSale(sale)) {
    const downPayment = getDownPaymentAmount(sale);
    if (downPayment > 0) {
      incomeRows.push({
        type: INCOME_TYPES.DOWN_PAYMENT,
        amount: downPayment,
      });
    }
  } else if ((sale.paidAmount || 0) > 0) {
    incomeRows.push({
      type: INCOME_TYPES.SALES_REVENUE,
      amount: sale.paidAmount,
    });
  }

  for (const row of incomeRows) {
    const head = await ensureIncomeHead(row.type, shopId, `Auto-synced ${row.type.toLowerCase()} from sales`);
    await Income.create({
      incomeHead: head._id,
      name: customerName || row.type,
      amount: row.amount,
      date: saleDate,
      paymentMethod: normalizePaymentMethod(sale.paymentMethod),
      description: invoiceNumber,
      reference: saleAutoRef(sale._id, row.type.replace(/\s+/g, '_').toLowerCase()),
      addedBy: userId,
      shop: shopId,
    });
  }
}

async function recordDueCollectionIncome({
  sale,
  customerName,
  amount,
  paymentMethod,
  date,
  shopId,
  userId,
  suffix,
}) {
  if (!sale || !amount || amount <= 0) return null;

  const head = await ensureIncomeHead(
    INCOME_TYPES.SALES_DUE_COLLECTION,
    shopId,
    'Collection for outstanding sales due'
  );

  const refSuffix = suffix || Date.now();
  return Income.create({
    incomeHead: head._id,
    name: customerName || INCOME_TYPES.SALES_DUE_COLLECTION,
    amount,
    date: date || new Date(),
    paymentMethod: normalizePaymentMethod(paymentMethod),
    description: sale.invoiceNumber,
    reference: dueCollectionRef(sale._id, refSuffix),
    addedBy: userId,
    shop: shopId,
  });
}

async function recordEmiCollectionIncome({
  collection,
  saleInvoiceNumber,
  customerName,
  shopId,
  userId,
}) {
  const amount = collection.collectedAmount || 0;
  if (amount <= 0) return null;

  const head = await ensureIncomeHead(
    INCOME_TYPES.EMI_COLLECTION,
    shopId,
    'EMI installment collection'
  );

  const invoiceLabel = saleInvoiceNumber || collection.invoiceNumber || 'EMI';

  return Income.create({
    incomeHead: head._id,
    name: customerName || INCOME_TYPES.EMI_COLLECTION,
    amount,
    date: collection.collectionDate || new Date(),
    paymentMethod: normalizePaymentMethod(collection.paymentMethod),
    description: invoiceLabel,
    reference: emiCollectionRef(collection._id),
    addedBy: userId,
    shop: shopId,
  });
}

async function getPurchaseExpenseHeadIds(shopId) {
  const heads = await ExpenseHead.find({
    name: { $in: PURCHASE_EXPENSE_HEADS },
    ...(shopId && { shop: shopId }),
  }).select('_id');
  return heads.map((h) => h._id);
}

async function aggregateIncomeByHead(shopId, startDate, endDate) {
  const incomeMatch = { date: { $gte: startDate, $lte: endDate } };
  if (shopId) incomeMatch.shop = shopId;

  const rows = await Income.aggregate([
    { $match: incomeMatch },
    {
      $lookup: {
        from: 'incomeheads',
        localField: 'incomeHead',
        foreignField: '_id',
        as: 'head',
      },
    },
    { $unwind: { path: '$head', preserveNullAndEmptyArrays: true } },
    { $group: { _id: '$head.name', total: { $sum: '$amount' }, count: { $sum: 1 } } },
  ]);

  const breakdown = {
    salesRevenue: 0,
    downPayment: 0,
    emiCollection: 0,
    salesDueCollection: 0,
    otherIncome: 0,
  };
  const details = [];

  rows.forEach((row) => {
    const name = row._id || 'Uncategorized';
    const amount = row.total || 0;
    details.push({ name, amount, count: row.count || 0 });

    switch (name) {
      case INCOME_TYPES.SALES_REVENUE:
        breakdown.salesRevenue += amount;
        break;
      case INCOME_TYPES.DOWN_PAYMENT:
        breakdown.downPayment += amount;
        break;
      case INCOME_TYPES.EMI_COLLECTION:
        breakdown.emiCollection += amount;
        break;
      case INCOME_TYPES.SALES_DUE_COLLECTION:
        breakdown.salesDueCollection += amount;
        break;
      default:
        breakdown.otherIncome += amount;
        break;
    }
  });

  const total =
    breakdown.salesRevenue +
    breakdown.downPayment +
    breakdown.emiCollection +
    breakdown.salesDueCollection +
    breakdown.otherIncome;

  return { breakdown, details, total };
}

async function aggregateExpenseByHead(shopId, startDate, endDate) {
  const expenseMatch = { date: { $gte: startDate, $lte: endDate } };
  if (shopId) expenseMatch.shop = shopId;

  const purchaseHeadIds = await getPurchaseExpenseHeadIds(shopId);
  if (purchaseHeadIds.length > 0) {
    expenseMatch.expenseHead = { $nin: purchaseHeadIds };
  }

  const rows = await Expense.aggregate([
    { $match: expenseMatch },
    {
      $lookup: {
        from: 'expenseheads',
        localField: 'expenseHead',
        foreignField: '_id',
        as: 'head',
      },
    },
    { $unwind: { path: '$head', preserveNullAndEmptyArrays: true } },
    { $group: { _id: '$head.name', total: { $sum: '$amount' }, count: { $sum: 1 } } },
  ]);

  const breakdown = {
    cogs: 0,
    delivery: 0,
    installation: 0,
    saleExpense: 0,
    paymentFee: 0,
    otherOperating: 0,
  };
  const details = [];

  rows.forEach((row) => {
    const name = row._id || 'Uncategorized';
    const amount = row.total || 0;
    details.push({ name, amount, count: row.count || 0 });

    switch (name) {
      case EXPENSE_TYPES.COGS:
        breakdown.cogs += amount;
        break;
      case EXPENSE_TYPES.DELIVERY:
        breakdown.delivery += amount;
        break;
      case EXPENSE_TYPES.INSTALLATION:
        breakdown.installation += amount;
        break;
      case EXPENSE_TYPES.SALE_EXPENSE:
        breakdown.saleExpense += amount;
        break;
      case EXPENSE_TYPES.PAYMENT_FEE:
        breakdown.paymentFee += amount;
        break;
      default:
        breakdown.otherOperating += amount;
        break;
    }
  });

  const operatingExpenses =
    breakdown.delivery +
    breakdown.installation +
    breakdown.saleExpense +
    breakdown.paymentFee +
    breakdown.otherOperating;
  const total = breakdown.cogs + operatingExpenses;

  return { breakdown, details, cogs: breakdown.cogs, operatingExpenses, total };
}

async function aggregateLedgerTotals(shopId, startDate, endDate) {
  const [income, expense] = await Promise.all([
    aggregateIncomeByHead(shopId, startDate, endDate),
    aggregateExpenseByHead(shopId, startDate, endDate),
  ]);

  const totalIncome = income.total;
  const cogs = expense.cogs;
  const operatingExpenses = expense.operatingExpenses;
  const totalExpense = expense.total;

  return {
    revenue: totalIncome,
    cogs,
    grossProfit: totalIncome - cogs,
    operatingExpenses,
    totalExpense,
    netProfit: totalIncome - totalExpense,
    otherIncome: income.breakdown.otherIncome,
    incomeBreakdown: income.breakdown,
    incomeDetails: income.details,
    expenseBreakdown: expense.breakdown,
    expenseDetails: expense.details,
    salesIncomeTotal:
      income.breakdown.salesRevenue +
      income.breakdown.downPayment +
      income.breakdown.emiCollection +
      income.breakdown.salesDueCollection,
  };
}

async function resyncAllSalesLedger(shopId, userId) {
  const filter = { status: { $ne: 'Cancelled' }, ...(shopId && { shop: shopId }) };
  const sales = await Sale.find(filter).populate('customer', 'contactName');
  let synced = 0;

  for (const sale of sales) {
    const customerName = sale.customer?.contactName || 'Customer';
    await syncSaleLedgerEntries(sale, { customerName, userId, shopId });
    synced += 1;
  }

  return { synced };
}

module.exports = {
  INCOME_TYPES,
  EXPENSE_TYPES,
  PURCHASE_EXPENSE_HEADS,
  ensureIncomeHead,
  ensureExpenseHead,
  clearSaleAutoEntries,
  syncSaleLedgerEntries,
  recordDueCollectionIncome,
  recordEmiCollectionIncome,
  getPurchaseExpenseHeadIds,
  aggregateLedgerTotals,
  aggregateIncomeByHead,
  aggregateExpenseByHead,
  resyncAllSalesLedger,
  SALES_INCOME_HEADS,
  OPERATING_EXPENSE_HEADS,
  computeSaleCogs,
  computePaymentFees,
  isEmiSale,
};
