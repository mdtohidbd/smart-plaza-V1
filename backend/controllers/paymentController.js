const Payment = require('../models/Payment');
const SaleOrder = require('../models/SaleOrder');
const Customer = require('../models/Customer');
const asyncHandler = require('express-async-handler');
const QRCode = require('qrcode');

// @desc    Initiate payment for e-commerce order
// @route   POST /api/payments/initiate
// @access  Public (for guests) or Private (for logged-in users)
const initiatePayment = asyncHandler(async (req, res) => {
  const { orderId, paymentMethod, gateway } = req.body;

  // Validate required fields
  if (!orderId || !paymentMethod) {
    return res.status(400).json({
      success: false,
      message: 'Order ID and payment method are required'
    });
  }

  // Find the order
  const order = await SaleOrder.findById(orderId).populate('customer');
  
  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  // Check if order is already paid
  if (order.paymentStatus === 'paid') {
    return res.status(400).json({
      success: false,
      message: 'Order is already paid'
    });
  }

  let paymentResult = {};

  // Handle different payment methods
  switch (paymentMethod) {
    case 'cod':
      // Cash on Delivery - No gateway needed
      paymentResult = await handleCODPayment(order);
      break;

    case 'online':
      // Online payment via gateway
      if (!gateway) {
        return res.status(400).json({
          success: false,
          message: 'Payment gateway is required for online payments'
        });
      }
      paymentResult = await handleOnlinePayment(order, gateway);
      break;

    case 'emi':
      // EMI payment (down payment)
      paymentResult = await handleEMIPayment(order);
      break;

    default:
      return res.status(400).json({
        success: false,
        message: 'Invalid payment method'
      });
  }

  res.status(200).json({
    success: true,
    data: paymentResult
  });
});

// @desc    Handle Cash on Delivery payment
const handleCODPayment = async (order) => {
  // Create payment record
  const payment = await Payment.create({
    order: order._id,
    customer: order.customer._id,
    shop: order.shop,
    amount: order.total,
    paymentMethod: 'cod',
    paymentGateway: 'manual',
    status: 'pending',
    paymentDate: new Date(),
    createdBy: order.createdBy
  });

  // Update order status
  order.paymentMethod = 'COD';
  order.paymentStatus = 'pending';
  order.status = 'Pending';
  await order.save();

  return {
    paymentNumber: payment.paymentNumber,
    paymentMethod: 'cod',
    status: 'pending',
    message: 'Order placed successfully. Pay cash on delivery.',
    nextStep: 'await_delivery'
  };
};

// @desc    Handle Online Payment (SSLCommerz/bKash/etc)
const handleOnlinePayment = async (order, gateway) => {
  const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Create pending payment record
  const payment = await Payment.create({
    order: order._id,
    customer: order.customer._id,
    shop: order.shop,
    amount: order.total,
    paymentMethod: 'online',
    paymentGateway: gateway,
    transactionId: transactionId,
    status: 'processing',
    paymentDate: new Date(),
    ipAddress: order.shippingAddress?.ip || req.ip,
    userAgent: req.headers['user-agent'],
    createdBy: order.createdBy
  });

  let gatewayResponse;

  // Initialize payment based on gateway
  switch (gateway.toLowerCase()) {
    case 'sslcommerz':
      gatewayResponse = await initializeSSLCommerz(order, transactionId);
      break;
    case 'bkash':
      gatewayResponse = await initializeBkash(order, transactionId);
      break;
    case 'nagad':
      gatewayResponse = await initializeNagad(order, transactionId);
      break;
    default:
      throw new Error(`Unsupported gateway: ${gateway}`);
  }

  return {
    paymentNumber: payment.paymentNumber,
    transactionId: transactionId,
    gatewayUrl: gatewayResponse.gatewayUrl,
    paymentMethod: 'online',
    status: 'processing',
    message: 'Redirecting to payment gateway...',
    nextStep: 'complete_payment_on_gateway'
  };
};

// @desc    Handle EMI Payment (Down Payment)
const handleEMIPayment = async (order) => {
  // Calculate down payment (20% of total)
  const downPaymentAmount = order.total * 0.2;

  // Create payment record for down payment
  const payment = await Payment.create({
    order: order._id,
    customer: order.customer._id,
    shop: order.shop,
    amount: downPaymentAmount,
    paymentMethod: 'emi',
    paymentGateway: 'manual',
    status: 'completed',
    paymentDate: new Date(),
    confirmedDate: new Date(),
    emiInvoice: order.emiInvoice, // Assuming EMI invoice is created
    createdBy: order.createdBy
  });

  // Update order
  order.paymentMethod = 'EMI';
  order.paymentStatus = 'partial';
  order.paidAmount = downPaymentAmount;
  order.dueAmount = order.total - downPaymentAmount;
  order.status = 'Approved';
  await order.save();

  return {
    paymentNumber: payment.paymentNumber,
    paymentMethod: 'emi',
    downPayment: downPaymentAmount,
    remainingAmount: order.dueAmount,
    status: 'completed',
    message: 'Down payment received. EMI schedule activated.',
    nextStep: 'pay_remaining_instalments'
  };
};

// @desc    Verify payment from gateway callback
// @route   POST /api/payments/verify
// @access  Public (webhook)
const verifyPayment = asyncHandler(async (req, res) => {
  const { transactionId, status, amount } = req.body;

  // Find payment by transaction ID
  const payment = await Payment.findOne({ transactionId }).populate('order customer');

  if (!payment) {
    return res.status(404).json({
      success: false,
      message: 'Payment not found'
    });
  }

  // Verify amount matches
  if (parseFloat(amount) !== payment.amount) {
    console.error(`[PAYMENT MISMATCH] Expected: ${payment.amount}, Received: ${amount}`);
    return res.status(400).json({
      success: false,
      message: 'Payment amount mismatch'
    });
  }

  // Update payment status based on gateway response
  if (status === 'success' || status === 'VALID') {
    payment.status = 'completed';
    payment.confirmedDate = new Date();
    payment.gatewayResponse = req.body;
    await payment.save();

    // Update order
    const order = payment.order;
    order.paymentStatus = 'paid';
    order.status = 'Approved';
    order.paidAmount = order.total;
    order.dueAmount = 0;
    await order.save();

    // Update customer ledger
    await Customer.findByIdAndUpdate(payment.customer._id, {
      $inc: { totalPaid: payment.amount }
    });

    // Send confirmation SMS
    try {
      const { sendSaleConfirmationSMS } = require('../utils/smsService');
      await sendSaleConfirmationSMS(payment.customer, order, order.type || 'sale');
    } catch (smsError) {
      console.error('Failed to send payment confirmation SMS:', smsError);
    }

    return res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      paymentNumber: payment.paymentNumber,
      orderNumber: order.orderNumber
    });
  } else {
    // Payment failed
    payment.status = 'failed';
    payment.gatewayResponse = req.body;
    await payment.save();

    // Update order
    const order = payment.order;
    order.paymentStatus = 'failed';
    order.status = 'Cancelled';
    await order.save();

    return res.status(200).json({
      success: false,
      message: 'Payment failed',
      paymentNumber: payment.paymentNumber
    });
  }
});

// @desc    Get payment details
// @route   GET /api/payments/:id
// @access  Private
const getPayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id)
    .populate('order', 'orderNumber total')
    .populate('customer', 'contactName contactNumber')
    // .populate('shop', 'name')
    .populate('createdBy', 'name email');

  if (!payment) {
    return res.status(404).json({
      success: false,
      message: 'Payment not found'
    });
  }

  res.status(200).json({
    success: true,
    data: payment
  });
});

// @desc    Get all payments (Super Admin)
// @route   GET /api/payments
// @access  Private (Super Admin/Admin)
const getPayments = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 50,
    status,
    paymentMethod,
    startDate,
    endDate,
    search
  } = req.query;

  // Build filter
  const filter = { shop: req.shopId };

  if (status) filter.status = status;
  if (paymentMethod) filter.paymentMethod = paymentMethod;
  if (startDate || endDate) {
    filter.paymentDate = {};
    if (startDate) filter.paymentDate.$gte = new Date(startDate);
    if (endDate) filter.paymentDate.$lte = new Date(endDate);
  }
  if (search) {
    filter.$or = [
      { paymentNumber: new RegExp(search, 'i') },
      { transactionId: new RegExp(search, 'i') }
    ];
  }

  // Get payments with pagination
  const payments = await Payment.find(filter)
    .populate('order', 'orderNumber total')
    .populate('customer', 'contactName contactNumber')
    .populate('createdBy', 'name')
    .sort({ paymentDate: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Payment.countDocuments(filter);

  res.status(200).json({
    success: true,
    data: payments,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// @desc    Get payment analytics
// @route   GET /api/payments/analytics
// @access  Private (Super Admin/Admin)
const getPaymentAnalytics = asyncHandler(async (req, res) => {
  const { period = '7days' } = req.query;

  // Calculate date range
  const endDate = new Date();
  const startDate = new Date();

  switch (period) {
    case 'today':
      startDate.setHours(0, 0, 0, 0);
      break;
    case '7days':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case '30days':
      startDate.setDate(startDate.getDate() - 30);
      break;
    case 'thismonth':
      startDate.setDate(1);
      break;
    default:
      startDate.setDate(startDate.getDate() - 7);
  }

  // Get statistics
  const stats = await Payment.getPaymentStats(req.shopId, startDate, endDate);

  // Get payment method distribution
  const methodDistribution = await Payment.getPaymentMethodDistribution(req.shopId, startDate, endDate);

  // Calculate percentages
  const totalAmount = methodDistribution.reduce((sum, m) => sum + m.totalAmount, 0);
  methodDistribution.forEach(method => {
    method.percentage = totalAmount > 0 ? (method.totalAmount / totalAmount) * 100 : 0;
  });

  // Get daily trends
  const dailyTrends = await Payment.getDailyTrends(req.shopId, period === 'today' ? 1 : 30);

  res.status(200).json({
    success: true,
    data: {
      summary: stats,
      methodDistribution,
      dailyTrends,
      period
    }
  });
});

// @desc    Process refund
// @route   PUT /api/payments/:id/refund
// @access  Private (Super Admin/Admin)
const processRefund = asyncHandler(async (req, res) => {
  const { refundAmount, reason } = req.body;

  const payment = await Payment.findById(req.params.id).populate('order customer');

  if (!payment) {
    return res.status(404).json({
      success: false,
      message: 'Payment not found'
    });
  }

  if (payment.status !== 'completed') {
    return res.status(400).json({
      success: false,
      message: 'Only completed payments can be refunded'
    });
  }

  if (!refundAmount || refundAmount <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Valid refund amount is required'
    });
  }

  if (refundAmount > payment.amount) {
    return res.status(400).json({
      success: false,
      message: 'Refund amount cannot exceed payment amount'
    });
  }

  // Process refund (for now, manual - later integrate with gateways)
  payment.status = refundAmount === payment.amount ? 'refunded' : 'partially_refunded';
  payment.refundedDate = new Date();
  payment.refundAmount = refundAmount;
  payment.refundReason = reason;
  payment.updatedBy = req.user.id;
  await payment.save();

  // Update order
  const order = payment.order;
  if (refundAmount === payment.amount) {
    order.paymentStatus = 'refunded';
  } else {
    order.paymentStatus = 'partially_refunded';
    order.paidAmount -= refundAmount;
    order.dueAmount += refundAmount;
  }
  await order.save();

  // Update customer ledger
  await Customer.findByIdAndUpdate(payment.customer._id, {
    $inc: { totalPaid: -refundAmount }
  });

  res.status(200).json({
    success: true,
    message: 'Refund processed successfully',
    data: {
      paymentNumber: payment.paymentNumber,
      refundAmount,
      newStatus: payment.status
    }
  });
});

// Helper functions for gateway initialization (to be implemented)
async function initializeSSLCommerz(order, transactionId) {
  // TODO: Implement SSLCommerz integration
  return {
    gatewayUrl: `https://sandbox.sslcommerz.com/gwprocess/v4/${transactionId}`
  };
}

async function initializeBkash(order, transactionId) {
  // TODO: Implement bKash integration
  return {
    gatewayUrl: `https://checkout.sandbox.bka.sh/${transactionId}`
  };
}

async function initializeNagad(order, transactionId) {
  // TODO: Implement Nagad integration
  return {
    gatewayUrl: `https://sandbox.nagad.com.bd/checkout/${transactionId}`
  };
}

module.exports = {
  initiatePayment,
  verifyPayment,
  getPayment,
  getPayments,
  getPaymentAnalytics,
  processRefund
};
