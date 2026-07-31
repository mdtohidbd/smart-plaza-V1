const Sale = require('../models/Sale');
const Inventory = require('../models/Inventory');
const asyncHandler = require('express-async-handler');

// @desc    Process bulk return for multiple sales items
// @route   POST /api/sales/bulk-return
// @access  Private
const processBulkReturn = asyncHandler(async (req, res) => {
  const { sales, returnItems, returnDate, note } = req.body;

  if (!sales || !Array.isArray(sales) || sales.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Sales array is required'
    });
  }

  if (!returnItems || !Array.isArray(returnItems) || returnItems.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Return items array is required'
    });
  }

  const results = [];

  for (const saleId of sales) {
    // Find the original sale
    const originalSale = await Sale.findById(saleId);
    if (!originalSale) {
      return res.status(404).json({
        success: false,
        message: `Sale not found with id ${saleId}`
      });
    }

    // Process return items for this sale
    const saleReturnItems = returnItems.filter(item => item.saleId === saleId);
    
    for (const returnItem of saleReturnItems) {
      // Update inventory for returned items (add back to stock)
      await Inventory.create({
        product: returnItem.product,
        type: 'Sale Return',
        referenceId: originalSale._id,
        referenceModel: 'SaleReturn',
        quantity: returnItem.quantity, // Positive because we're adding back to stock
        unitPrice: returnItem.unitPrice,
        date: returnDate || new Date(),
        note: note || originalSale.invoiceNumber,
        shop: req.shopId
      });
    }

    // Update the sale record to reflect the return
    originalSale.returnedItems = [...(originalSale.returnedItems || []), ...saleReturnItems];
    await originalSale.save();

    results.push({
      saleId: originalSale._id,
      invoiceNumber: originalSale.invoiceNumber,
      returnedItems: saleReturnItems,
      status: 'Processed'
    });
  }

  res.status(200).json({
    success: true,
    data: results
  });
});

// @desc    Get sales returns
// @route   GET /api/sales/returns
// @access  Private
const getSalesReturns = asyncHandler(async (req, res) => {
  // In a real implementation, you would fetch from a separate SalesReturn model
  // For now, we'll return sales that have return items
  const sales = await Sale.find({ 'returnedItems.0': { $exists: true } })
    .populate('customer', 'contactName contactNumber')
    .populate('items.product', 'name')
    .populate('returnedItems.product', 'name')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: sales.length,
    data: sales
  });
});

module.exports = {
  processBulkReturn,
  getSalesReturns
};