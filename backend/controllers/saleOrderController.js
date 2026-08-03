const SaleOrder = require('../models/SaleOrder');
const Inventory = require('../models/Inventory');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const User = require('../models/User');

const Setting = require('../models/Setting');
const asyncHandler = require('express-async-handler');
const QRCode = require('qrcode');
const mongoose = require('mongoose');
const { generateInvoicePDF, generateInvoiceHTMLString, generateInvoiceHTMLForPrint } = require('../utils/invoiceGenerator');
const { sendSaleConfirmationSMS } = require('../utils/smsService');
const { createNotification } = require('../utils/notificationFeed');
const { checkFraud } = require('../utils/fraudChecker');

// @desc    Create sale order (SR places order)
// @route   POST /api/sales/orders
// @access  Private
const createSaleOrder = asyncHandler(async (req, res) => {
  const {
    orderNumber,
    customer,
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
    assignedSR,
    deliveredBy,
    route,
    type,
    commissionRate,
    customerEmail
  } = req.body;

  // Determine customer ID based on context
  let customerId = customer;
  
  // For e-commerce: If no customer provided but user is logged in, use their customer ID
  if (!customerId || customerId === '') {
    // Check if user has a customerId (e-commerce customer)
    if (req.user.customerId) {
      customerId = req.user.customerId;
    } else if (req.user.role === 'Customer') {
      // If user role is Customer, use their own ID
      customerId = req.user._id;
    }
  }

  // Validate required fields
  if (!customerId || customerId === '') {
    return res.status(400).json({
      success: false,
      message: 'Customer is required. Please log in or provide customer information.'
    });
  }

  // For e-commerce orders without assigned SR, set default or use sales rep
  let srId = assignedSR;
  if (!srId || srId === '') {
    // For e-commerce, assign to default SR or the user themselves if they're SR
    if (req.user.role === 'SR' || req.user.role === 'DSR') {
      srId = req.user._id;
    } else {
      // Try to find a default SR for the shop
      const User = require('../models/User');
      const defaultSR = await User.findOne({ 
        role: { $in: ['SR', 'DSR'] },
        shop: req.shopId,
        isActive: true 
      }).select('_id');
      
      if (defaultSR) {
        srId = defaultSR._id;
      } else {
        return res.status(400).json({
          success: false,
          message: 'Assigned SR is required. Please select a sales representative.'
        });
      }
    }
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'At least one item is required'
    });
  }

  if (!subTotal || subTotal <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Valid subtotal is required'
    });
  }

  if (!total || total <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Valid total is required'
    });
  }

  // Ensure orderNumber is present
  const finalOrderNumber = orderNumber || `SO-${Date.now()}`;

  // Generate QR code for the order
  const qrCode = await QRCode.toDataURL(`ORDER_${finalOrderNumber}_${Date.now()}`);

  // Handle empty string route values by converting to null
  const processedRoute = route === '' ? null : route;
  
  // Handle empty string deliveredBy values by converting to null
  const processedDeliveredBy = deliveredBy === '' ? null : deliveredBy;
  
  // Ensure dueAmount is not negative
  const processedDueAmount = dueAmount < 0 ? 0 : (dueAmount || 0);
  
  // Set default values for optional fields
  const processedDiscount = discount || 0;
  const processedTax = tax || 0;
  const processedPaidAmount = paidAmount || 0;
  const processedPaymentMethod = paymentMethod || 'Cash';
  const processedDate = date || new Date();
  const processedType = type || 'wholesale';
  const processedCommissionRate = commissionRate || 0;

  // Calculate commission amount if commission rate is provided
  let calculatedCommissionAmount = 0;
  if (processedCommissionRate && total) {
    calculatedCommissionAmount = (total * processedCommissionRate) / 100;
  }

  // Check if the logged-in user is Super Admin
  const isSuperAdmin = req.user.role === 'Super Admin';
  
  // Set initial status based on user role
  const initialStatus = isSuperAdmin ? 'Approved' : 'Pending';
  const initialApprovalStatus = isSuperAdmin ? 'Approved' : 'Pending';

  // Associate sale order with current shop if available
  const saleOrderData = {
    orderNumber: finalOrderNumber,
    invoiceNumber: `INV-${finalOrderNumber.replace('SO-', '')}`,
    customer: customerId,
    customerEmail: customerEmail || req.user.email || '',
    items,
    subTotal,
    discount: processedDiscount,
    tax: processedTax,
    total,
    paidAmount: processedPaidAmount,
    dueAmount: processedDueAmount,
    paymentMethod: processedPaymentMethod,
    status: initialStatus, // Auto-approve for Super Admin
    approvalStatus: initialApprovalStatus, // Auto-approve for Super Admin
    note: note || '',
    date: processedDate,
    shippingAddress: shippingAddress || '',
    assignedSR: srId,
    deliveredBy: isSuperAdmin ? req.user._id : processedDeliveredBy,
    route: processedRoute,
    type: processedType,
    commissionRate: processedCommissionRate,
    commissionAmount: calculatedCommissionAmount,
    qrCode,
    ...(req.shopId && { shop: req.shopId }), // Only add shop if it exists
    // If created by Super Admin, set approval info immediately
    ...(isSuperAdmin && {
      approvedBy: req.user._id,
      approvedAt: new Date()
    })
  };
  
  // Create sale order with pending or approved status
  const saleOrder = await SaleOrder.create(saleOrderData);
  console.log('[SALE ORDER CREATED] Order created:', {
    id: saleOrder._id,
    orderNumber: saleOrder.orderNumber,
    status: saleOrder.status,
    createdBy: req.user._id,
    isSuperAdmin
  });

  if (!isSuperAdmin && initialApprovalStatus === 'Pending' && req.shopId) {
    try {
      const notification = await createNotification({
        shop: req.shopId,
        type: 'New Order',
        message: `Order ${saleOrder.orderNumber} is pending approval (৳${Number(saleOrder.total || 0).toLocaleString()}).`,
        severity: 'medium',
        audience: 'super_admin',
        actionLabel: 'Review order',
        actionLink: `/dashboard/sales-orders/${saleOrder._id}`,
        metadata: { saleOrderId: saleOrder._id }
      });
      console.log('[SALE ORDER NOTIFICATION] Created pending approval notification:', {
        id: notification._id,
        type: notification.type,
        message: notification.message
      });
    } catch (notifyErr) {
      console.error('[SALE ORDER NOTIFICATION ERROR] Failed to notify super admins of pending order:', notifyErr);
      console.error('[SALE ORDER NOTIFICATION ERROR] Details:', {
        message: notifyErr.message,
        stack: notifyErr.stack
      });
    }
  }

  // If created by Super Admin, update inventory immediately
  if (isSuperAdmin && saleOrder.type !== 'online') {
    for (const item of saleOrder.items) {
      await Inventory.create({
        product: item.product,
        type: 'Sale',
        referenceId: saleOrder._id,
        referenceModel: 'Sale',
        quantity: -item.quantity, // Negative because it's a sale (stock going out)
        unitPrice: item.unitPrice,
        date: saleOrder.date || new Date(),
        note: saleOrder.orderNumber,
        shop: req.shopId
      });
    }

    // Note: Online orders do not affect customer.totalDue directly until converted to Sale
  }

  // Send SMS notification to customer
  try {
    console.log('=== SENDING SMS DEBUG ===');
    console.log('Customer ID from order:', saleOrder.customer);
    
    const customer = await Customer.findById(saleOrder.customer).select('contactName contactNumber');
    
    if (!customer) {
      console.error('Customer not found for SMS:', saleOrder.customer);
    } else {
      // Populate product details in items for SMS
      const orderWithProducts = await SaleOrder.findById(saleOrder._id).populate('items.product', 'name');
      
      console.log('Customer found:', customer.contactName, customer.contactNumber);
      console.log('Order details:', {
        orderNumber: orderWithProducts.orderNumber,
        total: orderWithProducts.total,
        paidAmount: orderWithProducts.paidAmount,
        dueAmount: orderWithProducts.dueAmount,
        itemCount: orderWithProducts.items.length
      });
      
      const smsResult = await sendSaleConfirmationSMS(customer, orderWithProducts, 'order');
      console.log('SMS API Response:', smsResult);
      
      if (smsResult.success) {
        console.log('✅ Order confirmation SMS sent successfully to', customer.contactNumber);
      } else {
        console.error('❌ SMS failed:', smsResult.error);
      }
    }
  } catch (smsError) {
    console.error('Failed to send SMS for order:', smsError);
    console.error('Error details:', smsError.message);
    // Don't fail the request if SMS fails
  }

  // Trigger fraud check asynchronously (do not await to avoid blocking response)
  if (customer && customer.contactNumber) {
    checkFraud(customer.contactNumber)
      .then(async (fraudResult) => {
        try {
          await SaleOrder.findByIdAndUpdate(saleOrder._id, {
            fraudCheck: fraudResult
          });
          
          console.log(`[FRAUD CHECK AUTOMATED] Order ${saleOrder.orderNumber} analyzed. Risk: ${fraudResult.riskLevel}`);
          
          // Generate notification for high risk orders
          if (fraudResult.riskLevel === 'HIGH' && req.shopId) {
             await createNotification({
               shop: req.shopId,
               type: 'Fraud Alert',
               message: `High risk order detected! Order #${saleOrder.orderNumber} has a success ratio of ${fraudResult.successRatio}%.`,
               severity: 'high',
               audience: 'super_admin',
               actionLabel: 'Review Fraud Details',
               actionLink: `/dashboard/fraud-checker`,
               metadata: { saleOrderId: saleOrder._id }
             });
          }
        } catch (updateError) {
          console.error('[FRAUD CHECK ERROR] Failed to update order with fraud data:', updateError);
        }
      })
      .catch(err => {
        console.error('[FRAUD CHECK ERROR] Failed to perform background fraud check:', err);
      });
  } else if (customerId) {
    // If we only have customerId but no customer object in scope, fetch it
    Customer.findById(customerId).select('contactNumber').then(cust => {
      if (cust && cust.contactNumber) {
        checkFraud(cust.contactNumber).then(async (fraudResult) => {
          try {
            await SaleOrder.findByIdAndUpdate(saleOrder._id, {
              fraudCheck: fraudResult
            });
            console.log(`[FRAUD CHECK AUTOMATED] Order ${saleOrder.orderNumber} analyzed. Risk: ${fraudResult.riskLevel}`);
          } catch(e) {
            console.error(e);
          }
        }).catch(console.error);
      }
    });
  }

  res.status(201).json({
    success: true,
    data: saleOrder
  });
});

// @desc    Approve sale order (DSR approves order)
// @route   PUT /api/sales/orders/:id/approve
// @access  Private
const approveSaleOrder = asyncHandler(async (req, res) => {
  // Find sale order and ensure it belongs to the current shop (or is an online order with no shop assigned)
  const query = { _id: req.params.id };
  if (req.shopId) {
    query.$or = [
      { shop: req.shopId },
      { type: 'online' },
      { shop: null }
    ];
  }
  const saleOrder = await SaleOrder.findOne(query);

  if (!saleOrder) {
    return res.status(404).json({
      success: false,
      message: `Sale order not found with id ${req.params.id}`
    });
  }

  // Update approval status
  saleOrder.approvalStatus = 'Approved';
  saleOrder.approvedBy = req.user._id;
  saleOrder.approvedAt = new Date();
  saleOrder.status = 'Approved';

  // Associate e-commerce/online order with the approving shop
  if (!saleOrder.shop && req.shopId) {
    saleOrder.shop = req.shopId;
  }

  // Recalculate commission if needed
  if (saleOrder.commissionRate > 0) {
    saleOrder.commissionAmount = (saleOrder.total * saleOrder.commissionRate) / 100;
  }

  const updatedOrder = await saleOrder.save();

  // Now update inventory since order is approved
  if (updatedOrder.type !== 'online') {
    let needOrderSave = false;

    for (const item of updatedOrder.items) {
      const orderItemIndex = saleOrder.items.findIndex(si => si.product.toString() === item.product.toString());

      await Inventory.create({
        product: item.product,
        type: 'Sale',
        referenceId: updatedOrder._id,
        referenceModel: 'Sale',
        quantity: -item.quantity, // Negative because it's a sale (stock going out)
        unitPrice: item.unitPrice,
        date: updatedOrder.date || new Date(),
        note: updatedOrder.orderNumber,
        shop: req.shopId
      });

      // 1. Deduct from StockBatch (FIFO)
      const StockBatch = mongoose.model('StockBatch');
      const batches = await StockBatch.find({
        product: item.product,
        shop: req.shopId,
        isActive: true,
        remainingQty: { $gt: 0 }
      }).sort({ purchaseDate: 1 });

      let qtyToDeduct = item.quantity;
      let itemPurchaseCost = 0;
      let itemBatchesUsed = [];

      for (const batch of batches) {
        if (qtyToDeduct <= 0) break;
        const deductAmt = Math.min(batch.remainingQty, qtyToDeduct);
        batch.remainingQty -= deductAmt;
        qtyToDeduct -= deductAmt;
        
        itemPurchaseCost += (deductAmt * (batch.purchasePrice || 0));
        itemBatchesUsed.push({
          batch: batch._id,
          quantity: deductAmt,
          purchasePrice: batch.purchasePrice || 0
        });

        if (batch.remainingQty === 0) {
          batch.isActive = false;
        }
        await batch.save();
      }

      if (orderItemIndex > -1) {
        saleOrder.items[orderItemIndex].purchaseCost = itemPurchaseCost;
        saleOrder.items[orderItemIndex].batchesUsed = itemBatchesUsed;
        needOrderSave = true;
      }
    }

    if (needOrderSave) {
      await saleOrder.save();
    }
  }

  // Note: Online orders do not affect customer.totalDue directly until converted to Sale

  res.status(200).json({
    success: true,
    data: updatedOrder
  });
});

// @desc    Mark online sale order as Out for Delivery
// @route   PUT /api/sales-orders/:id/out-for-delivery
// @access  Private
const outForDeliverySaleOrder = asyncHandler(async (req, res) => {
  const { serialNumbers } = req.body; // Expected format: { [itemId]: ['SN1', 'SN2'] }

  const query = { _id: req.params.id };
  if (req.shopId) {
    query.$or = [{ shop: req.shopId }, { type: 'online' }, { shop: null }];
  }
  const saleOrder = await SaleOrder.findOne(query);

  if (!saleOrder) {
    return res.status(404).json({ success: false, message: `Sale order not found with id ${req.params.id}` });
  }

  if (saleOrder.type !== 'online') {
    return res.status(400).json({ success: false, message: 'Only online orders can be marked Out for Delivery' });
  }

  if (saleOrder.status !== 'Approved') {
    return res.status(400).json({ success: false, message: 'Order must be approved first' });
  }

  if (serialNumbers && typeof serialNumbers === 'object') {
    saleOrder.items.forEach(item => {
      if (serialNumbers[item._id.toString()]) {
        item.serialNumbers = serialNumbers[item._id.toString()];
      }
    });
  }

  saleOrder.status = 'Out for Delivery';
  saleOrder.orderStatus = 'Out for Delivery';
  const updatedOrder = await saleOrder.save();

  // Hit stock (deduct)
  let needOrderSave = false;
  for (const item of updatedOrder.items) {
    const orderItemIndex = saleOrder.items.findIndex(si => si.product.toString() === item.product.toString());

    await Inventory.create({
        product: item.product,
        type: 'Sale',
        referenceId: updatedOrder._id,
        referenceModel: 'Sale',
        quantity: -item.quantity,
        unitPrice: item.unitPrice,
        date: updatedOrder.date || new Date(),
        note: updatedOrder.orderNumber,
        shop: req.shopId || saleOrder.shop
      });

    // 1. Deduct from StockBatch (FIFO)
    const StockBatch = mongoose.model('StockBatch');
    const batches = await StockBatch.find({
      product: item.product,
      shop: req.shopId || saleOrder.shop,
      isActive: true,
      remainingQty: { $gt: 0 }
    }).sort({ purchaseDate: 1 });

    let qtyToDeduct = item.quantity;
    let itemPurchaseCost = 0;
    let itemBatchesUsed = [];

    for (const batch of batches) {
      if (qtyToDeduct <= 0) break;
      const deductAmt = Math.min(batch.remainingQty, qtyToDeduct);
      batch.remainingQty -= deductAmt;
      qtyToDeduct -= deductAmt;
      
      itemPurchaseCost += (deductAmt * (batch.purchasePrice || 0));
      itemBatchesUsed.push({
        batch: batch._id,
        quantity: deductAmt,
        purchasePrice: batch.purchasePrice || 0
      });

      if (batch.remainingQty === 0) {
        batch.isActive = false;
      }
      await batch.save();
    }

    if (orderItemIndex > -1) {
      saleOrder.items[orderItemIndex].purchaseCost = itemPurchaseCost;
      saleOrder.items[orderItemIndex].batchesUsed = itemBatchesUsed;
      needOrderSave = true;
    }
  }

  if (needOrderSave) {
    await saleOrder.save();
  }

  res.status(200).json({ success: true, data: updatedOrder });
});

// @desc    Deliver sale order (DSR delivers order)
// @route   PUT /api/sales/orders/:id/deliver
// @access  Private
const deliverSaleOrder = asyncHandler(async (req, res) => {
  // Find sale order and ensure it belongs to the current shop (or is an online order with no shop assigned)
  const query = { _id: req.params.id };
  if (req.shopId) {
    query.$or = [
      { shop: req.shopId },
      { type: 'online' },
      { shop: null }
    ];
  }
  const saleOrder = await SaleOrder.findOne(query);

  if (!saleOrder) {
    return res.status(404).json({
      success: false,
      message: `Sale order not found with id ${req.params.id}`
    });
  }

  if (saleOrder.type === 'online') {
    if (saleOrder.status !== 'Out for Delivery') {
      return res.status(400).json({
        success: false,
        message: 'Online orders must be Out for Delivery before being delivered'
      });
    }
  } else {
    if (saleOrder.approvalStatus !== 'Approved') {
      return res.status(400).json({
        success: false,
        message: 'Order must be approved before delivery'
      });
    }
  }

  // Update delivery status
  saleOrder.status = 'Delivered';
  if (saleOrder.type === 'online') {
    saleOrder.orderStatus = 'Delivered';
    
    if (saleOrder.paymentMethod === 'Cash on Delivery' || saleOrder.paymentMethod === 'cod') {
      saleOrder.paidAmount = saleOrder.total;
      saleOrder.dueAmount = 0;
    }
  }
  saleOrder.deliveredAt = new Date();
  saleOrder.deliveredBy = req.user._id;

  const updatedOrder = await saleOrder.save();

  res.status(200).json({
    success: true,
    data: updatedOrder
  });
});

// @desc    Mark online sale order as Returned
// @route   PUT /api/sales-orders/:id/return
// @access  Private
const returnSaleOrder = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };
  if (req.shopId) {
    query.$or = [{ shop: req.shopId }, { type: 'online' }, { shop: null }];
  }
  const saleOrder = await SaleOrder.findOne(query);

  if (!saleOrder) {
    return res.status(404).json({ success: false, message: `Sale order not found with id ${req.params.id}` });
  }

  if (saleOrder.type !== 'online') {
    return res.status(400).json({ success: false, message: 'Only online orders can be returned this way' });
  }

  if (saleOrder.status !== 'Out for Delivery' && saleOrder.status !== 'Delivered') {
    return res.status(400).json({ success: false, message: 'Order must be Out for Delivery or Delivered to be returned' });
  }

  saleOrder.status = 'Returned';
  saleOrder.orderStatus = 'Returned';
  const updatedOrder = await saleOrder.save();

  // Replenish stock (add)
  for (const item of updatedOrder.items) {
    await Inventory.create({
      product: item.product,
      type: 'Sale Return',
      referenceId: updatedOrder._id,
      referenceModel: 'Sale',
      quantity: item.quantity, // Positive
      unitPrice: item.unitPrice,
      date: new Date(),
      note: updatedOrder.orderNumber,
      shop: req.shopId || saleOrder.shop
    });
  }

  res.status(200).json({ success: true, data: updatedOrder });
});

// @desc    Cancel online sale order
// @route   PUT /api/sales-orders/:id/cancel
// @access  Private
const cancelSaleOrder = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };
  if (req.shopId) {
    query.$or = [{ shop: req.shopId }, { type: 'online' }, { shop: null }];
  }
  const saleOrder = await SaleOrder.findOne(query);

  if (!saleOrder) {
    return res.status(404).json({ success: false, message: `Sale order not found with id ${req.params.id}` });
  }

  // Auth check for Online Customer or Guest
  if (req.user) {
    const allowedRoles = ['Super Admin', 'Admin', 'Manager', 'DSR', 'Online Customer'];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: `Role '${req.user.role}' is not authorized to cancel this resource` });
    }
    if (req.user.role === 'Online Customer') {
      const customer = await Customer.findOne({ userId: req.user._id });
      const belongsToUser = (saleOrder.customerEmail && saleOrder.customerEmail.toLowerCase() === req.user.email.toLowerCase()) ||
                            (customer && saleOrder.customer && saleOrder.customer.toString() === customer._id.toString());
      if (!belongsToUser) {
        return res.status(403).json({ success: false, message: 'Not authorized to cancel this order' });
      }
    }
  } else {
    // Guest check
    const guestEmail = req.headers['x-guest-email'] || req.query.email;
    const orderEmail = saleOrder.customerEmail;
    if (!guestEmail || !orderEmail || orderEmail.toLowerCase() !== guestEmail.toLowerCase()) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
  }

  if (saleOrder.type !== 'online') {
    return res.status(400).json({ success: false, message: 'Only online orders can be cancelled' });
  }

  // Allow cancelling only if order is Pending or Approved (before Out for Delivery)
  if (saleOrder.status !== 'Pending' && saleOrder.status !== 'Approved') {
    return res.status(400).json({ success: false, message: `Orders with status '${saleOrder.status}' cannot be cancelled` });
  }

  saleOrder.status = 'Cancelled';
  saleOrder.orderStatus = 'Cancelled';
  const updatedOrder = await saleOrder.save();

  res.status(200).json({ success: true, data: updatedOrder });
});

// @desc    Update generic order status (Processing, Confirmed, Shipped)
// @route   PUT /api/sales-orders/:id/order-status
// @access  Private
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { orderStatus } = req.body;
  const validStatuses = ['Processing', 'Confirmed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'Returned'];
  
  if (!validStatuses.includes(orderStatus)) {
    return res.status(400).json({ success: false, message: 'Invalid order status' });
  }

  const query = { _id: req.params.id };
  if (req.shopId) {
    query.$or = [{ shop: req.shopId }, { type: 'online' }, { shop: null }];
  }
  
  const saleOrder = await SaleOrder.findOne(query);
  if (!saleOrder) {
    return res.status(404).json({ success: false, message: 'Sale order not found' });
  }
  
  saleOrder.orderStatus = orderStatus;
  
  const updatedOrder = await saleOrder.save();

  res.json({ success: true, data: updatedOrder });
});





// @desc    Get all sale orders
// @route   GET /api/sales/orders
// @access  Private
const getSaleOrders = asyncHandler(async (req, res) => {
  const { type, startDate, endDate, status, approvalStatus, assignedSR, customer, page, limit, search } = req.query;

  // Filter by shop if shop context is available, but also include online orders that have no shop assigned
  const shopFilter = req.shopId ? {
    $or: [
      { shop: req.shopId },
      { type: 'online', shop: null },
      { shop: null }
    ]
  } : {};
  
  let filter = { ...shopFilter };

  if (type) {
    filter.type = type;
  }
  if (status) {
    filter.status = status;
  }
  if (approvalStatus) {
    filter.approvalStatus = approvalStatus;
  }
  if (assignedSR) {
    filter.assignedSR = assignedSR;
  }
  if (customer) {
    filter.customer = customer;
  }

  if (search) {
    const searchRegex = new RegExp(search, 'i');
    const searchNumber = Number(search);
    const searchNumberQuery = !isNaN(searchNumber) ? { total: searchNumber } : null;

    const matchingCustomers = await Customer.find({
      $or: [
        { contactName: searchRegex },
        { contactNumber: searchRegex }
      ]
    }).select('_id');
    const customerIds = matchingCustomers.map(c => c._id);

    const searchConditions = [
      { orderNumber: searchRegex },
      { customer: { $in: customerIds } }
    ];

    if (searchNumberQuery) {
      searchConditions.push(searchNumberQuery);
    }

    filter.$and = filter.$and || [];
    filter.$and.push({ $or: searchConditions });
  }

  // Add date range filtering if provided
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      filter.date.$gte = start;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.date.$lte = end;
    }
  }

  // Exclude heavy fields if present
  const selectQuery = '-qrCode';

  let query = SaleOrder.find(filter)
    .select(selectQuery)
    .populate('customer', 'contactName contactNumber customerType address')
    .populate('assignedSR', 'name')
    .populate('deliveredBy', 'name')
    .populate('approvedBy', 'name')
    .populate({
      path: 'items.product',
      select: 'name sku image category brand',
      populate: { path: 'category', select: 'name' }
    })
    .sort({ createdAt: -1 });

  // Optional pagination
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  
  if (pageNum && limitNum) {
    query = query.skip((pageNum - 1) * limitNum).limit(limitNum);
  }

  const saleOrders = await query.lean();

  const responseData = {
    success: true,
    count: saleOrders.length,
    data: saleOrders
  };

  if (pageNum && limitNum) {
    const total = await SaleOrder.countDocuments(filter);
    responseData.total = total;
    responseData.page = pageNum;
    responseData.totalPages = Math.ceil(total / limitNum);
  }

  res.status(200).json(responseData);
});

// @desc    Get single sale order
// @route   GET /api/sales/orders/:id
// @access  Private
const getSaleOrder = asyncHandler(async (req, res) => {
  // Find sale order and ensure it belongs to the current shop (or is an online order with no shop assigned)
  const query = { _id: req.params.id };
  if (req.shopId) {
    query.$or = [
      { shop: req.shopId },
      { type: 'online' },
      { shop: null }
    ];
  }
  const saleOrder = await SaleOrder.findOne(query)
    .populate('customer', 'contactName contactNumber totalDue email address businessName customerType')
    .populate('assignedSR', 'name')
    .populate('deliveredBy', 'name')
    .populate('approvedBy', 'name')
    // .populate('route', 'name')
    .populate('items.product', 'name');

  if (!saleOrder) {
    return res.status(404).json({
      success: false,
      message: `Sale order not found with id ${req.params.id}`
    });
  }

  // Auth check for Online Customer or Guest
  if (req.user) {
    const allowedRoles = ['Super Admin', 'Admin', 'Manager', 'SR', 'DSR', 'Online Customer'];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: `Role '${req.user.role}' is not authorized to access this resource` });
    }
    if (req.user.role === 'Online Customer') {
      const customer = await Customer.findOne({ userId: req.user._id });
      const belongsToUser = (saleOrder.customerEmail && saleOrder.customerEmail.toLowerCase() === req.user.email.toLowerCase()) ||
                            (customer && saleOrder.customer && saleOrder.customer._id.toString() === customer._id.toString());
      if (!belongsToUser) {
        return res.status(403).json({ success: false, message: 'Not authorized to view this order' });
      }
    }
  } else {
    // Guest check
    const guestEmail = req.headers['x-guest-email'] || req.query.email;
    const orderEmail = saleOrder.customerEmail || (saleOrder.customer && saleOrder.customer.email);
    if (!guestEmail || !orderEmail || orderEmail.toLowerCase() !== guestEmail.toLowerCase()) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
  }

  res.status(200).json({
    success: true,
    data: saleOrder
  });
});

// @desc    Update sale order payment information
// @route   PUT /api/sales/orders/:id/payment
// @access  Private
const updateSaleOrderPayment = asyncHandler(async (req, res) => {
  const { paidAmount, dueAmount, paymentMethod, commissionRate } = req.body;

  // Find sale order and ensure it belongs to the current shop (or is an online order with no shop assigned)
  const query = { _id: req.params.id };
  if (req.shopId) {
    query.$or = [
      { shop: req.shopId },
      { type: 'online' },
      { shop: null }
    ];
  }
  let saleOrder = await SaleOrder.findOne(query);

  if (!saleOrder) {
    return res.status(404).json({
      success: false,
      message: `Sale order not found with id ${req.params.id}`
    });
  }

  // Validate required fields
  if (typeof paidAmount !== 'undefined' && paidAmount < 0) {
    return res.status(400).json({
      success: false,
      message: 'Paid amount cannot be negative'
    });
  }

  if (typeof dueAmount !== 'undefined' && dueAmount < 0) {
    return res.status(400).json({
      success: false,
      message: 'Due amount cannot be negative'
    });
  }

  // Update payment-related fields
  const updateFields = {};
  if (typeof paidAmount !== 'undefined') updateFields.paidAmount = paidAmount;
  if (typeof dueAmount !== 'undefined') updateFields.dueAmount = dueAmount;
  if (paymentMethod) updateFields.paymentMethod = paymentMethod;
  
  // Update commission rate if provided
  if (typeof commissionRate !== 'undefined') {
    updateFields.commissionRate = commissionRate;
    // Recalculate commission amount
    updateFields.commissionAmount = (saleOrder.total * commissionRate) / 100;
  }

  // Automatically calculate status based on due amount
  if (typeof dueAmount !== 'undefined') {
    if (dueAmount === 0) {
      updateFields.status = 'Completed';
    } else if (dueAmount > 0 && paidAmount > 0) {
      updateFields.status = 'Partial';
    }
  }

  // Note: Online orders do not affect customer.totalDue directly until converted to Sale

  // Update the sale order with new payment information
  saleOrder = await SaleOrder.findByIdAndUpdate(
    req.params.id,
    updateFields,
    { new: true, runValidators: true }
  )
  .populate('customer', 'contactName contactNumber customerType address')
  .populate('assignedSR', 'name')
  .populate('deliveredBy', 'name')
  .populate('approvedBy', 'name')
  // .populate('route', 'name')
  .populate('items.product', 'name');

  res.status(200).json({
    success: true,
    data: saleOrder
  });
});

// @desc    Get company-wise sales analytics
// @route   GET /api/sales/company-analytics
// @access  Private
const getSupplierWiseSalesAnalytics = asyncHandler(async (req, res) => {
  const { startDate, endDate, supplierId } = req.query;

  let matchCondition = { status: { $in: ['Approved', 'Delivered'] } };

  if (startDate || endDate) {
    matchCondition.date = {};
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      matchCondition.date.$gte = start;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      matchCondition.date.$lte = end;
    }
  }

  if (supplierId) {
    // Need to join with products to get company information
    const analytics = await SaleOrder.aggregate([
      { $match: matchCondition },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'productDetails'
        }
      },
      {
        $unwind: '$items'
      },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'itemProduct'
        }
      },
      {
        $unwind: '$itemProduct'
      },
      {
        $match: {
          'itemProduct.company': mongoose.Types.ObjectId(supplierId)
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
            supplier: "$itemProduct.supplier"
          },
          totalSales: { $sum: { $multiply: ["$items.quantity", "$items.unitPrice"] } },
          totalQuantity: { $sum: "$items.quantity" },
          orderCount: { $addToSet: "$_id" }
        }
      },
      {
        $group: {
          _id: "$_id.supplier",
          dailySales: { $push: { date: "$_id.date", sales: "$totalSales", quantity: "$totalQuantity" } },
          totalSales: { $sum: "$totalSales" },
          totalQuantity: { $sum: "$totalQuantity" },
          orderCount: { $sum: { $size: "$orderCount" } }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: analytics
    });
  } else {
    // Get analytics for all companies
    const analytics = await SaleOrder.aggregate([
      { $match: matchCondition },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'productDetails'
        }
      },
      {
        $unwind: '$items'
      },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'itemProduct'
        }
      },
      {
        $unwind: '$itemProduct'
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
            supplier: "$itemProduct.supplier"
          },
          totalSales: { $sum: { $multiply: ["$items.quantity", "$items.unitPrice"] } },
          totalQuantity: { $sum: "$items.quantity" },
          orderCount: { $addToSet: "$_id" }
        }
      },
      {
        $group: {
          _id: "$_id.supplier",
          dailySales: { $push: { date: "$_id.date", sales: "$totalSales", quantity: "$totalQuantity" } },
          totalSales: { $sum: "$totalSales" },
          totalQuantity: { $sum: "$totalQuantity" },
          orderCount: { $sum: { $size: "$orderCount" } }
        }
      },
      {
        $lookup: {
          from: "suppliers",
          localField: '_id',
          foreignField: '_id',
          as: 'supplierInfo'
        }
      },
      {
        $unwind: '$supplierInfo'
      },
      {
        $project: {
          _id: 1,
          supplierName: '$supplierInfo.name',
          totalSales: 1,
          totalQuantity: 1,
          orderCount: 1,
          dailySales: 1
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: analytics
    });
  }
});

// @desc    Get SR-wise sales analytics
// @route   GET /api/sales/sr-analytics
// @access  Private
const getSrWiseSalesAnalytics = asyncHandler(async (req, res) => {
  const { startDate, endDate, srId } = req.query;

  let matchCondition = { status: { $in: ['Approved', 'Delivered'] } };

  if (startDate || endDate) {
    matchCondition.date = {};
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      matchCondition.date.$gte = start;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      matchCondition.date.$lte = end;
    }
  }

  if (srId) {
    matchCondition.assignedSR = mongoose.Types.ObjectId(srId);
  }

  const analytics = await SaleOrder.aggregate([
    { $match: matchCondition },
    {
      $group: {
        _id: {
          sr: "$assignedSR",
          date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } }
        },
        totalSales: { $sum: "$total" },
        totalOrders: { $sum: 1 },
        deliveredOrders: { $sum: { $cond: [{ $eq: ["$status", "Delivered"] }, 1, 0] } },
        pendingOrders: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } },
        approvedOrders: { $sum: { $cond: [{ $eq: ["$status", "Approved"] }, 1, 0] } },
        totalCommission: { $sum: "$commissionAmount" }
      }
    },
    {
      $group: {
        _id: "$_id.sr",
        dailySales: { $push: { date: "$_id.date", sales: "$totalSales", orders: "$totalOrders" } },
        totalSales: { $sum: "$totalSales" },
        totalOrders: { $sum: "$totalOrders" },
        deliveredOrders: { $sum: "$deliveredOrders" },
        pendingOrders: { $sum: "$pendingOrders" },
        approvedOrders: { $sum: "$approvedOrders" },
        totalCommission: { $sum: "$totalCommission" }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'srInfo'
      }
    },
    {
      $unwind: '$srInfo'
    },
    {
      $project: {
        _id: 1,
        srName: '$srInfo.name',
        srEmail: '$srInfo.email',
        totalSales: 1,
        totalOrders: 1,
        deliveredOrders: 1,
        pendingOrders: 1,
        approvedOrders: 1,
        totalCommission: 1,
        dailySales: 1
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: analytics
  });
});

// @desc    Generate sale order invoice
// @route   GET /api/sales/orders/:id/invoice
// @access  Private
const generateOrderInvoice = asyncHandler(async (req, res) => {
  const saleOrder = await SaleOrder.findById(req.params.id)
    .populate('customer', 'contactName contactNumber address totalDue customerType')
    .populate('assignedSR', 'name')
    .populate('items.product', 'name image images');

  if (!saleOrder) {
    return res.status(404).json({
      success: false,
      message: `Sale order not found with id ${req.params.id}`
    });
  }

  // Get company settings with shop context
  let settings = await Setting.findOne(saleOrder.shop ? { shop: saleOrder.shop } : {}).sort({ updatedAt: -1 });
  if (!settings) {
    settings = await Setting.findOne().sort({ updatedAt: -1 });
  }
  if (!settings) {
    return res.status(404).json({
      success: false,
      message: 'Company settings not found'
    });
  }

  // If no logo in settings, use the default logo URL
  if (!settings.logo) {
    const logoUrl = `${req.protocol}://${req.get('host')}/api/public/logo`;
    settings.logo = logoUrl;
  } else {
    // If logo is set but it's a relative path, make sure it's a complete URL
    if (settings.logo.startsWith('/')) {
      const logoUrl = `${req.protocol}://${req.get('host')}${settings.logo}`;
      settings.logo = logoUrl;
    }
  }

  // Check if the request wants HTML, PDF, or Print format
  const format = req.query.format || 'pdf'; // Default to PDF

  if (format === 'html') {
    // Return HTML for preview
    const html = await generateInvoiceHTMLString(saleOrder, settings);
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } else if (format === 'print') {
    // Return HTML optimized for printing
    const html = await generateInvoiceHTMLForPrint(saleOrder, settings);
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } else {
    // Generate and return PDF
    try {
      const pdfBuffer = await generateInvoicePDF(saleOrder, settings);
      
      if (!pdfBuffer) {
        console.error('PDF generation returned null/undefined');
        return res.status(500).send(`
          <!DOCTYPE html>
          <html>
            <head><title>Error - PDF Generation Failed</title></head>
            <body style="font-family: Arial, sans-serif; padding: 50px; background: #f5f5f5;">
              <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <h1 style="color: #f44336;">❌ PDF Generation Failed</h1>
                <p style="color: #666; font-size: 16px;">PDF generation returned empty result.</p>
                <p style="color: #999; font-size: 14px;">Please try again or contact support.</p>
              </div>
            </body>
          </html>
        `);
      }
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="order-invoice-${saleOrder.orderNumber}.pdf"`);
      res.send(pdfBuffer);
    } catch (pdfError) {
      console.error('PDF Generation Error:', pdfError);
      console.error('Error details:', JSON.stringify(pdfError, Object.getOwnPropertyNames(pdfError)));
      
      return res.status(500).send(`
        <!DOCTYPE html>
        <html>
          <head><title>Error - PDF Generation Failed</title></head>
          <body style="font-family: Arial, sans-serif; padding: 50px; background: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <h1 style="color: #f44336;">❌ PDF Generation Error</h1>
              <p style="color: #666; font-size: 16px;">There was an error generating the invoice PDF.</p>
              <p style="color: #999; font-size: 14px; margin-top: 20px;"><strong>Error Details:</strong></p>
              <p style="color: #666; font-size: 13px; background: #f5f5f5; padding: 10px; border-radius: 4px;">${pdfError.message || 'Unknown error'}</p>
              <p style="color: #999; font-size: 12px; margin-top: 15px;">Please try again or contact support if the issue persists.</p>
            </div>
          </body>
        </html>
      `);
    }
  }
});

// @desc    Calculate SR commission
// @route   GET /api/sales/orders/sr-commission/:srId
// @access  Private
const calculateSRCommission = asyncHandler(async (req, res) => {
  const { srId } = req.params;
  const { startDate, endDate, status } = req.query;

  let matchCondition = { assignedSR: mongoose.Types.ObjectId(srId) };
  
  if (status) {
    matchCondition.status = status;
  } else {
    // By default, only include completed/approved orders
    matchCondition.status = { $in: ['Approved', 'Delivered', 'Completed'] };
  }
  
  if (startDate || endDate) {
    matchCondition.date = {};
    if (startDate) matchCondition.date.$gte = new Date(startDate);
    if (endDate) matchCondition.date.$lte = new Date(endDate);
  }

  const commissionData = await SaleOrder.aggregate([
    { $match: matchCondition },
    {
      $group: {
        _id: null,
        totalSales: { $sum: "$total" },
        totalCommission: { $sum: "$commissionAmount" },
        totalOrders: { $sum: 1 },
        completedOrders: { $sum: { $cond: [{ $in: ["$status", ["Delivered", "Completed"]]}, 1, 0] } }
      }
    }
  ]);

  const result = commissionData[0] || { totalSales: 0, totalCommission: 0, totalOrders: 0, completedOrders: 0 };

  res.status(200).json({
    success: true,
    data: result
  });
});

// @desc    Convert sale order to sale
// @route   POST /api/sales/orders/:id/convert-to-sale
// @access  Private
const convertSaleOrderToSale = asyncHandler(async (req, res) => {
  const Sale = require('../models/Sale');
  
  const saleOrder = await SaleOrder.findById(req.params.id)
    .populate('customer', 'contactName contactNumber address')
    .populate('items.product', 'name')
    .populate('assignedSR', 'name email')
    // .populate('route', 'name');

  if (!saleOrder) {
    return res.status(404).json({ 
      success: false,
      message: 'Sale order not found' 
    });
  }

  if (saleOrder.approvalStatus !== 'Approved') {
    return res.status(400).json({ 
      success: false,
      message: 'Only approved orders can be converted to sales' 
    });
  }

  // Create a new Sale from the SaleOrder
  const saleData = {
    shop: saleOrder.shop,
    invoiceNumber: `INV-${(saleOrder.orderNumber || '').replace('SO-', '')}`,
    customer: saleOrder.customer._id,
    items: saleOrder.items.map(item => ({
      product: item.product._id,
      productName: item.product.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: item.discount || 0,
      tax: item.tax || 0
    })),
    subTotal: saleOrder.subTotal,
    discount: saleOrder.discount,
    tax: saleOrder.tax,
    total: saleOrder.total,
    paidAmount: saleOrder.paidAmount,
    dueAmount: saleOrder.dueAmount,
    paymentMethod: saleOrder.paymentMethod,
    status: 'Pending',
    note: saleOrder.note || `Converted from Order #${saleOrder.orderNumber || 'N/A'}`,
    date: saleOrder.date,
    shippingAddress: saleOrder.shippingAddress,
    assignedSR: saleOrder.assignedSR?._id,
    deliveredBy: saleOrder.deliveredBy,
    route: saleOrder.route?._id,
    type: saleOrder.type,
    commissionRate: saleOrder.commissionRate,
    commissionAmount: saleOrder.commissionAmount,
    order: saleOrder._id // Link back to original order
  };

  const sale = await Sale.create(saleData);

  // Update sale order status
  saleOrder.status = 'Converted';
  await saleOrder.save();

  // Populate the created sale for response
  const populatedSale = await Sale.findById(sale._id)
    .populate('customer', 'contactName contactNumber address')
    .populate('items.product', 'name');

  res.status(201).json({
    success: true,
    message: 'Sale order converted to sale successfully',
    data: populatedSale
  });
});

// @desc    Get customer's orders (for e-commerce dashboard)
// @route   GET /api/sales-orders/my
// @access  Private (Customer/User)
const getMyOrders = asyncHandler(async (req, res) => {
  try {
    // 1. Try to find customer linked to this user ID, OR matching their email/phone
    let customer = await Customer.findOne({ 
      $or: [
        { userId: req.user._id },
        { email: new RegExp(`^${req.user.email}$`, 'i') },
        { contactNumber: req.user.phone }
      ]
    });
    
    // 2. Auto-heal: If we found a customer that belongs to this user but isn't linked yet, link them!
    if (customer && !customer.userId) {
      customer.userId = req.user._id;
      await customer.save();
    }
    
    // 3. Build query: Match by customer reference OR directly by email for legacy guest orders
    let query = {
      $or: [
        { customerEmail: new RegExp(`^${req.user.email}$`, 'i') }
      ]
    };

    if (customer) {
      query.$or.push({ customer: customer._id });
    }
    
    const orders = await SaleOrder.find(query)
      .populate('customer', 'contactName contactNumber email')
      .populate('items.product', 'name images price')
      .populate('assignedSR', 'name')
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    console.error('Error fetching customer orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      error: error.message
    });
  }
});

// @desc    Get single customer order (for e-commerce dashboard)
// @route   GET /api/sales-orders/my/:id
// @access  Private (Customer/User)
const getMyOrderDetails = asyncHandler(async (req, res) => {
  try {
    let customer = await Customer.findOne({ 
      $or: [
        { userId: req.user._id },
        { email: new RegExp(`^${req.user.email}$`, 'i') },
        { contactNumber: req.user.phone }
      ]
    });
    
    let query = {
      _id: req.params.id,
      $or: [
        { customerEmail: new RegExp(`^${req.user.email}$`, 'i') }
      ]
    };

    if (customer) {
      query.$or.push({ customer: customer._id });
    }
    
    const order = await SaleOrder.findOne(query)
      .populate('customer', 'contactName contactNumber email')
      .populate('items.product', 'name images price')
      .populate('assignedSR', 'name');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or access denied'
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error fetching customer order details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching order details',
      error: error.message
    });
  }
});

// @desc    Lookup guest orders by email
// @route   POST /api/sales-orders/guest-lookup
// @access  Public
const lookupGuestOrders = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email address is required'
    });
  }

  try {
    // Find orders by customer email
    const orders = await SaleOrder.find({
      'customerEmail': email
    })
      .populate('customer', 'contactName contactNumber email')
      .populate('items.product', 'name images')
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({
      success: true,
      count: orders.length,
      orders: orders
    });
  } catch (error) {
    console.error('Error looking up guest orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error looking up orders',
      error: error.message
    });
  }
});

// @desc    Edit sale order
// @route   PUT /api/sales-orders/:id/edit
// @access  Private (Super Admin / Admin)
const editSaleOrder = asyncHandler(async (req, res) => {
  const {
    customer,
    items,
    subTotal,
    discount,
    tax,
    total,
    dueAmount,
    paymentMethod,
    note,
    additionalExpense,
    deliveryCharge,
    installationCost,
    isOperatingExpense,
    isOperatingDelivery,
    isOperatingInstallation
  } = req.body;

  let saleOrder = await SaleOrder.findById(req.params.id);

  if (!saleOrder) {
    return res.status(404).json({
      success: false,
      message: `Sale order not found with id ${req.params.id}`
    });
  }

  // Update fields
  saleOrder.customer = customer || saleOrder.customer;
  saleOrder.items = items || saleOrder.items;
  saleOrder.subTotal = typeof subTotal !== 'undefined' ? subTotal : saleOrder.subTotal;
  saleOrder.discount = typeof discount !== 'undefined' ? discount : saleOrder.discount;
  saleOrder.tax = typeof tax !== 'undefined' ? tax : saleOrder.tax;
  saleOrder.total = typeof total !== 'undefined' ? total : saleOrder.total;
  saleOrder.paidAmount = typeof paidAmount !== 'undefined' ? paidAmount : saleOrder.paidAmount;
  saleOrder.dueAmount = typeof dueAmount !== 'undefined' ? dueAmount : saleOrder.dueAmount;
  saleOrder.paymentMethod = paymentMethod || saleOrder.paymentMethod;
  saleOrder.note = typeof note !== 'undefined' ? note : saleOrder.note;
  if (typeof additionalExpense !== 'undefined') saleOrder.additionalExpense = Math.max(0, Number(additionalExpense) || 0);
  if (typeof deliveryCharge !== 'undefined') saleOrder.deliveryCharge = Math.max(0, Number(deliveryCharge) || 0);
  if (typeof installationCost !== 'undefined') saleOrder.installationCost = Math.max(0, Number(installationCost) || 0);
  if (typeof isOperatingExpense !== 'undefined') saleOrder.isOperatingExpense = Boolean(isOperatingExpense);
  if (typeof isOperatingDelivery !== 'undefined') saleOrder.isOperatingDelivery = Boolean(isOperatingDelivery);
  if (typeof isOperatingInstallation !== 'undefined') saleOrder.isOperatingInstallation = Boolean(isOperatingInstallation);

  await saleOrder.save();

  res.status(200).json({
    success: true,
    data: saleOrder
  });
});

module.exports = {
  createSaleOrder,
  approveSaleOrder,
  deliverSaleOrder,
  getSaleOrders,
  getSaleOrder,
  updateSaleOrderPayment,
  getSupplierWiseSalesAnalytics,
  getSrWiseSalesAnalytics,
  generateOrderInvoice,
  calculateSRCommission,
  convertSaleOrderToSale,
  getMyOrders,
  getMyOrderDetails,
  lookupGuestOrders,
  outForDeliverySaleOrder,
  returnSaleOrder,
  cancelSaleOrder,
  updateOrderStatus,
  editSaleOrder
};