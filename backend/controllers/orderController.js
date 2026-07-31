const SaleOrder = require('../models/SaleOrder');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const User = require('../models/User');
const Setting = require('../models/Setting');
const EMIInvoice = require('../models/EMIInvoice');
const asyncHandler = require('express-async-handler');
const QRCode = require('qrcode');

// @desc    Create e-commerce order (from cart checkout)
// @route   POST /api/orders
// @access  Public (for guests) or Private (for logged-in users)
const createEcommerceOrder = asyncHandler(async (req, res) => {
  try {
    const {
      customerName,
      customerPhone,
      customerEmail,
      shippingAddress,
      deliveryMode,
      deliveryArea,
      orderItems,
      subtotal,
      deliveryCharge,
      discount,
      total,
      paymentMethod,
      emiOption,
      isGuest
    } = req.body;

    console.log('[ORDER CREATE] Request body:', { 
      customerName, 
      customerPhone, 
      orderItemsCount: orderItems?.length,
      total,
      paymentMethod 
    });

    // Validate required fields
    if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one item is required'
      });
    }

    if (!subtotal || subtotal <= 0) {
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

    // For e-commerce, shopId is not required in single-shop architecture
    const shopId = null;

    // Find or create customer
    let customerId;
    let customerDoc;

    if (!isGuest && req.user) {
      // Logged-in user - find their customer profile
      // Try to find customer linked to this user ID, OR matching their email/phone
      customerDoc = await Customer.findOne({ 
        $or: [
          { userId: req.user._id },
          { email: new RegExp(`^${req.user.email}$`, 'i') },
          { contactNumber: req.user.phone }
        ]
      });
      
      // If no customer record exists at all, create one
      if (!customerDoc) {
        customerDoc = await Customer.create({
          contactName: customerName || req.user.name,
          contactNumber: customerPhone || req.user.phone,
          email: customerEmail || req.user.email,
          address: shippingAddress?.address || '',
          contactType: 'Customer',
          customerType: 'Online',
          userId: req.user._id
        });
      } else {
        // Auto-heal: Link user to customer if not linked
        if (!customerDoc.userId) {
          customerDoc.userId = req.user._id;
          await customerDoc.save();
        }
      }
      customerId = customerDoc._id;
    } else {
      // Guest checkout - find or create customer by email/phone
      customerDoc = await Customer.findOne({
        $or: [
          { email: customerEmail },
          { contactNumber: customerPhone }
        ]
      });

      if (!customerDoc) {
        // Create new customer for guest
        customerDoc = await Customer.create({
          contactName: customerName,
          contactNumber: customerPhone,
          email: customerEmail,
          address: shippingAddress?.address || '',
          contactType: 'Customer',
          customerType: 'Individual'
        });
      }
      customerId = customerDoc._id;
    }

    // Find default SR (any active staff/admin in the system)
    let assignedSR;

    const defaultSR = await User.findOne({
      role: { $in: ['SR', 'DSR', 'Sales Staff'] },
      isActive: true
    }).select('_id');

    if (defaultSR) {
      assignedSR = defaultSR._id;
    } else {
      const admin = await User.findOne({
        role: { $in: ['Admin', 'Super Admin'] },
        isActive: true
      }).select('_id');
      if (admin) assignedSR = admin._id;
    }

    if (!assignedSR) {
      return res.status(400).json({
        success: false,
        message: 'No sales representative available. Please contact support.'
      });
    }

    // Generate order number
    const orderNumber = `SO-ECOM-${Date.now()}`;
    const invoiceNumber = `INV-ECOM-${Date.now()}`;

    // Generate QR code
    const qrCode = await QRCode.toDataURL(`ORDER_${orderNumber}_${Date.now()}`);

    // Prepare items for sale order
    const items = orderItems.map(item => ({
      product: item.product,
      quantity: item.quantity || 1,
      unitPrice: item.price || 0,
      discount: 0,
      tax: 0
    }));

    // Calculate tax (if needed)
    const tax = 0; // Can be calculated based on settings

    // Create sale order
    const saleOrderData = {
      shop: shopId,
      type: 'online', // E-commerce orders are online
      orderNumber,
      invoiceNumber,
      customer: customerId,
      customerEmail: customerEmail || '',
      items,
      subTotal: subtotal,
      discount: discount || 0,
      tax,
      deliveryCharge: deliveryCharge || 0,
      total,
      paidAmount: 0, // Will be paid on delivery
      dueAmount: total,
      paymentMethod: 'Cash on Delivery', // COD default
      status: 'Pending',
      approvalStatus: 'Pending',
      date: new Date(),
      shippingAddress: `${shippingAddress?.address || ''}, ${shippingAddress?.city || ''}, ${shippingAddress?.state || ''}`,
      assignedSR,
      note: `E-commerce order - Delivery: ${deliveryArea || 'inside'} Dhaka`,
      qrCode,
      orderStatus: 'Processing' // E-commerce tracking status
    };

    const saleOrder = await SaleOrder.create(saleOrderData);

    // If EMI option selected, create EMI Invoice
    let emiInvoice = null;
    if (paymentMethod === 'emi' && req.body.emiOption) {
      try {
        const { duration, downPayment, interestRate } = req.body.emiOption;
        
        // Calculate EMI details
        const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const totalAmount = subtotal + (deliveryCharge || 0);
        const interestAmount = totalAmount * (interestRate / 100);
        const totalPayable = totalAmount + interestAmount - downPayment;
        const monthlyInstalment = totalPayable / duration;

        // Generate instalment schedule
        const instalments = [];
        const startDate = new Date();
        
        for (let i = 1; i <= duration; i++) {
          const dueDate = new Date(startDate);
          dueDate.setMonth(dueDate.getMonth() + i);
          
          instalments.push({
            instalmentNumber: i,
            dueDate: dueDate,
            amount: monthlyInstalment,
            paidAmount: 0,
            status: 'pending'
          });
        }

        // Create EMI Invoice
        emiInvoice = await EMIInvoice.create({
          customer: customerId,
          customerName: customerName,
          customerPhone: customerPhone,
          customerAddress: `${shippingAddress?.address || ''}, ${shippingAddress?.city || ''}`,
          showroom: 'E-Commerce',
          invoiceNumber: `EMI-ECOM-${Date.now()}`,
          invoiceDate: new Date(),
          relatedSaleOrder: saleOrder._id,
          products: orderItems.map(item => ({
            product: item.product,
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.price,
            total: item.price * item.quantity
          })),
          subtotal,
          deliveryCharge: deliveryCharge || 0,
          installationCost: 0,
          cardCharge: 0,
          discount: discount || 0,
          tax: 0,
          totalAmount,
          emiPlan: {
            planType: `${duration}months`,
            duration,
            interestRate,
            interestAmount,
            totalPayableAmount: totalPayable,
            monthlyInstalment
          },
          downPayment: {
            amount: downPayment,
            paidAt: new Date(),
            method: 'cash'
          },
          paidAmount: downPayment,
          outstandingBalance: totalPayable,
          instalments,
          status: 'active',
          isActive: true,
          createdBy: assignedSR
        });

        // Update sale order with EMI reference
        saleOrder.paymentMethod = 'EMI';
        saleOrder.note = `${saleOrder.note} | EMI Invoice: ${emiInvoice.invoiceNumber}`;
        await saleOrder.save();

      } catch (emiError) {
        console.error('Failed to create EMI invoice:', emiError);
        // Don't fail the order if EMI creation fails
      }
    }

    // Send notification to admin/SR about new order
    try {
      const { createNotification } = require('../utils/notificationFeed');
      const emiText = emiInvoice ? ` (EMI: ${emiInvoice.invoiceNumber})` : '';
      await createNotification({
        shop: shopId,
        type: 'New Order',
        message: `New e-commerce order ${orderNumber} from ${customerName} (৳${total.toLocaleString()})${emiText}`,
        severity: emiInvoice ? 'high' : 'medium',
        audience: 'super_admin',
        actionLabel: 'Review order',
        actionLink: `/dashboard/sales-orders/${saleOrder._id}`,
        metadata: { 
          saleOrderId: saleOrder._id,
          emiInvoiceId: emiInvoice?._id,
          customerName,
          customerPhone,
          isEcommerce: true,
          isEMI: !!emiInvoice
        }
      });
    } catch (notifyErr) {
      console.error('Failed to send notification for e-commerce order:', notifyErr);
    }

    res.status(201).json({
      success: true,
      message: emiInvoice ? 'Order placed successfully with EMI plan!' : 'Order placed successfully!',
      data: {
        orderId: saleOrder._id,
        orderNumber: saleOrder.orderNumber,
        total: saleOrder.total,
        status: saleOrder.status,
        paymentMethod: saleOrder.paymentMethod,
        estimatedDelivery: '2-3 business days',
        ...(emiInvoice && {
          emiDetails: {
            invoiceNumber: emiInvoice.invoiceNumber,
            duration: emiInvoice.emiPlan.duration,
            downPayment: emiInvoice.downPayment.amount,
            monthlyInstalment: emiInvoice.emiPlan.monthlyInstalment,
            nextDueDate: emiInvoice.instalments[0]?.dueDate
          }
        })
      }
    });
  } catch (error) {
    console.error('[ORDER CREATE] CRITICAL ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error during order creation',
      error: error.message
    });
  }
});

module.exports = {
  createEcommerceOrder
};
