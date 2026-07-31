const Purchase = require('../models/Purchase');
const Inventory = require('../models/Inventory');

const Expense = require('../models/Expense');
const ExpenseHead = require('../models/ExpenseHead');
const Supplier = require('../models/Supplier');
const asyncHandler = require('express-async-handler');

// @desc    Get purchase reports summary
// @route   GET /api/purchases/reports/summary
// @access  Private
const getPurchaseReportsSummary = asyncHandler(async (req, res) => {
  const shopFilter = req.shopId 
    ? { 
        $or: [
          { shop: req.shopId },
          { shop: null },
          { shop: { $exists: false } }
        ] 
      } 
    : {};

  // Total Purchases
  const allPurchasesCount = await Purchase.countDocuments(shopFilter);

  // Due Purchases
  const duePurchasesCount = await Purchase.countDocuments({ ...shopFilter, dueAmount: { $gt: 0 } });

  // Total Suppliers
  const suppliersCount = await Supplier.countDocuments(req.shopId ? { shop: req.shopId } : {});

  // For product-wise, it's just the total count of purchased items/products, but we can return total purchases or 0 for now.
  // Same for purchase returns since they are placeholders.

  res.status(200).json({
    success: true,
    data: {
      allPurchases: allPurchasesCount,
      productWise: allPurchasesCount,
      supplierLedger: suppliersCount,
      due: duePurchasesCount,
      returns: 0
    }
  });
});

// @desc    Get all purchases
// @route   GET /api/purchases
// @access  Private
const getPurchases = asyncHandler(async (req, res) => {
  const shopFilter = req.shopId 
    ? { 
        $or: [
          { shop: req.shopId },
          { shop: null },
          { shop: { $exists: false } }
        ] 
      } 
    : {};
  const purchases = await Purchase.find(shopFilter)
    .populate('supplier', 'name contactNumber')
    .populate('items.product', 'name')
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({
    success: true,
    count: purchases.length,
    data: purchases
  });
});

// @desc    Get single purchase
// @route   GET /api/purchases/:id
// @access  Private
const getPurchase = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };
  if (req.shopId) {
    query.$or = [
      { shop: req.shopId },
      { shop: null },
      { shop: { $exists: false } }
    ];
  }
  const purchase = await Purchase.findOne(query)
    .populate('supplier', 'name contactNumber')
    .populate('items.product', 'name trackSerials sku');

  if (!purchase) {
    return res.status(404).json({ 
      success: false,
      message: `Purchase not found with id ${req.params.id}` 
    });
  }

  res.status(200).json({
    success: true,
    data: purchase
  });
});

// @desc    Create purchase
// @route   POST /api/purchases
// @access  Private
const createPurchase = asyncHandler(async (req, res) => {
  const {
    purchaseNumber,
    challanNumber,
    supplier,
    items,
    subTotal,
    discount,
    tax,
    total,
    paidAmount,
    dueAmount,
    paymentMethod,
    status,
    note,
    date,
    shippingAddress
  } = req.body;

  // Create purchase
  const purchase = await Purchase.create({
    purchaseNumber,
    challanNumber,
    supplier,
    items,
    subTotal,
    discount,
    tax,
    total,
    paidAmount,
    dueAmount,
    paymentMethod,
    status,
    note,
    date,
    shippingAddress,
    shop: req.shopId
  });



  // Update supplier's total due
  if (dueAmount > 0) {
    const supplierQuery = { _id: supplier };
    if (req.shopId) {
      supplierQuery.$or = [
        { shop: req.shopId },
        { shop: null },
        { shop: { $exists: false } }
      ];
    }
    const supplierDoc = await Supplier.findOne(supplierQuery);
    if (supplierDoc) {
      supplierDoc.totalDue += dueAmount;
      await supplierDoc.save();
    }
  }

  // Purchase payments are tracked on the purchase module only — not duplicated in expenses (COGS is recorded per sale).

  res.status(201).json({
    success: true,
    data: purchase
  });
});

// @desc    Update purchase
// @route   PUT /api/purchases/:id
// @access  Private
const updatePurchase = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };
  if (req.shopId) {
    query.$or = [
      { shop: req.shopId },
      { shop: null },
      { shop: { $exists: false } }
    ];
  }
  let purchase = await Purchase.findOne(query);

  if (!purchase) {
    return res.status(404).json({ 
      success: false,
      message: `Purchase not found with id ${req.params.id}` 
    });
  }

  // Update purchase
  purchase = await Purchase.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  })
  .populate('supplier', 'name contactNumber')
  .populate('items.product', 'name trackSerials sku');

  res.status(200).json({
    success: true,
    data: purchase
  });
});

// @desc    Delete purchase
// @route   DELETE /api/purchases/:id
// @access  Private
const deletePurchase = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };
  if (req.shopId) {
    query.$or = [
      { shop: req.shopId },
      { shop: null },
      { shop: { $exists: false } }
    ];
  }
  const purchase = await Purchase.findOne(query);

  if (!purchase) {
    return res.status(404).json({ 
      success: false,
      message: `Purchase not found with id ${req.params.id}` 
    });
  }

  // Remove inventory records associated with this purchase
  await Inventory.deleteMany({ 
    referenceId: purchase._id, 
    referenceModel: 'Purchase',
    shop: req.shopId
  });

  await purchase.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Create purchase return
// @route   POST /api/purchases/returns
// @access  Private
const createPurchaseReturn = asyncHandler(async (req, res) => {
  const { purchase, supplier, date, items, note } = req.body;

  try {
    // Validate required fields
    if (!purchase || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Purchase ID and items are required'
      });
    }

    // Find the original purchase
    const query = { _id: purchase };
    if (req.shopId) {
      query.$or = [
        { shop: req.shopId },
        { shop: null },
        { shop: { $exists: false } }
      ];
    }
    const originalPurchase = await Purchase.findOne(query);
    if (!originalPurchase) {
      return res.status(404).json({
        success: false,
        message: 'Original purchase not found'
      });
    }

    // Calculate total return amount
    const totalReturnAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

    // Update inventory for returned items
    for (const item of items) {
      await Inventory.create({
        product: item.product,
        type: 'Purchase Return',
        referenceId: purchase,
        referenceModel: 'PurchaseReturn',
        quantity: item.quantity, // Positive because stock is coming back
        unitPrice: item.unitPrice,
        date: date || new Date(),
        note: note || 'N/A',
        shop: req.shopId
      });
    }

    // Purchase returns are tracked on the purchase module — not duplicated in expenses.

    res.status(201).json({
      success: true,
      data: {
        purchase: originalPurchase,
        items,
        totalReturnAmount,
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Get all purchase returns
// @route   GET /api/purchases/returns
// @access  Private
const getPurchaseReturns = asyncHandler(async (req, res) => {
  // This would typically fetch from a separate PurchaseReturn model
  // For now, we'll return a placeholder response
  res.status(200).json({
    success: true,
    data: [] // In a real implementation, you would fetch from a PurchaseReturn model
  });
});

// @desc    Record purchase due payment
// @route   POST /api/purchases/due-payment
// @access  Private
const recordPurchaseDuePayment = asyncHandler(async (req, res) => {
  const { supplier, amount, date, paymentMethod, description } = req.body;

  // Validate required fields
  if (!supplier || !amount || amount <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Supplier and amount are required'
    });
  }

  try {
    // Find the supplier to get current due amount
    const supplierQuery = { _id: supplier };
    if (req.shopId) {
      supplierQuery.$or = [
        { shop: req.shopId },
        { shop: null },
        { shop: { $exists: false } }
      ];
    }
    const supplierDoc = await Supplier.findOne(supplierQuery);
    if (!supplierDoc) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    // Check if the payment amount exceeds the due amount
    if (amount > supplierDoc.totalDue) {
      return res.status(400).json({
        success: false,
        message: `Payment amount exceeds due amount. Current due: ৳${supplierDoc.totalDue}`
      });
    }

    // Find all purchase invoices for this supplier with dueAmount > 0, oldest first
    const purchasesQuery = {
      supplier: supplier,
      dueAmount: { $gt: 0 }
    };
    if (req.shopId) {
      purchasesQuery.$or = [
        { shop: req.shopId },
        { shop: null },
        { shop: { $exists: false } }
      ];
    }
    const purchases = await Purchase.find(purchasesQuery).sort({ date: 1 });

    let remainingPayment = amount;
    const updatedPurchases = [];

    for (const purchase of purchases) {
      if (remainingPayment <= 0) break;

      const deduct = Math.min(remainingPayment, purchase.dueAmount);
      purchase.dueAmount -= deduct;
      purchase.paidAmount += deduct;

      if (purchase.dueAmount === 0) {
        purchase.status = 'Completed';
      } else {
        purchase.status = 'Partial';
      }

      await purchase.save();
      updatedPurchases.push(purchase);
      remainingPayment -= deduct;
    }

    // Update supplier's total due
    supplierDoc.totalDue -= amount;
    await supplierDoc.save();

    // Create Expense head if it doesn't exist
    const expenseHeadQuery = { name: 'Purchase Payment' };
    if (req.shopId) {
      expenseHeadQuery.$or = [
        { shop: req.shopId },
        { shop: null },
        { shop: { $exists: false } }
      ];
    }
    let expenseHead = await ExpenseHead.findOne(expenseHeadQuery);

    if (!expenseHead) {
      expenseHead = await ExpenseHead.create({
        name: 'Purchase Payment',
        description: 'System generated head for purchase payments',
        shop: req.shopId
      });
    }

    // Create Expense entry
    const expense = await Expense.create({
      shop: req.shopId,
      expenseHead: expenseHead._id,
      name: 'Purchase Due Payment',
      date: date ? new Date(date) : new Date(),
      amount: amount,
      paymentMethod: paymentMethod || 'Cash',
      description: description || `Due payment for supplier ${supplierDoc.name}`,
      reference: supplierDoc.name,
      addedBy: req.user ? req.user.id : null
    });

    res.status(200).json({
      success: true,
      data: {
        supplier: supplierDoc,
        expense,
        updatedPurchases
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Get suppliers with purchase dues
// @route   GET /api/purchases/suppliers-with-dues
// @access  Private
const getSuppliersWithDues = asyncHandler(async (req, res) => {
  try {
    // Find all suppliers with outstanding dues
    const matchCondition = { totalDue: { $gt: 0 } };
    if (req.shopId) {
      matchCondition.$or = [
        { shop: req.shopId },
        { shop: null },
        { shop: { $exists: false } }
      ];
    }
    const suppliers = await Supplier.find(matchCondition)
    .sort({ totalDue: -1 }) // Sort by highest due first
    .select('name contactName contactNumber totalDue');

    res.status(200).json({
      success: true,
      count: suppliers.length,
      data: suppliers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Get all purchase due payments
// @route   GET /api/purchases/due-payments
// @access  Private
const getPurchaseDuePayments = asyncHandler(async (req, res) => {
  try {
    const matchCondition = { name: 'Purchase Due Payment' };
    if (req.shopId) {
      matchCondition.$or = [
        { shop: req.shopId },
        { shop: null },
        { shop: { $exists: false } }
      ];
    }
    const payments = await Expense.find(matchCondition)
    .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = {
  getPurchases,
  getPurchase,
  createPurchase,
  updatePurchase,
  deletePurchase,
  recordPurchaseDuePayment,
  getSuppliersWithDues,
  createPurchaseReturn,
  getPurchaseReturns,
  getPurchaseDuePayments,
  getPurchaseReportsSummary
};