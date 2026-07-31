const Quotation = require('../models/Quotation');
const SaleOrder = require('../models/SaleOrder');
const Product = require('../models/Product');
const asyncHandler = require('express-async-handler');

// @desc    Get all quotations
// @route   GET /api/quotations
// @access  Private
const getQuotations = asyncHandler(async (req, res) => {
  const { status, startDate, endDate, search, term } = req.query;
  const searchTerm = search || term;
  
  let filter = {};
  
  if (req.shopId) {
    filter.$and = filter.$and || [];
    filter.$and.push({
      $or: [
        { shop: req.shopId },
        { shop: null },
        { shop: { $exists: false } }
      ]
    });
  }

  if (status && status !== 'ALL') {
    filter.status = status;
  }
  
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) filter.date.$lte = new Date(endDate);
  }
  
  if (searchTerm) {
    const Customer = require('../models/Customer');
    const matchingCustomers = await Customer.find({
      $or: [
        { contactName: { $regex: searchTerm, $options: 'i' } },
        { contactNumber: { $regex: searchTerm, $options: 'i' } },
        { businessName: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } }
      ]
    }).select('_id');
    const customerIds = matchingCustomers.map(c => c._id);

    filter.$and = filter.$and || [];
    filter.$and.push({
      $or: [
        { quotationNumber: { $regex: searchTerm, $options: 'i' } },
        { customer: { $in: customerIds } },
        { 'items.productName': { $regex: searchTerm, $options: 'i' } }
      ]
    });
  }
  
  const quotations = await Quotation.find(filter)
    .populate('customer', 'contactName contactNumber businessName email address customerType')
    .populate('createdBy', 'name')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: quotations.length,
    data: quotations
  });
});

// @desc    Get single quotation
// @route   GET /api/quotations/:id
// @access  Private
const getQuotation = asyncHandler(async (req, res) => {
  const quotation = await Quotation.findById(req.params.id)
    .populate('customer', 'contactName contactNumber address businessName email customerType')
    .populate('createdBy', 'name')
    .populate('approvedBy', 'name')
    .populate('items.product', 'name costPrice model');

  if (!quotation) {
    return res.status(404).json({ 
      success: false,
      message: `Quotation not found with id ${req.params.id}` 
    });
  }

  res.status(200).json({
    success: true,
    data: quotation
  });
});

// @desc    Create quotation
// @route   POST /api/quotations
// @access  Private
const createQuotation = asyncHandler(async (req, res) => {
  const {
    quotationNumber,
    customer,
    items,
    validityDays,
    subTotal,
    discount,
    tax,
    deliveryCharge,
    installationCost,
    otherCharges,
    cardCharge,
    total,
    note,
    subject,
    vatAitInfo,
    paymentMethod,
    relatedInformation,
    quoteGivenByName,
    quoteGivenByDesignation
  } = req.body;

  // Validate items
  for (const item of items) {
    const product = await Product.findById(item.product);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product not found with id ${item.product}`
      });
    }
  }

  const quotationData = {
    shop: req.shopId || (req.user && req.user.activeShop ? req.user.activeShop : undefined),
    quotationNumber,
    customer,
    items,
    validityDays,
    subTotal,
    discount,
    tax,
    deliveryCharge,
    installationCost,
    otherCharges,
    cardCharge,
    total,
    note,
    subject,
    vatAitInfo,
    paymentMethod,
    relatedInformation,
    quoteGivenByName,
    quoteGivenByDesignation,
    createdBy: req.user.id
  };

  const quotation = await Quotation.create(quotationData);

  res.status(201).json({
    success: true,
    data: quotation
  });
});

// @desc    Update quotation
// @route   PUT /api/quotations/:id
// @access  Private
const updateQuotation = asyncHandler(async (req, res) => {
  let quotation = await Quotation.findById(req.params.id);

  if (!quotation) {
    return res.status(404).json({ 
      success: false,
      message: `Quotation not found with id ${req.params.id}` 
    });
  }

  // Only Pending or Draft quotations can be edited
  if (quotation.status !== 'Pending' && quotation.status !== 'Draft') {
    return res.status(400).json({
      success: false,
      message: `Cannot edit a quotation with status ${quotation.status}`
    });
  }

  quotation = await Quotation.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  }).populate('customer', 'contactName contactNumber').populate('items.product', 'name');

  res.status(200).json({
    success: true,
    data: quotation
  });
});

// @desc    Delete quotation
// @route   DELETE /api/quotations/:id
// @access  Private
const deleteQuotation = asyncHandler(async (req, res) => {
  const quotation = await Quotation.findById(req.params.id);

  if (!quotation) {
    return res.status(404).json({ 
      success: false,
      message: `Quotation not found with id ${req.params.id}` 
    });
  }

  // Only Pending or Draft can be deleted
  if (quotation.status !== 'Pending' && quotation.status !== 'Draft') {
    return res.status(400).json({
      success: false,
      message: `Cannot delete a quotation with status ${quotation.status}`
    });
  }

  await quotation.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Approve/Reject Quotation
// @route   PUT /api/quotations/:id/status
// @access  Private
const updateQuotationStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  
  if (!['Approved', 'Rejected'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Status must be Approved or Rejected'
    });
  }

  let quotation = await Quotation.findById(req.params.id);

  if (!quotation) {
    return res.status(404).json({ 
      success: false,
      message: `Quotation not found with id ${req.params.id}` 
    });
  }

  quotation.status = status;
  if (status === 'Approved') {
    quotation.approvedBy = req.user.id;
    quotation.approvedAt = Date.now();
  }

  await quotation.save();

  res.status(200).json({
    success: true,
    data: quotation
  });
});

// @desc    Convert Quotation to Invoice
// @route   POST /api/quotations/:id/convert
// @access  Private
const convertToInvoice = asyncHandler(async (req, res) => {
  const quotation = await Quotation.findById(req.params.id);

  if (!quotation) {
    return res.status(404).json({ 
      success: false,
      message: `Quotation not found with id ${req.params.id}` 
    });
  }

  if (quotation.status !== 'Approved') {
    return res.status(400).json({
      success: false,
      message: 'Only approved quotations can be converted to invoices'
    });
  }

  // Generate order number/invoice number logic would go here
  // For now we just return the quotation data mapped for creating a sale
  
  const mappedSaleData = {
    customer: quotation.customer,
    items: quotation.items,
    subTotal: quotation.subTotal,
    discount: quotation.discount,
    tax: quotation.tax,
    deliveryCharge: quotation.deliveryCharge,
    installationCost: quotation.installationCost,
    cardCharge: quotation.cardCharge,
    total: quotation.total,
    note: `Converted from Quotation: ${quotation.quotationNumber}`
  };

  // Update status
  quotation.status = 'Converted';
  await quotation.save();

  res.status(200).json({
    success: true,
    data: mappedSaleData,
    message: 'Quotation ready for invoice conversion'
  });
});

module.exports = {
  getQuotations,
  getQuotation,
  createQuotation,
  updateQuotation,
  deleteQuotation,
  updateQuotationStatus,
  convertToInvoice
};
