const Sale = require('../models/Sale');
const Inventory = require('../models/Inventory');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Income = require('../models/Income');
const IncomeHead = require('../models/IncomeHead');
const Setting = require('../models/Setting');
const Warranty = require('../models/Warranty');
const WarrantyTemplate = require('../models/WarrantyTemplate');
const EMIInvoice = require('../models/EMIInvoice');
const mongoose = require('mongoose');
const QRCode = require('qrcode');
const asyncHandler = require('express-async-handler');
const { generateInvoicePDF, generateInvoiceHTMLString, generateInvoiceHTMLForPrint } = require('../utils/invoiceGenerator');
const { sendSaleConfirmationSMS } = require('../utils/smsService');
const { isSuperAdminPlus, sanitizeSaleForRole, sanitizeSalesListForRole, sanitizeInvoicesForRole } = require('../utils/roleUtils');
const {
  syncSaleLedgerEntries,
  recordDueCollectionIncome,
  clearSaleAutoEntries,
  INCOME_TYPES,
} = require('../utils/accountLedgerSync');

// @desc    Get all sales
// @route   GET /api/sales
// @access  Private
const getSales = asyncHandler(async (req, res) => {
  const { type, startDate, endDate, page, limit, search } = req.query;
  
  // Filter by shop if shop context is available
  const shopFilter = req.shopId ? { shop: req.shopId } : {};
  
  let filter = { ...shopFilter };
  
  if (type) {
    filter.type = type;
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

  // Search parameter
  if (search) {
    const searchRegex = new RegExp(search, 'i');
    
    // Find matching customers first
    const matchingCustomers = await Customer.find({
      $or: [
        { contactName: searchRegex },
        { contactNumber: searchRegex }
      ]
    }).select('_id');
    const customerIds = matchingCustomers.map(c => c._id);

    filter.$or = [
      { invoiceNumber: searchRegex },
      { customer: { $in: customerIds } }
    ];
  }

  // Define heavy fields to exclude
  const selectQuery = '-invoices.customerSales -invoices.fabricatedSales -invoices.fabricatedTax -qrCode';
  
  let query = Sale.find(filter)
    .select(selectQuery)
    .populate('customer', 'contactName contactNumber customerType address')
    .populate('assignedSR', 'name')
    .populate('deliveredBy', 'name')
    .populate('createdBy', 'name role')
    .populate({
      path: 'items.product',
      select: 'name sku category brand',
      populate: { path: 'category', select: 'name' }
    })
    .sort({ createdAt: -1 });

  // Optional pagination
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  
  if (pageNum && limitNum) {
    query = query.skip((pageNum - 1) * limitNum).limit(limitNum);
  }

  // Use lean for performance
  let sales = await query.lean();

  // Attach virtuals manually since we used .lean()
  sales = sales.map(sale => {
    // calculatedRevenue
    const emiInterest = (sale.invoiceType === 'EMI' || sale.emiOption) && sale.emiOption?.interestRate
      ? ((sale.total || 0) * sale.emiOption.interestRate / 100) : 0;
    const calculatedRevenue = (sale.total || 0) + emiInterest;

    // calculatedCogs
    let calculatedCogs = sale.invoices?.customerTax?.totalPurchaseValue;
    if (calculatedCogs === undefined || calculatedCogs === null || calculatedCogs === 0) {
      calculatedCogs = sale.items?.reduce((sum, item) => {
        const cost = item.purchaseCost || (item.product && item.product.purchasePrice) || 0;
        return sum + (cost * item.quantity);
      }, 0) || 0;
    }

    // calculatedExpenses
    const paymentFees = (sale.payments || []).reduce((sum, p) => sum + (p.feeAmount || 0), 0);
    const calculatedExpenses = (sale.deliveryCharge || 0) + (sale.installationCost || 0) + (sale.additionalExpense || 0) + paymentFees;

    // calculatedNetProfit
    const calculatedNetProfit = calculatedRevenue - calculatedCogs - calculatedExpenses;

    return {
      ...sale,
      calculatedRevenue,
      calculatedCogs,
      calculatedExpenses,
      calculatedNetProfit
    };
  });

  const responseData = {
    success: true,
    count: sales.length,
    data: sanitizeSalesListForRole(sales, req.user)
  };

  if (pageNum && limitNum) {
    const total = await Sale.countDocuments(filter);
    responseData.total = total;
    responseData.page = pageNum;
    responseData.totalPages = Math.ceil(total / limitNum);
  }

  res.status(200).json(responseData);
});

// @desc    Get retail sales
// @route   GET /api/sales/retail
// @access  Private
const getRetailSales = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  // Filter by shop if shop context is available
  const shopFilter = req.shopId ? { shop: req.shopId } : {};
  
  let filter = { ...shopFilter, type: 'retail' };
  
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
  
  const sales = await Sale.find(filter)
    .populate('customer', 'contactName contactNumber customerType address')
    .populate('assignedSR', 'name')
    .populate('deliveredBy', 'name')
    // .populate('route', 'name')
    .populate('createdBy', 'name role')
    .populate('items.product', 'name purchasePrice mrp')
    .sort({ createdAt: -1 })
    .lean();

  const productIds = new Set();
  sales.forEach(sale => {
    sale.items?.forEach(item => {
      if (item.product && item.product._id) productIds.add(item.product._id.toString());
    });
  });

  const latestInventories = await Inventory.aggregate([
    { $match: { product: { $in: Array.from(productIds).map(id => new mongoose.Types.ObjectId(id)) }, type: { $in: ['Stock In', 'Purchase'] } } },
    { $sort: { date: -1 } },
    { $group: { _id: '$product', unitPrice: { $first: '$unitPrice' } } }
  ]);

  const inventoryMap = {};
  latestInventories.forEach(inv => {
    inventoryMap[inv._id.toString()] = inv.unitPrice;
  });

  sales.forEach(sale => {
    sale.items?.forEach(item => {
      if (item.product && item.product._id) {
        const invPrice = inventoryMap[item.product._id.toString()];
        item.product.computedPurchasePrice = invPrice || item.product.purchasePrice || (item.product.mrp ? item.product.mrp * 0.7 : 0);
      }
    });
  });

  res.status(200).json({
    success: true,
    count: sales.length,
    data: sanitizeSalesListForRole(sales, req.user)
  });
});

// @desc    Get single sale
// @route   GET /api/sales/:id
// @access  Private
const getSale = asyncHandler(async (req, res) => {
  // Find sale and ensure it belongs to the current shop
  const sale = await Sale.findOne({
    _id: req.params.id,
    shop: req.shopId
  })
    .populate('customer', 'contactName contactNumber address businessName email customerType')
    .populate('assignedSR', 'name')
    .populate('deliveredBy', 'name')
    // .populate('route', 'name')
    .populate('items.product', 'name');

  if (!sale) {
    return res.status(404).json({ 
      success: false,
      message: `Sale not found with id ${req.params.id}` 
    });
  }

  // Fetch warranties for this sale
  const warranties = await Warranty.find({ sale: sale._id, shop: req.shopId });

  // Convert sale to plain object to attach warranties
  const saleObj = sale.toObject();
  
  if (warranties && warranties.length > 0) {
    saleObj.items = saleObj.items.map(item => {
      const itemWarranty = warranties.find(w => w.product.toString() === item.product._id.toString());
      if (itemWarranty) {
        return {
          ...item,
          warrantyName: itemWarranty.warrantyName,
          warrantyEndDate: itemWarranty.endDate,
          warrantyDurationMonths: itemWarranty.durationMonths || null
        };
      }
      return item;
    });
  }

  // Fetch EMI Invoice if it's an EMI sale
  if (sale.invoiceType === 'EMI') {
    const emiInvoice = await EMIInvoice.findOne({ sale: sale._id });
    if (emiInvoice) {
      saleObj.emiInvoice = emiInvoice;
    }
  }

  // Fallback for old sales that do not have all 4 invoices snapshots
  if (
    !saleObj.invoices ||
    !saleObj.invoices.customerSales ||
    !saleObj.invoices.customerTax ||
    !saleObj.invoices.fabricatedSales ||
    !saleObj.invoices.fabricatedTax
  ) {
    const {
      buildCustomerSalesInvoice,
      buildCustomerTaxInvoice,
      buildFabricatedSalesInvoice,
      buildFabricatedTaxInvoice
    } = require('../utils/invoiceCalculator');

    const productsDetails = await Promise.all(saleObj.items.map(async (item) => {
      const product = await Product.findById(item.product._id);
      const latestInventory = await Inventory.findOne({
        product: item.product._id,
        type: { $in: ['Stock In', 'Purchase'] },
        ...(req.shopId && { shop: req.shopId })
      }).sort({ date: -1 });
      const purchasePrice = latestInventory ? latestInventory.unitPrice : (product ? product.mrp * 0.7 : 0);

      let warrantyStr = '';
      if (warranties && warranties.length > 0) {
        const itemWarranties = warranties.filter(w => w.productId && w.productId.toString() === item.product._id.toString());
        const warrantyStrings = [];
        
        for (const wd of itemWarranties) {
          if (wd.templateId) {
            const template = await WarrantyTemplate.findById(wd.templateId);
            if (template) {
              const duration = wd.customDurationMonths ? wd.customDurationMonths : template.durationMonths;
              warrantyStrings.push(`${template.name} (${duration} Months)`);
            }
          } else if (wd.warrantyName) {
            const duration = wd.customDurationMonths ? ` (${wd.customDurationMonths} Months)` : '';
            warrantyStrings.push(`${wd.warrantyName}${duration}`);
          }
        }
        warrantyStr = warrantyStrings.join(', ');
      }

      return {
        productId: item.product._id,
        productName: product ? product.name : 'Unknown Product',
        serialNumber: item.serialNumber || '',
        model: product ? product.model : '',
        color: product ? (product.colors?.length > 0 ? product.colors.map(c => c.name).join(', ') : (product.color || '')) : '',
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

    const saleBody = {
      invoiceNumber: saleObj.invoiceNumber,
      customer: saleObj.customer?._id,
      subTotal: saleObj.subTotal,
      discount: saleObj.discount,
      total: saleObj.total,
      deliveryCharge: saleObj.deliveryCharge || 0,
      installationCost: saleObj.installationCost || 0,
      additionalExpense: saleObj.additionalExpense || 0,
      isOperatingExpense: saleObj.isOperatingExpense || false,
      isOperatingDelivery: saleObj.isOperatingDelivery || false,
      isOperatingInstallation: saleObj.isOperatingInstallation || false,
      paidAmount: saleObj.paidAmount,
      dueAmount: saleObj.dueAmount,
      paymentMethod: saleObj.paymentMethod,
      payments: saleObj.payments,
      isEmi: saleObj.invoiceType === 'EMI',
      emiOption: saleObj.emiOption
    };

    saleObj.invoices = {
      customerSales: buildCustomerSalesInvoice(saleBody, productsDetails),
      customerTax: buildCustomerTaxInvoice(saleBody, productsDetails),
      fabricatedSales: buildFabricatedSalesInvoice(saleBody, productsDetails),
      fabricatedTax: buildFabricatedTaxInvoice(saleBody, productsDetails)
    };
  }

  res.status(200).json({
    success: true,
    data: sanitizeSaleForRole(saleObj, req.user)
  });
});

// @desc    Get sale invoices (all 4 snapshots)
// @route   GET /api/sales/:id/invoices
// @access  Private
const getSaleInvoices = asyncHandler(async (req, res) => {
  const sale = await Sale.findOne({
    _id: req.params.id,
    shop: req.shopId
  });

  if (!sale) {
    return res.status(404).json({ 
      success: false,
      message: `Sale not found with id ${req.params.id}` 
    });
  }

  res.status(200).json({
    success: true,
    invoices: sanitizeInvoicesForRole(sale.invoices || {}, req.user)
  });
});

// @desc    Create sale
// @route   POST /api/sales
// @access  Private
const createSale = asyncHandler(async (req, res) => {
  const {
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

  // Generate QR code for the sale
  const qrCode = await QRCode.toDataURL(`SALE_${invoiceNumber}_${Date.now()}`);

  // Handle empty string route values by converting to null
  const processedRoute = route === '' ? null : route;

  // Calculate appropriate order status
  let calculatedOrderStatus = req.body.orderStatus || 'Processing';
  if ((type || 'wholesale') === 'retail') {
    if ((invoiceType === 'EMI' || req.body.isEmi) && emiOption) {
      calculatedOrderStatus = `Monthly installment due (${emiOption.duration} months)`;
    } else {
      calculatedOrderStatus = ''; // Empty string for normal retail sales
    }
  }

  // --- Split Payment Logic ---
  // If a `payments` array is provided, derive totals and legacy paymentMethod from it
  let resolvedPayments = [];
  let resolvedPaidAmount = paidAmount;
  let resolvedPaymentMethod = paymentMethod || 'Cash';

  if (payments && Array.isArray(payments) && payments.length > 0) {
    resolvedPayments = payments;
    // Sum all payment amounts as the effective paid amount
    resolvedPaidAmount = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    // Derive legacy paymentMethod: if only one method used, use that; else 'Split'
    const uniqueMethods = [...new Set(payments.map(p => p.method))];
    resolvedPaymentMethod = uniqueMethods.length === 1 ? uniqueMethods[0] : 'Split';
  }

  const resolvedDueAmount = Math.max(0, (total || 0) - resolvedPaidAmount);

  // Associate sale with current shop if available
  const saleData = {
    invoiceNumber,
    customer,
    items,
    subTotal,
    discount,
    tax,
    total,
    paidAmount: resolvedPaidAmount,
    dueAmount: resolvedDueAmount,
    paymentMethod: resolvedPaymentMethod,
    payments: resolvedPayments,
    status,
    note,
    date,
    shippingAddress,
    assignedSR,
    deliveredBy,
    route: processedRoute,
    type: type || 'wholesale', // Default to wholesale if not specified
    invoiceType: invoiceType || 'Cash', // Default to Cash if not specified
    orderStatus: calculatedOrderStatus,
    deliveryCharge: deliveryCharge || 0,
    installationCost: installationCost || 0,
    additionalExpense: additionalExpense || 0,
    isOperatingExpense: isOperatingExpense === true,
    isOperatingDelivery: isOperatingDelivery === true,
    isOperatingInstallation: isOperatingInstallation === true,
    qrCode,
    createdBy: req.user?.id, // Set the creator of the sale
    ...(req.shopId && { shop: req.shopId }) // Only add shop if it exists
  };

  if ((type === 'EMI' || invoiceType === 'EMI' || req.body.isEmi) && emiOption) {
    saleData.isEmi = true;
    saleData.emiOption = emiOption;
  }
  
  // Validate stock for each item before creating sale
  for (const item of items) {
    const product = await Product.findById(item.product);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product not found with id ${item.product}`
      });
    }
    
    // Get actual stock from inventory
    const actualStock = await product.getActualStock(req.shopId);
    
    if (actualStock < item.quantity) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock for ${product.name}. Available: ${actualStock}, Requested: ${item.quantity}`
      });
    }
  }
  
  // Build invoices snapshot for new sales
  const {
    buildCustomerSalesInvoice,
    buildCustomerTaxInvoice,
    buildFabricatedSalesInvoice,
    buildFabricatedTaxInvoice
  } = require('../utils/invoiceCalculator');

  const productsDetails = await Promise.all(items.map(async (item) => {
    const product = await Product.findById(item.product);
    const latestInventory = await Inventory.findOne({
      product: item.product,
      type: { $in: ['Stock In', 'Purchase'] },
      ...(req.shopId && { shop: req.shopId })
    }).sort({ date: -1 });
    const purchasePrice = latestInventory ? latestInventory.unitPrice : (product ? product.mrp * 0.7 : 0);

    let warrantyStr = '';
    if (warrantyData && Array.isArray(warrantyData)) {
      const itemWarranties = warrantyData.filter(w => w.productId && w.productId.toString() === item.product.toString());
      const warrantyStrings = [];
      
      for (const wd of itemWarranties) {
        if (wd.templateId) {
          const template = await WarrantyTemplate.findById(wd.templateId);
          if (template) {
            const duration = wd.customDurationMonths ? wd.customDurationMonths : template.durationMonths;
            warrantyStrings.push(`${template.name} (${duration} Months)`);
          }
        } else if (wd.warrantyName) {
          const duration = wd.customDurationMonths ? ` (${wd.customDurationMonths} Months)` : '';
          warrantyStrings.push(`${wd.warrantyName}${duration}`);
        }
      }
      warrantyStr = warrantyStrings.join(', ');
    }

    let finalSerialNumbers = '';
    if (product && product.trackSerials) {
      const StockUnit = mongoose.model('StockUnit');
      const serials = item.serialNumber ? item.serialNumber.split(',').map(s => s.trim()).filter(s => s) : [];
      let availableUnits = [];

      if (serials.length > 0) {
        availableUnits = await StockUnit.find({
          product: item.product,
          shop: req.shopId,
          status: 'available',
          serialNumber: { $in: serials }
        }).limit(item.quantity);

        if (availableUnits.length < item.quantity) {
          const foundSerials = availableUnits.map(u => u.serialNumber);
          const remainingNeeded = item.quantity - availableUnits.length;
          
          const extraUnits = await StockUnit.find({
            product: item.product,
            shop: req.shopId,
            status: 'available',
            serialNumber: { $nin: foundSerials }
          }).limit(remainingNeeded).sort({ createdAt: 1 });
          
          availableUnits = [...availableUnits, ...extraUnits];
        }
      } else {
        availableUnits = await StockUnit.find({
          product: item.product,
          shop: req.shopId,
          status: 'available'
        }).limit(item.quantity).sort({ createdAt: 1 });
      }

      finalSerialNumbers = availableUnits.map(u => u.serialNumber).join(', ');
    } else {
      finalSerialNumbers = item.serialNumber || '';
    }
    
    // Mutate item so Sale.create saves the discovered serials
    item.serialNumber = finalSerialNumbers;

    return {
      productId: item.product,
      productName: product ? product.name : 'Unknown Product',
      serialNumber: finalSerialNumbers,
      model: product ? product.model : '',
      color: product ? (product.colors?.length > 0 ? product.colors.map(c => c.name).join(', ') : (product.color || '')) : '',
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

  // Create sale
  const sale = await Sale.create(saleData);

    // Update inventory for each item in the sale
  let needSaleSave = false;

  for (const item of items) {
    const saleItemIndex = sale.items.findIndex(si => si.product.toString() === item.product.toString());
    
    await Inventory.create({
      product: item.product,
      type: 'Sale',
      referenceId: sale._id,
      referenceModel: 'Sale',
      quantity: -item.quantity, // Negative because it's a sale (stock going out)
      unitPrice: item.unitPrice,
      date: date || new Date(),
      note: invoiceNumber,
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
    
    if (saleItemIndex > -1) {
      sale.items[saleItemIndex].purchaseCost = itemPurchaseCost;
      sale.items[saleItemIndex].batchesUsed = itemBatchesUsed;
      needSaleSave = true;
    }

    // 2. Deduct from StockUnit if trackSerials is true
    const productDoc = await Product.findById(item.product);
    if (productDoc && productDoc.trackSerials) {
      const StockUnit = mongoose.model('StockUnit');
      
      const serials = item.serialNumber ? item.serialNumber.split(',').map(s => s.trim()).filter(s => s) : [];
      let availableUnits = [];

      if (serials.length > 0) {
        // Find units with specific serials
        availableUnits = await StockUnit.find({
          product: item.product,
          shop: req.shopId,
          status: 'available',
          serialNumber: { $in: serials }
        }).limit(item.quantity);

        // If not enough found by exact serial, fill remainder with FIFO
        if (availableUnits.length < item.quantity) {
          const foundSerials = availableUnits.map(u => u.serialNumber);
          const remainingNeeded = item.quantity - availableUnits.length;
          
          const extraUnits = await StockUnit.find({
            product: item.product,
            shop: req.shopId,
            status: 'available',
            serialNumber: { $nin: foundSerials }
          }).limit(remainingNeeded).sort({ createdAt: 1 });
          
          availableUnits = [...availableUnits, ...extraUnits];
        }
      } else {
        availableUnits = await StockUnit.find({
          product: item.product,
          shop: req.shopId,
          status: 'available'
        }).limit(item.quantity).sort({ createdAt: 1 });
      }

      for (const unit of availableUnits) {
        unit.status = 'sold';
        unit.saleRef = sale._id;
        unit.saleDate = new Date();
        await unit.save();
      }
    }
  }

  if (needSaleSave) {
    await sale.save();
  }

  // Auto-create warranty records if warrantyData is provided
  if (warrantyData && Array.isArray(warrantyData) && warrantyData.length > 0) {
    for (const wd of warrantyData) {
      if (!wd.productId || !wd.templateId) continue;

      try {
        const template = await WarrantyTemplate.findById(wd.templateId);
        if (!template) continue;

        const startDate = new Date(date || Date.now());
        const endDate = new Date(startDate);
        const duration = wd.customDurationMonths ? parseInt(wd.customDurationMonths, 10) : template.durationMonths;
        endDate.setMonth(endDate.getMonth() + duration);

        await Warranty.create({
          shop: req.shopId,
          warrantyTemplate: template._id,
          warrantyName: template.name,
          product: wd.productId,
          customer: customer,
          sale: sale._id,
          startDate,
          endDate,
          description: template.description || '',
          status: 'Active'
        });
      } catch (warrantyError) {
        console.error('Failed to create warranty for product:', wd.productId, warrantyError.message);
        // Don't fail the sale if warranty creation fails
      }
    }
  }

  // Generate EMI Invoice if this is an EMI sale
  let emiInvoice = null;
  if ((type === 'EMI' || invoiceType === 'EMI' || req.body.isEmi) && emiOption) {
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
        deliveryCharge: 0,
        installationCost: 0,
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
        paidAmount: downPayment,
        outstandingBalance: totalPayable,
        instalments,
        status: 'active',
        isActive: true,
        createdBy: req.user ? req.user._id : req.user?.id,
        ...(req.shopId && { shop: req.shopId })
      });
      
      // Keep reference of EMI invoice in note
      sale.note = sale.note ? `${sale.note} | EMI Invoice: ${emiInvoice.invoiceNumber}` : `EMI Invoice: ${emiInvoice.invoiceNumber}`;
      await sale.save();
    } catch (emiError) {
      console.error('Failed to create EMI invoice:', emiError);
    }
  }

  // Update customer's total due
  if (dueAmount > 0) {
    const customerDoc = await Customer.findById(customer);
    customerDoc.totalDue += dueAmount;
    await customerDoc.save();
  }

  // Send SMS notification to customer
  try {
    console.log('=== SENDING SMS FOR RETAIL/WHOLESALE SALE ===');
    console.log('Customer ID from sale:', customer);
    
    const customerDoc = await Customer.findById(customer).select('contactName contactNumber');
    
    if (!customerDoc) {
      console.error('Customer not found for SMS:', customer);
    } else {
      console.log('Customer found:', customerDoc.contactName, customerDoc.contactNumber);
      
      // Populate product details in items for SMS
      const saleWithProducts = await Sale.findById(sale._id).populate('items.product', 'name');
      
      console.log('Sale details:', {
        invoiceNumber: saleWithProducts.invoiceNumber,
        total: saleWithProducts.total,
        paidAmount: saleWithProducts.paidAmount,
        dueAmount: saleWithProducts.dueAmount,
        type: saleWithProducts.type,
        itemCount: saleWithProducts.items.length
      });
      
      const smsResult = await sendSaleConfirmationSMS(customerDoc, saleWithProducts, saleWithProducts.type || 'sale');
      console.log('SMS API Response:', smsResult);
      
      if (smsResult.success) {
        console.log('✅ Sale confirmation SMS sent successfully to', customerDoc.contactNumber);
      } else {
        console.error('❌ SMS failed:', smsResult.error);
      }
    }
  } catch (smsError) {
    console.error('Failed to send SMS for sale:', smsError);
    console.error('Error details:', smsError.message);
    // Don't fail the request if SMS fails
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
    console.error('Failed to sync sale ledger entries:', ledgerError.message);
  }

  let responseData = sale;
  if (req.body.isEmi && typeof emiInvoice !== 'undefined' && emiInvoice) {
    responseData = sale.toObject();
    responseData.emiInvoice = emiInvoice;
  }

  res.status(201).json({
    success: true,
    data: responseData
  });
});

// @desc    Update sale
// @route   PUT /api/sales/:id
// @access  Private
const updateSale = asyncHandler(async (req, res) => {
  // Find sale and ensure it belongs to the current shop
  let sale = await Sale.findOne({
    _id: req.params.id,
    shop: req.shopId
  });

  if (!sale) {
    return res.status(404).json({ 
      success: false,
      message: `Sale not found with id ${req.params.id}` 
    });
  }

  // Get the old sale items to revert inventory if needed
  const oldItems = [...sale.items];

  // Handle empty string route values by converting to null
  if (req.body.route && req.body.route === '') {
    req.body.route = null;
  }

  // Update sale
  sale = await Sale.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  })
  .populate('customer', 'contactName contactNumber address businessName email customerType')
  .populate('assignedSR', 'name')
  .populate('deliveredBy', 'name')
  // .populate('route', 'name')
  .populate('items.product', 'name');

  res.status(200).json({
    success: true,
    data: sale
  });
});

// @desc    Update sale expenses/charges after sale is done
// @route   PUT /api/sales/:id/expenses
// @access  Private
const updateSaleExpenses = asyncHandler(async (req, res) => {
  const sale = await Sale.findOne({
    _id: req.params.id,
    shop: req.shopId
  });

  if (!sale) {
    return res.status(404).json({
      success: false,
      message: `Sale not found with id ${req.params.id}`
    });
  }

  const deliveryCharge = Math.max(0, Number(req.body.deliveryCharge) || 0);
  const installationCost = Math.max(0, Number(req.body.installationCost) || 0);
  const additionalExpense = Math.max(0, Number(req.body.additionalExpense) || 0);
  const cardCharge = Math.max(0, Number(req.body.cardCharge) || 0);

  const isOperatingExpense = req.body.isOperatingExpense !== undefined ? Boolean(req.body.isOperatingExpense) : Boolean(sale.isOperatingExpense);
  const isOperatingDelivery = req.body.isOperatingDelivery !== undefined ? Boolean(req.body.isOperatingDelivery) : Boolean(sale.isOperatingDelivery);
  const isOperatingInstallation = req.body.isOperatingInstallation !== undefined ? Boolean(req.body.isOperatingInstallation) : Boolean(sale.isOperatingInstallation);

  const oldExpensesTotal = 
    (sale.isOperatingDelivery ? 0 : (sale.deliveryCharge || 0)) + 
    (sale.isOperatingInstallation ? 0 : (sale.installationCost || 0)) + 
    (sale.isOperatingExpense ? 0 : (sale.additionalExpense || 0)) + 
    (sale.cardCharge || 0);
  const newExpensesTotal = 
    (isOperatingDelivery ? 0 : deliveryCharge) + 
    (isOperatingInstallation ? 0 : installationCost) + 
    (isOperatingExpense ? 0 : additionalExpense) + 
    cardCharge;
  const diff = newExpensesTotal - oldExpensesTotal;

  sale.deliveryCharge = deliveryCharge;
  sale.installationCost = installationCost;
  sale.additionalExpense = additionalExpense;
  sale.cardCharge = cardCharge;
  sale.isOperatingExpense = isOperatingExpense;
  sale.isOperatingDelivery = isOperatingDelivery;
  sale.isOperatingInstallation = isOperatingInstallation;

  sale.total = Math.max(0, (sale.total || 0) + diff);
  sale.dueAmount = Math.max(0, (sale.dueAmount || 0) + diff);

  if (sale.dueAmount <= 0) {
    sale.paymentStatus = 'Paid';
  } else if (sale.dueAmount < sale.total) {
    sale.paymentStatus = 'Partial';
  } else {
    sale.paymentStatus = 'Unpaid';
  }

  // Reset invoices snapshot so getSaleById automatically recalculates fresh invoice snapshots with new values
  sale.invoices = undefined;

  await sale.save();

  // Also update SaleOrder if it exists
  try {
    const SaleOrder = require('../models/SaleOrder');
    const saleOrder = await SaleOrder.findOne({ invoiceNumber: sale.invoiceNumber });
    if (saleOrder) {
      saleOrder.deliveryCharge = deliveryCharge;
      saleOrder.installationCost = installationCost;
      saleOrder.additionalExpense = additionalExpense;
      saleOrder.cardCharge = cardCharge;
      saleOrder.isOperatingExpense = isOperatingExpense;
      saleOrder.isOperatingDelivery = isOperatingDelivery;
      saleOrder.isOperatingInstallation = isOperatingInstallation;
      saleOrder.total = Math.max(0, (saleOrder.total || 0) + diff);
      saleOrder.dueAmount = Math.max(0, (saleOrder.dueAmount || 0) + diff);
      await saleOrder.save();
    }
  } catch (err) {
    console.error('Error updating corresponding SaleOrder:', err);
  }

  // Sync customer balance
  if (sale.customer) {
    try {
      const customer = await Customer.findById(sale.customer);
      if (customer) {
        const sales = await Sale.find({
          customer: customer._id,
          status: { $ne: 'Cancelled' }
        });
        let totalSalesDue = 0;
        for (const s of sales) {
          totalSalesDue += (s.dueAmount || 0);
        }
        customer.totalDue = totalSalesDue;
        await customer.save();
      }
    } catch (err) {
      console.error('Error syncing customer due:', err);
    }
  }

  // Sync ledger entries
  try {
    await syncSaleLedgerEntries(sale, { userId: req.user?._id, shopId: req.shopId });
  } catch (err) {
    console.error('Error syncing sale ledger entries:', err);
  }

  const updatedSale = await Sale.findById(req.params.id)
    .populate('customer', 'contactName contactNumber address businessName email customerType')
    .populate('assignedSR', 'name')
    .populate('deliveredBy', 'name')
    .populate('items.product', 'name');

  res.status(200).json({
    success: true,
    data: updatedSale,
    message: 'Sale expenses updated successfully'
  });
});

// @desc    Update sale with inventory adjustment (Super Admin only)
// @route   PUT /api/sales/:id/edit
// @access  Private (Super Admin)
const updateSaleWithInventory = asyncHandler(async (req, res) => {
  const { 
    customer, 
    items, 
    subTotal, 
    discount, 
    tax, 
    total, 
    paidAmount, 
    dueAmount,
    date,
    shippingAddress,
    assignedSR,
    deliveredBy,
    route,
    status,
    note,
    paymentMethod,
    payments,
    additionalExpense,
    deliveryCharge,
    installationCost
  } = req.body;

  // Find sale and ensure it belongs to the current shop
  let sale = await Sale.findOne({
    _id: req.params.id,
    shop: req.shopId
  }).populate('customer', 'contactName contactNumber address businessName email');

  if (!sale) {
    return res.status(404).json({ 
      success: false,
      message: `Sale not found with id ${req.params.id}` 
    });
  }

  // Store old values for inventory adjustment and audit
  const oldItems = [...sale.items];
  const oldTotal = sale.total;
  const oldDue = sale.dueAmount;
  const oldCustomer = sale.customer._id.toString();

  // Validate items if provided
  if (items && items.length > 0) {
    for (const item of items) {
      if (!item.product || !item.quantity || item.quantity < 1) {
        return res.status(400).json({
          success: false,
          message: 'Invalid item data in request'
        });
      }

      // Check stock availability for new items
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found with id ${item.product}`
        });
      }

      const actualStock = await product.getActualStock(req.shopId);
      if (actualStock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${actualStock}, Requested: ${item.quantity}`
        });
      }
    }
  }

  // Prepare update data
  const updateData = {};
  if (customer !== undefined) updateData.customer = customer;
  if (items !== undefined) updateData.items = items;
  if (subTotal !== undefined) updateData.subTotal = subTotal;
  if (discount !== undefined) updateData.discount = discount;
  if (tax !== undefined) updateData.tax = tax;
  if (total !== undefined) updateData.total = total;
  if (paidAmount !== undefined) updateData.paidAmount = paidAmount;
  if (dueAmount !== undefined) updateData.dueAmount = dueAmount;
  if (date !== undefined) updateData.date = date;
  if (shippingAddress !== undefined) updateData.shippingAddress = shippingAddress;
  if (assignedSR !== undefined) updateData.assignedSR = assignedSR === '' ? null : assignedSR;
  if (deliveredBy !== undefined) updateData.deliveredBy = deliveredBy === '' ? null : deliveredBy;
  if (route !== undefined) updateData.route = route === '' ? null : route;
  if (status !== undefined) updateData.status = status;
  if (note !== undefined) updateData.note = note;
  if (paymentMethod !== undefined) updateData.paymentMethod = paymentMethod;
  if (payments !== undefined) updateData.payments = payments;
  if (additionalExpense !== undefined) updateData.additionalExpense = Math.max(0, Number(additionalExpense) || 0);
  if (deliveryCharge !== undefined) updateData.deliveryCharge = Math.max(0, Number(deliveryCharge) || 0);
  if (installationCost !== undefined) updateData.installationCost = Math.max(0, Number(installationCost) || 0);
  if (req.body.isOperatingExpense !== undefined) updateData.isOperatingExpense = Boolean(req.body.isOperatingExpense);
  if (req.body.isOperatingDelivery !== undefined) updateData.isOperatingDelivery = Boolean(req.body.isOperatingDelivery);
  if (req.body.isOperatingInstallation !== undefined) updateData.isOperatingInstallation = Boolean(req.body.isOperatingInstallation);

  // Unset stale cached invoices so getSaleById recalculates fresh invoice snapshots on next view
  updateData.$unset = { invoices: 1 };

  // Update sale
  sale = await Sale.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true
  })
  .populate('customer', 'contactName contactNumber address businessName email customerType')
  .populate('assignedSR', 'name')
  .populate('deliveredBy', 'name')
  // .populate('route', 'name')
  .populate('items.product', 'name');

  // Update corresponding SaleOrder if exists
  try {
    const SaleOrder = require('../models/SaleOrder');
    const saleOrder = await SaleOrder.findOne({ invoiceNumber: sale.invoiceNumber });
    if (saleOrder) {
      if (additionalExpense !== undefined) saleOrder.additionalExpense = Math.max(0, Number(additionalExpense) || 0);
      if (deliveryCharge !== undefined) saleOrder.deliveryCharge = Math.max(0, Number(deliveryCharge) || 0);
      if (installationCost !== undefined) saleOrder.installationCost = Math.max(0, Number(installationCost) || 0);
      if (req.body.isOperatingExpense !== undefined) saleOrder.isOperatingExpense = Boolean(req.body.isOperatingExpense);
      if (req.body.isOperatingDelivery !== undefined) saleOrder.isOperatingDelivery = Boolean(req.body.isOperatingDelivery);
      if (req.body.isOperatingInstallation !== undefined) saleOrder.isOperatingInstallation = Boolean(req.body.isOperatingInstallation);
      saleOrder.total = total;
      saleOrder.dueAmount = dueAmount || 0;
      await saleOrder.save();
    }
  } catch (err) {
    console.error('Error updating corresponding SaleOrder:', err);
  }

  // REVERT OLD INVENTORY CHANGES
  console.log('🔄 Reverting old inventory changes...');
  const StockBatch = mongoose.model('StockBatch');
  const StockUnit = mongoose.model('StockUnit');

  for (const oldItem of oldItems) {
    await Inventory.create({
      product: oldItem.product._id || oldItem.product,
      type: 'Sale Return', // Special type for edits/reverts
      referenceId: sale._id,
      referenceModel: 'Sale',
      quantity: oldItem.quantity, // Add back to stock (positive)
      unitPrice: oldItem.unitPrice,
      date: new Date(),
      note: `${sale.invoiceNumber} (Super Admin edit)`,
      shop: req.shopId
    });

    // Add back to latest StockBatch
    const latestBatch = await StockBatch.findOne({
      product: oldItem.product._id || oldItem.product,
      shop: req.shopId
    }).sort({ purchaseDate: -1 });

    if (latestBatch) {
      latestBatch.remainingQty += oldItem.quantity;
      if (latestBatch.remainingQty > 0) {
        latestBatch.isActive = true;
      }
      await latestBatch.save();
    }

    // Restore StockUnits if trackSerials
    const productDoc = await Product.findById(oldItem.product._id || oldItem.product);
    if (productDoc && productDoc.trackSerials) {
      const soldUnits = await StockUnit.find({
        product: oldItem.product._id || oldItem.product,
        shop: req.shopId,
        status: 'sold',
        saleRef: sale._id
      }).limit(oldItem.quantity);

      for (const unit of soldUnits) {
        unit.status = 'available';
        unit.saleRef = undefined;
        unit.saleDate = undefined;
        await unit.save();
      }
    }
    
    console.log(`  + Reverted ${oldItem.quantity} units of product ${oldItem.product.name || oldItem.product}`);
  }

  // APPLY NEW INVENTORY CHANGES
  console.log('📝 Applying new inventory changes...');
  if (items && items.length > 0) {
    for (const newItem of items) {
      await Inventory.create({
        product: newItem.product._id || newItem.product,
        type: 'Sale',
        referenceId: sale._id,
        referenceModel: 'Sale',
        quantity: -newItem.quantity, // Subtract from stock (negative)
        unitPrice: newItem.unitPrice,
        date: new Date(),
        note: `${sale.invoiceNumber} (Super Admin edit)`,
        shop: req.shopId
      });

      // Deduct from StockBatch (FIFO)
      const batches = await StockBatch.find({
        product: newItem.product._id || newItem.product,
        shop: req.shopId,
        isActive: true,
        remainingQty: { $gt: 0 }
      }).sort({ purchaseDate: 1 });

      let qtyToDeduct = newItem.quantity;
      for (const batch of batches) {
        if (qtyToDeduct <= 0) break;
        const deductAmt = Math.min(batch.remainingQty, qtyToDeduct);
        batch.remainingQty -= deductAmt;
        qtyToDeduct -= deductAmt;
        
        if (batch.remainingQty === 0) {
          batch.isActive = false;
        }
        await batch.save();
      }

      // Deduct from StockUnit if trackSerials
      const productDoc = await Product.findById(newItem.product._id || newItem.product);
      if (productDoc && productDoc.trackSerials) {
        const availableUnits = await StockUnit.find({
          product: newItem.product._id || newItem.product,
          shop: req.shopId,
          status: 'available'
        }).limit(newItem.quantity).sort({ createdAt: 1 });

        for (const unit of availableUnits) {
          unit.status = 'sold';
          unit.saleRef = sale._id;
          unit.saleDate = new Date();
          await unit.save();
        }
      }

      console.log(`  - Applied ${newItem.quantity} units of product ${newItem.product.name || newItem.product}`);
    }
  }

  // UPDATE CUSTOMER DUE BALANCE
  console.log('💰 Updating customer due balance...');
  const newCustomer = customer || oldCustomer;
  const customerDoc = await Customer.findById(newCustomer);
  
  if (customerDoc) {
    // Remove old due
    customerDoc.totalDue -= oldDue;
    // Add new due
    customerDoc.totalDue += dueAmount || 0;
    await customerDoc.save();
    console.log(`  Updated customer due: Old=${oldDue}, New=${dueAmount || 0}`);
  }

  // CREATE AUDIT LOG ENTRY
  console.log('📝 Creating audit log...');
  try {
    const AuditLog = mongoose.model('AuditLog');
    await AuditLog.create({
      user: req.user._id,
      action: 'UPDATE_SALE_INVOICE',
      entity: 'Sale',
      entityId: sale._id,
      entityType: 'invoice_edit',
      shop: req.shopId,
      details: {
        invoiceNumber: sale.invoiceNumber,
        changes: {
          items: {
            before: oldItems.length,
            after: items ? items.length : oldItems.length
          },
          total: {
            before: oldTotal,
            after: total
          },
          due: {
            before: oldDue,
            after: dueAmount || 0
          },
          customer: {
            before: oldCustomer,
            after: newCustomer
          }
        },
        timestamp: new Date()
      }
    });
  } catch (auditError) {
    console.error('Failed to create audit log:', auditError.message);
    // Don't fail the request if audit logging fails
  }

  console.log('✅ Sale invoice updated successfully with inventory adjustments');

  res.status(200).json({
    success: true,
    message: 'Sale invoice updated successfully with inventory adjustments',
    data: sale,
    changes: {
      itemsReverted: oldItems.length,
      itemsApplied: items ? items.length : 0,
      oldTotal,
      newTotal: total,
      oldDue,
      newDue: dueAmount || 0
    }
  });
});
// @route   PUT /api/sales/:id/payment
// @access  Private
const updateSalePayment = asyncHandler(async (req, res) => {
  const { paidAmount, dueAmount, status, paymentMethod } = req.body;
  
  // Find sale and ensure it belongs to the current shop
  let sale = await Sale.findOne({
    _id: req.params.id,
    shop: req.shopId
  });

  if (!sale) {
    return res.status(404).json({ 
      success: false,
      message: `Sale not found with id ${req.params.id}` 
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

  // Calculate total and update status based on payment amounts
  const total = sale.subTotal - (sale.discount || 0) + (sale.tax || 0);
  
  // Update payment-related fields
  const updateFields = {};
  if (typeof paidAmount !== 'undefined') updateFields.paidAmount = paidAmount;
  if (typeof dueAmount !== 'undefined') updateFields.dueAmount = dueAmount;
  if (paymentMethod) updateFields.paymentMethod = paymentMethod;
  
  // Automatically calculate status based on due amount if not provided
  if (typeof status === 'undefined') {
    if (typeof dueAmount !== 'undefined') {
      if (dueAmount === 0) {
        updateFields.status = 'Completed';
      } else if (dueAmount > 0 && paidAmount > 0) {
        updateFields.status = 'Partial';
      } else {
        updateFields.status = sale.status; // Keep existing status
      }
    }
  } else {
    updateFields.status = status;
  }

  // Update customer's total due if due amount is changing
  if (typeof dueAmount !== 'undefined') {
    const customer = await Customer.findById(sale.customer);
    if (customer) {
      // Adjust customer's total due by the difference
      const dueDifference = dueAmount - sale.dueAmount;
      customer.totalDue += dueDifference;
      
      // Make sure totalDue doesn't go negative
      if (customer.totalDue < 0) customer.totalDue = 0;
      
      await customer.save();

      // Record payment in Income when due amount decreases
      const amountCollected = -dueDifference;
      if (amountCollected > 0) {
        await recordDueCollectionIncome({
          sale,
          customerName: customer.contactName,
          amount: amountCollected,
          paymentMethod: paymentMethod || sale.paymentMethod,
          date: new Date(),
          shopId: req.shopId,
          userId: req.user?.id,
        });
      }
    }
  }

  // Update the sale with new payment information
  sale = await Sale.findByIdAndUpdate(
    req.params.id,
    updateFields,
    { new: true, runValidators: true }
  )
  .populate('customer', 'contactName contactNumber customerType address')
  .populate('assignedSR', 'name')
  .populate('deliveredBy', 'name')
  // .populate('route', 'name')
  .populate('items.product', 'name');

  res.status(200).json({
    success: true,
    data: sale
  });
});

// @desc    Delete sale
// @route   DELETE /api/sales/:id
// @access  Private
const deleteSale = asyncHandler(async (req, res) => {
  // Find sale and ensure it belongs to the current shop
  const sale = await Sale.findOne({
    _id: req.params.id,
    shop: req.shopId
  });

  if (!sale) {
    return res.status(404).json({ 
      success: false,
      message: `Sale not found with id ${req.params.id}` 
    });
  }

  // Remove inventory records associated with this sale
  await Inventory.deleteMany({ referenceId: sale._id, referenceModel: 'Sale' });

  await clearSaleAutoEntries(sale._id, req.shopId);

  await sale.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Create sales return
// @route   POST /api/sales/returns
// @access  Private
const createSalesReturn = asyncHandler(async (req, res) => {
  const { sale, customer, date, items, note } = req.body;

  try {
    // Validate required fields
    if (!sale || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Sale ID and items are required'
      });
    }

    // Find the original sale
    const originalSale = await Sale.findById(sale);
    if (!originalSale) {
      return res.status(404).json({
        success: false,
        message: 'Original sale not found'
      });
    }

    // Calculate total return amount
    const totalReturnAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

    // Update inventory for returned items
    for (const item of items) {
      await Inventory.create({
        product: item.product,
        type: 'Sale Return',
        referenceId: sale,
        referenceModel: 'SaleReturn',
        quantity: item.quantity, // Positive because it's returning stock
        unitPrice: item.unitPrice,
        date: date || new Date(),
        note: `Sales return: ${note || 'N/A'}`,
        shop: req.shopId
      });
    }

    // Save returned items to the original sale document
    const saleReturnItems = items.map(item => ({
      product: item.product,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      returnDate: date || new Date(),
      note: item.reason || note || 'Sales Return'
    }));

    originalSale.returnedItems = [...(originalSale.returnedItems || []), ...saleReturnItems];
    await originalSale.save();

    // Find or create an income head for sales returns
    let incomeHead = await IncomeHead.findOne({ name: 'Sales Return', shop: req.shopId });
    if (!incomeHead) {
      incomeHead = await IncomeHead.create({
        name: 'Sales Return',
        description: 'Refund for returned sales',
        shop: req.shopId
      });
    }

    // Create income record for the return (negative amount as refund)
    const income = await Income.create({
      incomeHead: incomeHead._id,
      name: 'Sales Return Refund',
      amount: -totalReturnAmount, // Negative as it's a refund
      date: date || new Date(),
      paymentMethod: 'Refund',
      description: note || `Refund for sales return from sale ${originalSale.invoiceNumber}`,
      reference: `Sale: ${originalSale.invoiceNumber}`,
      shop: req.shopId
    });

    res.status(201).json({
      success: true,
      data: {
        sale: originalSale,
        items,
        totalReturnAmount,
        income
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Get all sales returns
// @route   GET /api/sales/returns
// @access  Private
const getSalesReturns = asyncHandler(async (req, res) => {
  // This would typically fetch from a separate SalesReturn model
  // For now, we'll return a placeholder response
  res.status(200).json({
    success: true,
    data: [] // In a real implementation, you would fetch from a SalesReturn model
  });
});

// @desc    Get sales due collections
// @route   GET /api/sales/due-collections
// @access  Private
const getDueCollections = asyncHandler(async (req, res) => {
  try {
    // Find all income records for sales collections
    const incomeHeads = await IncomeHead.find({
      name: { $in: [INCOME_TYPES.SALES_DUE_COLLECTION, 'Sales Collection'] },
      shop: req.shopId,
    });
    
    if (incomeHeads.length === 0) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }

    const incomeHeadIds = incomeHeads.map(head => head._id);
    
    const collections = await Income.find({
      incomeHead: { $in: incomeHeadIds },
      shop: req.shopId
    })
    .populate('incomeHead', 'name')
    .sort({ date: -1 })
    .limit(10); // Get last 10 collections

    // Resolve sale invoice numbers from description (invoice number) or legacy reference
    const invoiceNumbers = collections
      .map(c => {
        if (c.description && !c.description.startsWith('Collection for')) {
          return c.description.trim();
        }
        const refMatch = c.reference?.match(/(INV-\S+)/);
        if (refMatch) return refMatch[1];
        const descMatch = c.description?.match(/(INV-\S+)/);
        if (descMatch) return descMatch[1];
        return null;
      })
      .filter(Boolean);

    const sales = await Sale.find({
      invoiceNumber: { $in: invoiceNumbers },
      shop: req.shopId
    }).select('_id invoiceNumber');

    const saleMap = {};
    sales.forEach(s => {
      saleMap[s.invoiceNumber] = s._id;
    });

    const collectionsWithCustomer = collections.map(collection => {
      const refMatch = collection.reference?.match(/(INV-\S+)/);
      const descMatch = collection.description?.match(/(INV-\S+)/);
      const invoiceNumber = collection.description && !collection.description.startsWith('Collection for')
        ? collection.description.trim()
        : (refMatch ? refMatch[1] : (descMatch ? descMatch[1] : null));

      return {
        ...collection.toObject(),
        customer: {
          contactName: collection.name || 'N/A'
        },
        saleId: invoiceNumber ? saleMap[invoiceNumber] : null
      };
    });

    res.status(200).json({
      success: true,
      data: collectionsWithCustomer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Record sales due collection
// @route   POST /api/sales/due-collection
// @access  Private
const recordSalesDueCollection = asyncHandler(async (req, res) => {
  const { customer, amount, date, paymentMethod, description } = req.body;

  // Validate required fields
  if (!customer || !amount || amount <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Customer and amount are required'
    });
  }

  try {
    // Find the customer to get current due amount
    const customerDoc = await Customer.findById(customer);
    if (!customerDoc) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Check if the collection amount exceeds the due amount
    if (amount > customerDoc.totalDue) {
      return res.status(400).json({
        success: false,
        message: `Collection amount exceeds due amount. Current due: $${customerDoc.totalDue}`
      });
    }

    // Update customer's total due
    customerDoc.totalDue -= amount;
    await customerDoc.save();

    const relatedSale = await Sale.findOne({
      customer: customerDoc._id,
      dueAmount: { $gt: 0 },
      shop: req.shopId,
    }).sort({ date: -1 });

    await recordDueCollectionIncome({
      sale: relatedSale || { _id: customerDoc._id, invoiceNumber: description || `Customer ${customerDoc.contactName}` },
      customerName: customerDoc.contactName,
      amount,
      paymentMethod: paymentMethod || 'Cash',
      date: date || new Date(),
      shopId: req.shopId,
      userId: req.user?.id,
    });

    res.status(200).json({
      success: true,
      data: {
        customer: customerDoc,
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Helper to attach warranties to sale object
const attachWarrantiesToSaleObj = async (saleDoc) => {
  const saleObj = typeof saleDoc.toObject === 'function' ? saleDoc.toObject() : saleDoc;
  const warranties = await Warranty.find({ sale: saleObj._id, shop: saleObj.shop });
  if (warranties && warranties.length > 0) {
    saleObj.items = saleObj.items.map(item => {
      const productId = item.product._id ? item.product._id.toString() : item.product.toString();
      const itemWarranty = warranties.find(w => w.product.toString() === productId);
      if (itemWarranty) {
        return {
          ...item,
          warrantyName: itemWarranty.warrantyName,
          warrantyEndDate: itemWarranty.endDate,
          warrantyDurationMonths: itemWarranty.durationMonths || null
        };
      }
      return item;
    });
  }
  return saleObj;
};

// @desc    Generate sale invoice
// @route   GET /api/sales/:id/invoice
// @access  Private
const generateInvoice = asyncHandler(async (req, res) => {
  if (isSuperAdminPlus(req.user)) {
    return res.status(403).json({
      success: false,
      message: 'Customer invoices are not available for your role. Use government invoice endpoints instead.'
    });
  }

  const sale = await Sale.findById(req.params.id)
    .populate('customer', 'contactName contactNumber address businessName email')
    .populate('items.product', 'name image images');

  if (!sale) {
    // Return HTML error page instead of JSON for better browser display
    const errorMessage = `Sale not found with id ${req.params.id}`;
    return res.status(404).send(`
      <!DOCTYPE html>
      <html>
        <head><title>Error - Invoice Not Found</title></head>
        <body style="font-family: Arial, sans-serif; padding: 50px; background: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h1 style="color: #f44336;">❌ Invoice Not Found</h1>
            <p style="color: #666; font-size: 16px;">${errorMessage}</p>
            <p style="color: #999; font-size: 14px;">Please check the invoice ID and try again.</p>
          </div>
        </body>
      </html>
    `);
  }

  // Get company settings with shop context
  const settings = await Setting.findOne({ shop: sale.shop });
  if (!settings) {
    // Return HTML error page instead of JSON
    return res.status(404).send(`
      <!DOCTYPE html>
      <html>
        <head><title>Error - Settings Not Found</title></head>
        <body style="font-family: Arial, sans-serif; padding: 50px; background: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h1 style="color: #ff9800;">⚠️ Settings Not Found</h1>
            <p style="color: #666; font-size: 16px;">Company settings are not configured.</p>
            <p style="color: #999; font-size: 14px;">Please configure company settings first.</p>
          </div>
        </body>
      </html>
    `);
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

  const saleObj = await attachWarrantiesToSaleObj(sale);

  if (format === 'html') {
    // Return HTML for preview
    const html = await generateInvoiceHTMLString(saleObj, settings);
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } else if (format === 'print') {
    // Return HTML optimized for printing
    const html = await generateInvoiceHTMLForPrint(saleObj, settings);
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } else {
    // Generate and return PDF
    try {
      const pdfBuffer = await generateInvoicePDF(saleObj, settings);
      
      if (!pdfBuffer) {
        console.error('PDF generation returned null/undefined');
        return res.status(500).send('Failed to generate PDF');
      }
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="invoice-${sale.invoiceNumber}.pdf"`);
      res.send(pdfBuffer);
    } catch (pdfError) {
      console.error('PDF Generation Error:', pdfError);
      console.error('Error details:', JSON.stringify(pdfError, Object.getOwnPropertyNames(pdfError)));
      
      return res.status(500).send(`
        <!DOCTYPE html>
        <html>
          <head><title>PDF Generation Error</title></head>
          <body style="font-family: Arial, sans-serif; padding: 50px; background: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <h1 style="color: #f44336;">❌ PDF Generation Failed</h1>
              <p style="color: #666; font-size: 16px;">There was an error generating the invoice PDF.</p>
              <p style="color: #999; font-size: 14px; margin-top: 20px;"><strong>Error Details:</strong></p>
              <p style="color: #666; font-size: 13px; background: #f0f0f0; padding: 10px; border-radius: 4px; font-family: monospace;">${pdfError.message || 'Unknown error'}</p>
              <p style="color: #999; font-size: 14px; margin-top: 20px;">Please try again or contact support if the issue persists.</p>
            </div>
          </body>
        </html>
      `);
    }
  }
});

// @desc    Generate QR code for sale
// @route   GET /api/sales/:id/qrcode
// @access  Private
const generateSaleQRCode = asyncHandler(async (req, res) => {
  const sale = await Sale.findById(req.params.id);

  if (!sale) {
    return res.status(404).json({ 
      success: false,
      message: `Sale not found with id ${req.params.id}` 
    });
  }

  // If the sale already has a QR code, return it
  if (sale.qrCode) {
    res.json({
      success: true,
      data: { qrCode: sale.qrCode }
    });
  } else {
    // Generate a new QR code
    const qrCode = await QRCode.toDataURL(`SALE_${sale.invoiceNumber}_${Date.now()}`);
    
    // Update the sale with the QR code
    sale.qrCode = qrCode;
    await sale.save();
    
    res.json({
      success: true,
      data: { qrCode }
    });
  }
});

// @desc    Recalculate customer due balances
// @route   POST /api/sales/recalculate-dues
// @access  Private
const recalculateCustomerDues = asyncHandler(async (req, res) => {
  try {
    // Get all customers
    const customers = await Customer.find({});
    
    for (const customer of customers) {
      // Calculate total due from all sales for this customer
      const sales = await Sale.find({
        customer: customer._id,
        status: { $ne: 'Cancelled' }
      });
      
      let totalSalesDue = 0;
      for (const sale of sales) {
        // Add the unpaid portion of each sale
        totalSalesDue += sale.dueAmount;
      }
      
      // Calculate total due (excluding online orders)
      const totalDue = totalSalesDue;
      
      // Update customer's total due
      customer.totalDue = totalDue;
      await customer.save();
    }
    
    res.status(200).json({
      success: true,
      message: 'Customer dues recalculated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error recalculating customer dues',
      error: error.message
    });
  }
});

// @desc    Generate Customer Invoice PDF (with conditional pricing)
// @route   GET /api/sales/:id/customer-invoice
// @access  Private
const generateCustomerInvoice = asyncHandler(async (req, res) => {
  if (isSuperAdminPlus(req.user)) {
    return res.status(403).json({
      success: false,
      message: 'Customer invoices are not available for your role. Use government invoice endpoints instead.'
    });
  }

  const sale = await Sale.findById(req.params.id)
    .populate('customer', 'contactName contactNumber address')
    .populate('items.product', 'name image images');

  if (!sale) {
    return res.status(404).json({ 
      success: false,
      message: `Sale not found with id ${req.params.id}` 
    });
  }

  // Get company settings
  const settings = await Setting.findOne({ shop: sale.shop });
  if (!settings) {
    return res.status(404).json({
      success: false,
      message: 'Company settings not configured'
    });
  }

  // Calculate customer invoice total with conditional pricing
  const originalTotal = sale.total || 0;
  let customerTotal = originalTotal;
  
  if (originalTotal > 100000) {
    customerTotal = 100000;
  } else if (originalTotal > 50000) {
    customerTotal = 50000;
  }

  // Create a modified sale object with customer total
  const customerSale = {
    ...sale.toObject(),
    total: customerTotal,
    subTotal: sale.subTotal * (customerTotal / originalTotal),
    discount: sale.discount * (customerTotal / originalTotal),
    tax: sale.tax * (customerTotal / originalTotal),
    deliveryCharge: sale.deliveryCharge * (customerTotal / originalTotal),
    installationCost: sale.installationCost * (customerTotal / originalTotal),
    cardCharge: sale.cardCharge * (customerTotal / originalTotal)
  };

  const customerSaleObj = await attachWarrantiesToSaleObj(customerSale);

  try {
    const pdfBuffer = await generateInvoicePDF(customerSaleObj, settings);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="customer-invoice-${sale.invoiceNumber}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Customer Invoice PDF Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating customer invoice',
      error: error.message
    });
  }
});

// @desc    Generate Government Invoice PDF (with conditional pricing)
// @route   GET /api/sales/:id/govt-invoice
// @access  Private
const generateGovtInvoice = asyncHandler(async (req, res) => {
  const sale = await Sale.findById(req.params.id)
    .populate('customer', 'contactName contactNumber address')
    .populate('items.product', 'name image images');

  if (!sale) {
    return res.status(404).json({ 
      success: false,
      message: `Sale not found with id ${req.params.id}` 
    });
  }

  // Get company settings
  const settings = await Setting.findOne({ shop: sale.shop });
  if (!settings) {
    return res.status(404).json({
      success: false,
      message: 'Company settings not configured'
    });
  }

  // Calculate government invoice total with conditional pricing
  const originalTotal = sale.total || 0;
  let govtTotal = originalTotal;
  let extraFee = 0;

  if (originalTotal > 100000) {
    extraFee = 1000;
    govtTotal = originalTotal + extraFee;
  } else if (originalTotal > 50000) {
    extraFee = 500;
    govtTotal = originalTotal + extraFee;
  }

  // Create a modified sale object with government total
  const govtSale = {
    ...sale.toObject(),
    total: govtTotal,
    subTotal: sale.subTotal * (govtTotal / originalTotal),
    discount: sale.discount * (govtTotal / originalTotal),
    tax: sale.tax * (govtTotal / originalTotal),
    deliveryCharge: sale.deliveryCharge * (govtTotal / originalTotal),
    installationCost: sale.installationCost * (govtTotal / originalTotal),
    cardCharge: sale.cardCharge * (govtTotal / originalTotal)
  };

  const govtSaleObj = await attachWarrantiesToSaleObj(govtSale);

  try {
    const pdfBuffer = await generateInvoicePDF(govtSaleObj, settings);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="govt-invoice-${sale.invoiceNumber}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Government Invoice PDF Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating government invoice',
      error: error.message
    });
  }
});

// @desc    Update order status (for e-commerce tracking)
// @route   PUT /api/sales/:id/order-status
// @access  Private (Admin only)
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { orderStatus } = req.body;
  
  const validStatuses = ['Processing', 'Confirmed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'Returned'];
  
  if (!validStatuses.includes(orderStatus)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid order status'
    });
  }

  const sale = await Sale.findByIdAndUpdate(
    req.params.id,
    { orderStatus },
    { new: true, runValidators: true }
  );

  if (!sale) {
    return res.status(404).json({
      success: false,
      message: 'Sale not found'
    });
  }

  res.json({
    success: true,
    data: sale
  });
});

module.exports = {
  getSales,
  getSale,
  updateSale,
  updateSaleExpenses,
  updateSalePayment,
  updateSaleWithInventory, // Super Admin invoice edit
  deleteSale,
  recordSalesDueCollection,
  getDueCollections,
  createSalesReturn,
  getSalesReturns,
  generateInvoice,
  generateCustomerInvoice,
  generateGovtInvoice,
  updateOrderStatus,
  generateSaleQRCode,
  recalculateCustomerDues,
  getSaleInvoices
};
