const Customer = require('../models/Customer');
const asyncHandler = require('express-async-handler');

// @desc    Get all contacts (customers and companies)
// @route   GET /api/contacts
// @access  Private
const getContacts = asyncHandler(async (req, res) => {
  // Filter by shop if shop context is available
  const shopFilter = req.shopId ? { shop: req.shopId } : {};
  
  // Get all customers
  const customers = await Customer.find(shopFilter).sort({ createdAt: -1 });

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
  // Filter by shop if shop context is available
  const shopFilter = req.shopId ? { shop: req.shopId } : {};
  
  const customers = await Customer.find(shopFilter).sort({ createdAt: -1 });
  
  // Calculate current balance for each customer
  const SaleOrder = require('../models/SaleOrder');
  const Sale = require('../models/Sale');
  
  const customersWithBalance = await Promise.all(customers.map(async (customer) => {
    // Get all wholesale sales (SaleOrder) for this customer
    const wholesaleSales = await SaleOrder.aggregate([
      { $match: { customer: customer._id, shop: customer.shop } },
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
      { $match: { customer: customer._id, shop: customer.shop } },
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
    const currentBalance = customer.openingBalance + totalSales - totalPayments;
    
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
  // Find customer and ensure it belongs to the current shop
  const customer = await Customer.findOne({
    _id: req.params.id,
    shop: req.shopId
  });

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
  
  // Associate customer with current shop if available
  const customerData = {
    ...req.body,
    ...(req.shopId && { shop: req.shopId }) // Only add shop if it exists
  };

  // Check if contactNumber already exists
  if (req.body.contactNumber) {
    const existingCustomer = await Customer.findOne({ contactNumber: req.body.contactNumber });
    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        message: 'A customer with this phone number already exists.'
      });
    }
  }

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
  console.log('=== UPDATE CUSTOMER DEBUG ===');
  console.log('Customer ID:', req.params.id);
  console.log('Request Body:', req.body);
  console.log('Shop ID:', req.shopId);
  
  // Find customer and ensure it belongs to the current shop
  let customer = await Customer.findOne({
    _id: req.params.id,
    shop: req.shopId
  });

  if (!customer) {
    console.error('Customer not found with id:', req.params.id, 'and shop:', req.shopId);
    return res.status(404).json({ 
      success: false,
      message: `Customer not found with id ${req.params.id}` 
    });
  }

  console.log('Customer found:', customer.contactName, customer.contactNumber);

  // Handle empty string route values by converting to null
  if (req.body.route && req.body.route === '') {
    req.body.route = null;
  }
  
  // Also handle empty strings for other optional fields to prevent CastError
  if (req.body.businessName === '') req.body.businessName = undefined;
  if (req.body.businessNumber === '') req.body.businessNumber = undefined;
  if (req.body.address === '') req.body.address = undefined;
  if (req.body.note === '') req.body.note = undefined;
  if (req.body.contactPersonName === '') req.body.contactPersonName = undefined;
  if (req.body.businessRegistrationNumber === '') req.body.businessRegistrationNumber = undefined;

  // Check if contactNumber already exists for a different customer
  if (req.body.contactNumber) {
    const existingCustomer = await Customer.findOne({
      contactNumber: req.body.contactNumber,
      _id: { $ne: req.params.id }
    });
    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        message: 'A customer with this phone number already exists.'
      });
    }
  }

  console.log('Updating with cleaned data:', req.body);
  
  // Update customer
  customer = await Customer.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  
  console.log('Customer updated successfully:', customer.contactName, customer.contactNumber);

  res.status(200).json({
    success: true,
    data: customer
  });
});

// @desc    Delete customer
// @route   DELETE /api/contacts/customers/:id
// @access  Private
const deleteCustomer = asyncHandler(async (req, res) => {
  // Find customer and ensure it belongs to the current shop
  const customer = await Customer.findOne({
    _id: req.params.id,
    shop: req.shopId
  });

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