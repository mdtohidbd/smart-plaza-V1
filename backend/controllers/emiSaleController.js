const asyncHandler = require('express-async-handler');
const Sale = require('../models/Sale');
const EMIInvoice = require('../models/EMIInvoice');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const { sendSaleConfirmationSMS } = require('../utils/smsService');
const {
  validateStock,
  deductInventoryForSale,
  createWarrantyRecords,
  updateCustomerDue,
  allocateSerialNumbers
} = require('../utils/saleHelpers');
const StockBatch = require('../models/StockBatch');
const WarrantyTemplate = require('../models/WarrantyTemplate');
const POSMachine = require('../models/POSMachine');
const MFSProvider = require('../models/MFSProvider');
const {
  buildCustomerSalesInvoice,
  buildCustomerTaxInvoice,
  buildFabricatedSalesInvoice,
  buildFabricatedTaxInvoice
} = require('../utils/invoiceCalculator');
const { syncSaleLedgerEntries } = require('../utils/accountLedgerSync');

// @desc    Create EMI sale
// @route   POST /api/sales (dispatched from routes based on type='EMI' or isEmi)
// @access  Private
const createEmiSale = asyncHandler(async (req, res) => {
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
    payments,
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
    emiOption,
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

  // Handle empty string route values
  const processedRoute = route === '' ? null : route;
  
  // Generate QR Code
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
    invoiceType: 'EMI',
    orderStatus: emiOption ? `monthly installment due(${emiOption.duration} months)` : 'monthly installment due',
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

  if (emiOption) {
    saleData.isEmi = true;
    saleData.emiOption = emiOption;
  }
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

  // Create sale record
  const sale = await Sale.create(saleData);

  // Deduct inventory (including StockBatch and StockUnit)
  await deductInventoryForSale(items, sale._id, date, invoiceNumber, req.shopId);

  // Auto-create warranties
  await createWarrantyRecords(warrantyData, customer, sale._id, date);

  // Generate EMI Invoice
  let emiInvoice = null;
  if (emiOption) {
    try {
      const { duration, downPayment, interestRate } = emiOption;
      
      const customerDoc = await Customer.findById(customer);
      
      // Calculate EMI details
      const interestAmount = total * (interestRate / 100);
      const totalPayable = total + interestAmount - downPayment;
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

      // Ensure product mapping holds correct names for EMIInvoice
      const emiProducts = await Promise.all(items.map(async (item) => {
        const prod = await Product.findById(item.product);
        return {
          product: item.product,
          name: prod ? prod.name : 'Product',
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.unitPrice * item.quantity
        };
      }));

      // Create EMI Invoice
      emiInvoice = await EMIInvoice.create({
        customer: customer,
        customerName: customerDoc ? customerDoc.contactName : 'Walk-in Customer',
        customerPhone: customerDoc ? customerDoc.contactNumber : '',
        customerAddress: customerDoc ? customerDoc.address : '',
        showroom: 'Retail Store',
        invoiceNumber: `EMI-${Date.now()}`,
        invoiceDate: new Date(),
        relatedSaleOrder: sale._id,
        products: emiProducts,
        subtotal: subTotal,
        deliveryCharge: deliveryCharge || 0,
        installationCost: installationCost || 0,
        cardCharge: 0,
        discount: discount || 0,
        tax: tax || 0,
        totalAmount: total,
        emiPlan: {
          planType: ['3', '6', '12'].includes(String(duration)) ? `${duration}months` : 'custom',
          duration,
          interestRate,
          interestAmount,
          totalPayableAmount: totalPayable,
          monthlyInstalment
        },
        downPayment: {
          amount: downPayment,
          paidAt: new Date(),
          method: (paymentMethod || 'cash').toLowerCase()
        },
        paidAmount: 0,
        outstandingBalance: totalPayable,
        instalments,
        status: 'active',
        isActive: true,
        createdBy: req.user?.id,
        ...(req.shopId && { shop: req.shopId })
      });
      
      // Keep reference of EMI invoice in note
      sale.note = sale.note ? `${sale.note} | EMI Invoice: ${emiInvoice.invoiceNumber}` : `EMI Invoice: ${emiInvoice.invoiceNumber}`;
      await sale.save();
    } catch (emiError) {
      console.error('Failed to create EMI invoice:', emiError);
    }
  }

  // Update customer due
  await updateCustomerDue(customer, dueAmount);

  // Send SMS
  try {
    const customerDoc = await Customer.findById(customer).select('contactName contactNumber');
    if (customerDoc) {
      const saleWithProducts = await Sale.findById(sale._id).populate('items.product', 'name');
      await sendSaleConfirmationSMS(customerDoc, saleWithProducts, 'EMI');
    }
  } catch (smsError) {
    console.error('Failed to send SMS for EMI sale:', smsError.message);
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
    console.error('Failed to sync EMI sale ledger entries:', ledgerError.message);
  }

  let responseData = sale.toObject();
  if (emiInvoice) {
    responseData.emiInvoice = emiInvoice;
  }

  res.status(201).json({
    success: true,
    data: responseData
  });
});

module.exports = {
  createEmiSale
};
