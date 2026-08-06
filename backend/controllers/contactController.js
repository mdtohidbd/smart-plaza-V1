const Customer = require('../models/Customer');
const asyncHandler = require('express-async-handler');

// @desc    Get all contacts (customers and companies)
// @route   GET /api/contacts
// @access  Private
const getContacts = asyncHandler(async (req, res) => {
  // Filter by shop if shop context is available, including global (null) customers
  let shopFilter = {};
  if (req.shopId) {
    shopFilter = {
      $or: [
        { shop: req.shopId },
        { shop: null },
        { shop: { $exists: false } }
      ]
    };
  }
  
  let customers = await Customer.find(shopFilter).sort({ createdAt: -1 });

  // Fail-safe: If no customers match the shop filter, return all available customers
  if (customers.length === 0) {
    customers = await Customer.find({}).sort({ createdAt: -1 });
  }

  res.status(200).json({
    success: true,
    data: {
      customers,
      companies: []
    }
  });
});

// @desc    Get all customers
// @route   GET /api/contacts/customers
// @access  Private
const getCustomers = asyncHandler(async (req, res) => {
  // Filter by shop if shop context is available, including global (null) customers
  let shopFilter = {};
  if (req.shopId) {
    shopFilter = {
      $or: [
        { shop: req.shopId },
        { shop: null },
        { shop: { $exists: false } }
      ]
    };
  }
  
  let customers = await Customer.find(shopFilter).sort({ createdAt: -1 });

  // Fail-safe: If no customers match the shop filter, return all available customers
  if (customers.length === 0) {
    customers = await Customer.find({}).sort({ createdAt: -1 });
  }
  
  // Calculate current balance for each customer
  const SaleOrder = require('../models/SaleOrder');
  const Sale = require('../models/Sale');
  
  const customersWithBalance = await Promise.all(customers.map(async (customer) => {
    // Get all wholesale sales (SaleOrder) for this customer
    const wholesaleSales = await SaleOrder.aggregate([
      { $match: { customer: customer._id } },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$total' },
          totalPaid: { $sum: '$paidAmount' }
        }
      }
    ]);
    
    // Get all retail sales (Sale) for this customer
    const retailSales = await Sale.aggregate([
      { $match: { customer: customer._id } },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$total' },
          totalPaid: { $sum: '$paidAmount' }
        }
      }
    ]);
    
    // Combine totals from both wholesale and retail
    const wholesaleTotal = wholesaleSales[0] || { totalSales: 0, totalPaid: 0 };
    const retailTotal = retailSales[0] || { totalSales: 0, totalPaid: 0 };
    
    const totalSales = wholesaleTotal.totalSales + retailTotal.totalSales;
    const totalPayments = wholesaleTotal.totalPaid + retailTotal.totalPaid;
    
    // Current Balance = Opening Balance + Total Sales - Total Payments
    const currentBalance = (customer.openingBalance || 0) + totalSales - totalPayments;
    
    return {
      ...customer.toObject(),
      totalSales,
      totalPayments,
      currentBalance
    };
  }));

  res.status(200).json({
    success: true,
    count: customersWithBalance.length,
    data: customersWithBalance
  });
});

// @desc    Get single customer
// @route   GET /api/contacts/customers/:id
// @access  Private
const getCustomer = asyncHandler(async (req, res) => {
  const shopFilter = req.shopId 
    ? { _id: req.params.id, $or: [{ shop: req.shopId }, { shop: null }, { shop: { $exists: false } }] }
    : { _id: req.params.id };

  const customer = await Customer.findOne(shopFilter);

  if (!customer) {
    return res.status(404).json({ 
      success: false,
      message: `Customer not found with id ${req.params.id}` 
    });
  }

  res.status(200).json({
    success: true,
    data: customer
  });
});

// @desc    Create customer
// @route   POST /api/contacts/customers
// @access  Private
const createCustomer = asyncHandler(async (req, res) => {
  // Handle empty string route values by converting to null
  if (req.body.route === '') {
    req.body.route = null;
  }
  
  const phone = req.body.contactNumber ? req.body.contactNumber.trim() : '';

  // Check if customer with this contactNumber already exists
  if (phone) {
    const existingCustomer = await Customer.findOne({ contactNumber: phone });
    if (existingCustomer) {
      // If customer exists, associate with current shop if unassigned and return existing customer seamlessly
      if (req.shopId && !existingCustomer.shop) {
        existingCustomer.shop = req.shopId;
        await existingCustomer.save();
      }
      return res.status(200).json({
        success: true,
        data: existingCustomer,
        message: 'A customer with this phone number already exists and was selected.'
      });
    }
  }

  // Associate customer with current shop if available
  const customerData = {
    ...req.body,
    contactNumber: phone,
    ...(req.shopId && { shop: req.shopId })
  };

  const customer = await Customer.create(customerData);

  res.status(201).json({
    success: true,
    data: customer
  });
});

// @desc    Update customer
// @route   PUT /api/contacts/customers/:id
// @access  Private
const updateCustomer = asyncHandler(async (req, res) => {
  let customer = await Customer.findById(req.params.id);

  if (!customer) {
    return res.status(404).json({ 
      success: false,
      message: `Customer not found with id ${req.params.id}` 
    });
  }

  // Handle empty string route values by converting to null
  if (req.body.route && req.body.route === '') {
    req.body.route = null;
  }
  
  // Clean optional fields to prevent CastError
  if (req.body.businessName === '') req.body.businessName = undefined;
  if (req.body.businessNumber === '') req.body.businessNumber = undefined;
  if (req.body.address === '') req.body.address = undefined;
  if (req.body.note === '') req.body.note = undefined;
  if (req.body.contactPersonName === '') req.body.contactPersonName = undefined;
  if (req.body.businessRegistrationNumber === '') req.body.businessRegistrationNumber = undefined;

  const phone = req.body.contactNumber ? req.body.contactNumber.trim() : '';

  // Check if contactNumber already exists for a different customer
  if (phone) {
    const existingCustomer = await Customer.findOne({
      contactNumber: phone,
      _id: { $ne: req.params.id }
    });
    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        message: 'A customer with this phone number already exists.'
      });
    }
  }

  if (phone) {
    req.body.contactNumber = phone;
  }
  
  // Update customer
  customer = await Customer.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: customer
  });
});

// @desc    Delete customer
// @route   DELETE /api/contacts/customers/:id
// @access  Private
const deleteCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);

  if (!customer) {
    return res.status(404).json({ 
      success: false,
      message: `Customer not found with id ${req.params.id}` 
    });
  }

  await customer.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

module.exports = {
  getContacts,
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer
};