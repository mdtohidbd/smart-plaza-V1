const asyncHandler = require('express-async-handler');
const Sale = require('../models/Sale');
const Customer = require('../models/Customer');
const { sendSaleConfirmationSMS } = require('../utils/smsService');
const {
  validateStock,
  deductInventoryForSale,
  createWarrantyRecords,
  updateCustomerDue,
  allocateSerialNumbers
} = require('../utils/saleHelpers');
const Product = require('../models/Product');
const StockBatch = require('../models/StockBatch');
const WarrantyTemplate = require('../models/WarrantyTemplate');
const MFSProvider = require('../models/MFSProvider');
const POSMachine = require('../models/POSMachine');
const {
  buildCustomerSalesInvoice,
  buildCustomerTaxInvoice,
  buildFabricatedSalesInvoice,
  buildFabricatedTaxInvoice
} = require('../utils/invoiceCalculator');
const { syncSaleLedgerEntries } = require('../utils/accountLedgerSync');
const { sanitizeSalesListForRole, sanitizeSaleForRole } = require('../utils/roleUtils');

// @desc    Get retail sales
// @route   GET /api/sales/retail
// @access  Private
const getRetailSales = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;

  // Build query
  const query = { 
    type: 'retail',
    shop: req.shopId 
  };

  // Execute query
  const sales = await Sale.find(query)
    .populate('customer', 'contactName contactNumber')
    .sort({ createdAt: -1 })
    .skip(startIndex)
    .limit(limit);

  // Get total count
  const total = await Sale.countDocuments(query);

  res.status(200).json({
    success: true,
    count: sales.length,
    total,
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    },
    data: sanitizeSalesListForRole(sales, req.user)
  });
});

// @desc    Create retail sale
// @route   POST /api/sales (dispatched from routes based on type='retail')
// @access  Private
const createRetailSale = asyncHandler(async (req, res) => {
  let {
    invoiceNumber,
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
    invoiceType,
    warrantyData,
    payments,
    deliveryCharge,
    installationCost,
    additionalExpense,
    isOperatingExpense,
    isOperatingDelivery,
    isOperatingInstallation
  } = req.body;

  // Validate stock
  const stockValidation = await validateStock(items, req.shopId);
  if (!stockValidation.isValid) {
    return res.status(400).json({
      success: false,
      message: stockValidation.error
    });
  }

  // Handle empty string route values by converting to null
  const processedRoute = route === '' ? null : route;
  
  // Generate QR Code dynamically
  const QRCode = require('qrcode');
  const qrCode = await QRCode.toDataURL(`SALE_${invoiceNumber}_${Date.now()}`);

  // Pre-allocate serial numbers if tracking is enabled
  items = await allocateSerialNumbers(items, req.shopId);

  // Validate payments fee dynamically on backend to prevent client-side manipulation
  if (payments && Array.isArray(payments)) {
    for (let i = 0; i < payments.length; i++) {
      let p = payments[i];
      if (p.method === 'MFS' && p.mfsProvider) {
        const mfs = await MFSProvider.findById(p.mfsProvider);
        if (mfs) {
          p.feePercentage = mfs.feePerThousand;
          p.feeAmount = (p.amount * mfs.feePerThousand) / 1000;
        }
      } else if (p.method === 'Card' && p.posMachine) {
        const pos = await POSMachine.findById(p.posMachine);
        if (pos) {
          p.feePercentage = pos.feePercentage;
          p.feeAmount = (p.amount * pos.feePercentage) / 100;
        }
      }
    }
  }

  const saleData = {
    invoiceNumber,
    customer,
    items,
    subTotal,
    discount,
    tax,
    total,
    paidAmount,
    dueAmount,
    paymentMethod,
    payments,
    status,
    note,
    date,
    shippingAddress,
    assignedSR,
    deliveredBy,
    route: processedRoute,
    type: 'retail',
    invoiceType: invoiceType || 'Cash',
    orderStatus: '',
    isEmi: false,
    deliveryCharge: deliveryCharge || 0,
    installationCost: installationCost || 0,
    additionalExpense: additionalExpense || 0,
    isOperatingExpense: isOperatingExpense === true,
    isOperatingDelivery: isOperatingDelivery === true,
    isOperatingInstallation: isOperatingInstallation === true,
    qrCode,
    createdBy: req.user?.id,
    ...(req.shopId && { shop: req.shopId })
  };

  // Get product details for invoice generation
  const productsDetails = await Promise.all(items.map(async (item) => {
    const product = await Product.findById(item.product).populate('unit');
    
    // Find latest stock batch to get purchase price
    const latestBatch = await StockBatch.findOne({ 
      product: item.product,
      ...(req.shopId && { shop: req.shopId })
    }).sort({ purchaseDate: -1 });

    const purchasePrice = latestBatch ? latestBatch.purchasePrice : 0;

    // Find if warranty is applicable for this item
    let warrantyStr = '';
    if (warrantyData && Array.isArray(warrantyData)) {
      const wd = warrantyData.find(w => w.productId === item.product);
      if (wd && wd.templateId) {
        const template = await WarrantyTemplate.findById(wd.templateId);
        if (template) {
          warrantyStr = template.name;
        }
      }
    }

    return {
      productId: item.product,
      productName: product ? product.name : 'Unknown Product',
      serialNumber: item.serialNumber || '',
      model: product ? product.model : '',
      warranty: warrantyStr,
      mrp: product ? product.mrp : 0,
      unitPrice: item.unitPrice,
      discount: item.discount || 0,
      purchasePrice: purchasePrice,
      quantity: item.quantity,
      unit: product && product.unit ? product.unit.name : 'pcs',
      purchaseTax: product ? product.taxPercentage : 0
    };
  }));

  saleData.invoices = {
    customerSales: buildCustomerSalesInvoice(req.body, productsDetails),
    customerTax: buildCustomerTaxInvoice(req.body, productsDetails),
    fabricatedSales: buildFabricatedSalesInvoice(req.body, productsDetails),
    fabricatedTax: buildFabricatedTaxInvoice(req.body, productsDetails)
  };

  // Create retail sale
  const sale = await Sale.create(saleData);

  // Deduct inventory (including StockBatch and StockUnit)
  await deductInventoryForSale(items, sale._id, date, invoiceNumber, req.shopId);

  // Auto-create warranties
  await createWarrantyRecords(warrantyData, customer, sale._id, date);

  // Update customer due
  await updateCustomerDue(customer, dueAmount);

  // Send SMS
  try {
    const customerDoc = await Customer.findById(customer).select('contactName contactNumber');
    if (customerDoc) {
      const saleWithProducts = await Sale.findById(sale._id).populate('items.product', 'name');
      await sendSaleConfirmationSMS(customerDoc, saleWithProducts, 'retail');
    }
  } catch (smsError) {
    console.error('Failed to send SMS for retail sale:', smsError.message);
  }

  try {
    const customerDoc = await Customer.findById(customer).select('contactName');
    const freshSale = await Sale.findById(sale._id);
    await syncSaleLedgerEntries(freshSale, {
      customerName: customerDoc?.contactName || 'Customer',
      userId: req.user?.id,
      shopId: req.shopId,
    });
  } catch (ledgerError) {
    console.error('Failed to sync retail sale ledger entries:', ledgerError.message);
  }

  res.status(201).json({
    success: true,
    data: sale
  });
});

module.exports = {
  getRetailSales,
  createRetailSale
};
