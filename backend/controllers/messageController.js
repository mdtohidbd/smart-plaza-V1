const Message = require('../models/Message');
const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');

const asyncHandler = require('express-async-handler');
const smsService = require('../utils/smsService');

// @desc    Get all messages
// @route   GET /api/messages
// @access  Private
const getMessages = asyncHandler(async (req, res) => {
  const shopFilter = req.shopId ? { shop: req.shopId } : {};
  const messages = await Message.find(shopFilter)
    .populate('sender', 'name email')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: messages.length,
    data: messages
  });
});

// @desc    Get single message
// @route   GET /api/messages/:id
// @access  Private
const getMessage = asyncHandler(async (req, res) => {
  const message = await Message.findOne({
    _id: req.params.id,
    shop: req.shopId
  })
    .populate('sender', 'name email');

  if (!message) {
    return res.status(404).json({ 
      success: false,
      message: `Message not found with id ${req.params.id}` 
    });
  }

  res.status(200).json({
    success: true,
    data: message
  });
});

// @desc    Create message
// @route   POST /api/messages
// @access  Private
const createMessage = asyncHandler(async (req, res) => {
  const { title, body, recipientType, recipients } = req.body;

  // Create the message
  const message = await Message.create({
    title,
    body,
    sender: req.user.id,
    recipientType,
    recipients,
    shop: req.shopId
  });

  // In a real application, you would send the actual messages here
  // For now, we'll just update the status to 'Sent'
  message.status = 'Sent';
  await message.save();

  res.status(201).json({
    success: true,
    data: message
  });
});

// @desc    Send message to all customers
// @route   POST /api/messages/customers
// @access  Private
const sendMessageToAllCustomers = asyncHandler(async (req, res) => {
  const { title, body } = req.body;

  // Get all customer IDs
  const customers = await Customer.find({}, '_id');
  const customerIds = customers.map(customer => customer._id);

  // Create the message
  const message = await Message.create({
    title,
    body,
    sender: req.user.id,
    recipientType: 'All Customers',
    recipients: customerIds,
    recipientModel: 'Customer'
  });

  // In a real application, you would send the actual messages here
  // For now, we'll just update the status to 'Sent'
  message.status = 'Sent';
  await message.save();

  res.status(201).json({
    success: true,
    data: message
  });
});

// @desc    Send customer message
// @route   POST /api/messages/customer
// @access  Private
const sendCustomerMessage = asyncHandler(async (req, res) => {
  const { customer, subject, message, messageType } = req.body;

  try {
    // Validate required fields
    if (!customer || !message) {
      return res.status(400).json({
        success: false,
        message: 'Customer and message are required'
      });
    }

    // Find the customer
    const customerDoc = await Customer.findById(customer);
    if (!customerDoc) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Create the message record first
    let messageDoc = await Message.create({
      title: subject || 'Message',
      body: message,
      sender: req.user.id,
      recipientType: 'Customer',
      recipients: [customer],
      recipientModel: 'Customer',
      messageType: messageType || 'SMS',
      shop: req.shopId, // Add shop ID
      status: 'Processing' // Will update based on actual delivery
    });

    // If message type is SMS, try to send it via SMS service
    if (messageType === 'SMS' && customerDoc.phone) {
      try {
        const smsResult = await smsService.sendSingleSms(customerDoc.phone, message);
        
        if (smsResult.success) {
          messageDoc.status = 'Sent';
          messageDoc.smsDeliveryInfo = smsResult;
        } else {
          messageDoc.status = 'Failed';
          messageDoc.smsDeliveryInfo = smsResult;
        }
        
        await messageDoc.save();
      } catch (smsError) {
        // Even if SMS fails, still save the message record
        messageDoc.status = 'Failed';
        messageDoc.smsDeliveryInfo = { error: smsError.message };
        await messageDoc.save();
      }
    } else {
      // For non-SMS messages, just mark as sent
      messageDoc.status = 'Sent';
      await messageDoc.save();
    }

    res.status(201).json({
      success: true,
      data: messageDoc
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Get customer messages
// @route   GET /api/messages/customer
// @access  Private
const getCustomerMessages = asyncHandler(async (req, res) => {
  // Find messages sent to customers
  const messages = await Message.find({ recipientType: 'Customer' })
    .populate('sender', 'name email')
    .populate('recipients', 'contactName contactNumber')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: messages.length,
    data: messages
  });
});

// @desc    Send supplier message
// @route   POST /api/messages/supplier
// @access  Private
const sendSupplierMessage = asyncHandler(async (req, res) => {
  const { company, subject, message, messageType } = req.body;

  try {
    // Validate required fields
    if (!company || !message) {
      return res.status(400).json({
        success: false,
        message: 'Company and message are required'
      });
    }

    // Find the supplier
    const supplierDoc = await Supplier.findById(company);
    if (!supplierDoc) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    // Create the message record first
    let messageDoc = await Message.create({
      title: subject || 'Message',
      body: message,
      sender: req.user.id,
      recipientType: 'Supplier',
      recipients: [company],
      recipientModel: 'Supplier',
      messageType: messageType || 'SMS',
      shop: req.shopId, // Add shop ID
      status: 'Processing' // Will update based on actual delivery
    });

    // If message type is SMS, try to send it via SMS service
    if (messageType === 'SMS' && supplierDoc.phone) {
      try {
        const smsResult = await smsService.sendSingleSms(supplierDoc.phone, message);
        
        if (smsResult.success) {
          messageDoc.status = 'Sent';
          messageDoc.smsDeliveryInfo = smsResult;
        } else {
          messageDoc.status = 'Failed';
          messageDoc.smsDeliveryInfo = smsResult;
        }
        
        await messageDoc.save();
      } catch (smsError) {
        // Even if SMS fails, still save the message record
        messageDoc.status = 'Failed';
        messageDoc.smsDeliveryInfo = { error: smsError.message };
        await messageDoc.save();
      }
    } else {
      // For non-SMS messages, just mark as sent
      messageDoc.status = 'Sent';
      await messageDoc.save();
    }

    res.status(201).json({
      success: true,
      data: messageDoc
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Get supplier messages
// @route   GET /api/messages/supplier
// @access  Private
const getSupplierMessages = asyncHandler(async (req, res) => {
  // Find messages sent to suppliers
  const messages = await Message.find({ recipientType: 'Supplier' })
    .populate('sender', 'name email')
    .populate('recipients', 'name companyName contactNumber')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: messages.length,
    data: messages
  });
});

// @desc    Get SMS balance
// @route   GET /api/messages/sms-balance
// @access  Private
const getSMSBalance = asyncHandler(async (req, res) => {
  try {
    const balanceInfo = await smsService.getSMSBalance();
    
    if (balanceInfo.success) {
      res.status(200).json({
        success: true,
        data: balanceInfo
      });
    } else {
      res.status(500).json({
        success: false,
        message: balanceInfo.error || 'Failed to fetch SMS balance'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Send message to all suppliers
// @route   POST /api/messages/suppliers
// @access  Private
const sendMessageToAllSuppliers = asyncHandler(async (req, res) => {
  const { title, body } = req.body;

  // Get all supplier IDs
  const suppliers = await Supplier.find({}, '_id');
  const supplierIds = suppliers.map(supplier => supplier._id);

  // Create the message
  const message = await Message.create({
    title,
    body,
    sender: req.user.id,
    recipientType: 'All Suppliers',
    recipients: supplierIds,
    recipientModel: 'Supplier'
  });

  // In a real application, you would send the actual messages here
  // For now, we'll just update the status to 'Sent'
  message.status = 'Sent';
  await message.save();

  res.status(201).json({
    success: true,
    data: message
  });
});

module.exports = {
  getMessages,
  getMessage,
  createMessage,
  sendMessageToAllCustomers,
  sendMessageToAllSuppliers,
  sendCustomerMessage,
  getCustomerMessages,
  sendSupplierMessage,
  getSupplierMessages,
  getSMSBalance
};