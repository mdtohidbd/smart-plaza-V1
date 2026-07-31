const mongoose = require('mongoose');
const pdfMake = require('pdfmake');
const EMIInvoice = require('../models/EMIInvoice');
const EMICollection = require('../models/EMICollection');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const SaleOrder = require('../models/SaleOrder');
const Sale = require('../models/Sale');
const asyncHandler = require('express-async-handler');

const standardFonts = {
  Roboto: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique'
  }
};

// @desc    Get all EMI invoices with filters
// @route   GET /api/emi/invoices
// @access  Private (Super Admin, Admin, Manager)
const getAllEMIInvoices = asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 10, 
    status, 
    customer, 
    showroom,
    startDate,
    endDate,
    search,
    relatedSaleOrder
  } = req.query;

  const query = {};

  // Filter by relatedSaleOrder
  if (relatedSaleOrder) query.relatedSaleOrder = relatedSaleOrder;

  // Filter by status
  if (status) query.status = status;

  // Filter by customer
  if (customer) query.customer = customer;

  // Filter by showroom
  if (showroom) query.showroom = showroom;

  // Date range filter
  if (startDate || endDate) {
    query.invoiceDate = {};
    if (startDate) query.invoiceDate.$gte = new Date(startDate);
    if (endDate) query.invoiceDate.$lte = new Date(endDate);
  }

  // Search by invoice number or customer name/phone
  if (search) {
    query.$or = [
      { invoiceNumber: new RegExp(search, 'i') },
      { customerName: new RegExp(search, 'i') },
      { customerPhone: new RegExp(search, 'i') }
    ];
  }

  const invoices = await EMIInvoice.find(query)
    .populate('customer', 'name phone businessName')
    .populate('products.product', 'name image images')
    .populate('relatedSaleOrder', 'orderNumber')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));

  const total = await EMIInvoice.countDocuments(query);

  res.status(200).json({
    success: true,
    count: invoices.length,
    totalPages: Math.ceil(total / parseInt(limit)),
    currentPage: parseInt(page),
    data: invoices
  });
});

// @desc    Get single EMI invoice
// @route   GET /api/emi/invoices/:id
// @access  Private
const getEMIInvoiceById = asyncHandler(async (req, res) => {
  const invoice = await EMIInvoice.findById(req.params.id)
    .populate('products.product', 'name image images category')
    .populate('relatedSaleOrder')
    .populate('createdBy', 'name email')
    .populate('assignedSR', 'name email phone');

  if (!invoice) {
    return res.status(404).json({
      success: false,
      message: 'EMI Invoice not found'
    });
  }

  res.status(200).json({
    success: true,
    data: invoice
  });
});

// @desc    Create new EMI invoice
// @route   POST /api/emi/invoices
// @access  Private (Super Admin, Admin, Manager)
const createEMIInvoice = asyncHandler(async (req, res) => {
  const {
    customer,
    customerName,
    customerPhone,
    customerAddress,
    showroom,
    relatedSaleOrder,
    products,
    emiPlan,
    downPayment,
    notes,
    termsAndConditions,
    assignedSR
  } = req.body;

  // Validate required fields
  if (!customer || !customerName || !customerPhone || !showroom) {
    return res.status(400).json({
      success: false,
      message: 'Customer details and showroom are required'
    });
  }

  if (!emiPlan || !emiPlan.planType || !emiPlan.duration) {
    return res.status(400).json({
      success: false,
      message: 'EMI plan details are required'
    });
  }

  // Generate invoice number
  const date = new Date();
  const year = date.getFullYear().toString().substr(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  
  const count = await EMIInvoice.countDocuments({
    createdAt: { $gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()) }
  });
  
  const invoiceNumber = `EMI/${year}${month}${day}/${(count + 1).toString().padStart(3, '0')}`;

  // Create instalment schedule
  const instalments = [];
  const monthlyInstalment = emiPlan.monthlyInstalment || (emiPlan.totalPayableAmount / emiPlan.duration);
  
  for (let i = 1; i <= emiPlan.duration; i++) {
    const dueDate = new Date();
    dueDate.setMonth(dueDate.getMonth() + i);
    
    instalments.push({
      instalmentNumber: i,
      dueDate,
      amount: monthlyInstalment,
      status: 'pending'
    });
  }

  const invoice = await EMIInvoice.create({
    invoiceNumber,
    customer,
    customerName,
    customerPhone,
    customerAddress,
    showroom,
    relatedSaleOrder,
    products,
    emiPlan,
    downPayment: downPayment || { amount: 0 },
    instalments,
    notes,
    termsAndConditions,
    assignedSR,
    createdBy: req.user._id,
    status: 'active',
    isActive: true
  });

  // Update related sale order if exists
  if (relatedSaleOrder) {
    await SaleOrder.findByIdAndUpdate(relatedSaleOrder, {
      paymentMethod: 'EMI',
      emiInvoice: invoice._id
    });
  }

  res.status(201).json({
    success: true,
    message: 'EMI Invoice created successfully',
    data: invoice
  });
});

// @desc    Update EMI invoice
// @route   PUT /api/emi/invoices/:id
// @access  Private (Super Admin, Admin, Manager)
const updateEMIInvoice = asyncHandler(async (req, res) => {
  let invoice = await EMIInvoice.findById(req.params.id);

  if (!invoice) {
    return res.status(404).json({
      success: false,
      message: 'EMI Invoice not found'
    });
  }

  // Prevent modification of completed/cancelled invoices
  if (['completed', 'cancelled'].includes(invoice.status)) {
    return res.status(400).json({
      success: false,
      message: 'Cannot modify completed or cancelled invoices'
    });
  }

  invoice = await EMIInvoice.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    message: 'EMI Invoice updated successfully',
    data: invoice
  });
});

// @desc    Cancel EMI invoice
// @route   PUT /api/emi/invoices/:id/cancel
// @access  Private (Super Admin, Admin)
const cancelEMIInvoice = asyncHandler(async (req, res) => {
  const invoice = await EMIInvoice.findById(req.params.id);

  if (!invoice) {
    return res.status(404).json({
      success: false,
      message: 'EMI Invoice not found'
    });
  }

  if (invoice.status === 'completed') {
    return res.status(400).json({
      success: false,
      message: 'Cannot cancel completed invoice'
    });
  }

  invoice.status = 'cancelled';
  invoice.isActive = false;
  await invoice.save();

  // Update related sale order
  if (invoice.relatedSaleOrder) {
    await SaleOrder.findByIdAndUpdate(invoice.relatedSaleOrder, {
      paymentMethod: 'cancelled',
      emiInvoice: null
    });
  }

  res.status(200).json({
    success: true,
    message: 'EMI Invoice cancelled successfully',
    data: invoice
  });
});

// @desc    Mark EMI invoice as defaulted
// @route   PUT /api/emi/invoices/:id/default
// @access  Private (Super Admin, Admin, Manager)
const markAsDefaulted = asyncHandler(async (req, res) => {
  const invoice = await EMIInvoice.findById(req.params.id);

  if (!invoice) {
    return res.status(404).json({
      success: false,
      message: 'EMI Invoice not found'
    });
  }

  invoice.status = 'defaulted';
  invoice.isActive = false;
  await invoice.save();

  res.status(200).json({
    success: true,
    message: 'EMI Invoice marked as defaulted successfully',
    data: invoice
  });
});

// @desc    Generate legal notice PDF for defaulted EMI
// @route   GET /api/emi/invoices/:id/legal-notice
// @access  Private (Super Admin, Admin, Manager)
const generateLegalNotice = asyncHandler(async (req, res) => {
  const invoice = await EMIInvoice.findById(req.params.id)
    .populate('customer')
    .populate('products.product');

  if (!invoice) {
    return res.status(404).json({
      success: false,
      message: 'EMI Invoice not found'
    });
  }

  // Look up the related sale to extract serial numbers
  let sale = null;
  if (invoice.relatedSaleOrder) {
    sale = await Sale.findById(invoice.relatedSaleOrder);
  }

  // Generate PDF using pdfmake
  pdfMake.setFonts(standardFonts);

  const today = new Date();
  
  // Find overdue instalments
  const overdueInstalments = invoice.instalments.filter(inst => {
    return inst.status !== 'paid' && inst.dueDate && new Date(inst.dueDate) < today;
  });

  const totalOverduePrincipal = overdueInstalments.reduce((sum, inst) => sum + (inst.amount - inst.paidAmount), 0);
  const totalLateFee = overdueInstalments.reduce((sum, inst) => {
    const diffTime = Math.abs(today - new Date(inst.dueDate));
    const daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const monthsOverdue = Math.ceil(daysOverdue / 30) || 1;
    const instLateFee = (monthsOverdue * 0.01) * (invoice.subtotal || 0);
    const alreadyPaid = inst.lateFeePaid || 0;
    return sum + Math.max(0, Math.round(instLateFee - alreadyPaid));
  }, 0);

  // Match serial numbers from Sale items
  const productSerials = [];
  if (invoice.products && invoice.products.length > 0) {
    invoice.products.forEach(p => {
      const pId = p.product?._id ? p.product._id.toString() : (p.product ? p.product.toString() : null);
      let serial = 'N/A';
      if (sale && sale.items) {
        const match = sale.items.find(item => item.product && item.product.toString() === pId);
        if (match && match.serialNumber) {
          serial = match.serialNumber;
        }
      }
      productSerials.push({
        name: p.product?.name || p.name || 'Electronic Product',
        quantity: p.quantity || 1,
        serialNumber: serial
      });
    });
  }

  const docDefinition = {
    content: [
      // Official Legal Header
      {
        text: 'SMART PLAZA BD',
        fontSize: 20,
        bold: true,
        alignment: 'center',
        color: '#991b1b',
        margin: [0, 0, 0, 2]
      },
      {
        text: 'LEGAL DEPT. & CREDIT COMPLIANCE DIVISION',
        fontSize: 10,
        bold: true,
        alignment: 'center',
        color: '#475569',
        margin: [0, 0, 0, 2]
      },
      {
        text: '1 KDA Avenue, Shibbari, Khulna, Bangladesh | Phone: +880-1700-000000',
        fontSize: 8,
        alignment: 'center',
        color: '#64748b',
        margin: [0, 0, 0, 10]
      },
      { 
        canvas: [{ type: 'line', x1: 0, y1: 5, x2: 515, y2: 5, lineWidth: 2, lineColor: '#991b1b' }], 
        margin: [0, 0, 0, 15] 
      },
      // Title
      {
        text: 'FORMAL LEGAL NOTICE & FINAL DEMAND FOR PAYMENT',
        fontSize: 13,
        bold: true,
        color: '#991b1b',
        alignment: 'center',
        decoration: 'underline',
        margin: [0, 0, 0, 15]
      },
      // Date and Ref
      {
        columns: [
          { text: `Date: ${today.toLocaleDateString()}`, fontSize: 10, bold: true },
          { text: `Ref: SP/EMI-LN/${invoice.invoiceNumber}`, fontSize: 10, bold: true, alignment: 'right' }
        ],
        margin: [0, 0, 0, 15]
      },
      // Addressed To:
      {
        table: {
          widths: ['*'],
          body: [
            [
              {
                fillColor: '#f8fafc',
                borderColor: ['#991b1b', '#cbd5e1', '#cbd5e1', '#cbd5e1'], // Red left border, others grey
                border: [true, true, true, true],
                stack: [
                  { text: 'DEMAND RECIPIENT / DEBTOR DETAILS:', bold: true, fontSize: 9, color: '#475569', margin: [0, 0, 0, 4] },
                  { text: invoice.customerName || invoice.customer?.contactName || 'N/A', bold: true, fontSize: 11, color: '#0f172a' },
                  { text: `Phone: ${invoice.customerPhone || invoice.customer?.contactNumber || 'N/A'}`, fontSize: 9.5, color: '#334155' },
                  { text: `Workplace/Occupation: ${invoice.customer?.workplace || 'N/A'}`, fontSize: 9.5, color: '#334155' },
                  { text: `Permanent Address: ${invoice.customerAddress || invoice.customer?.address || 'N/A'}`, fontSize: 9.5, color: '#334155' }
                ],
                padding: [10, 8, 10, 8]
              }
            ]
          ]
        },
        margin: [0, 0, 0, 15]
      },
      // 1. Contractual Obligation
      {
        text: [
          { text: '1. CONTRACTUAL ENGAGEMENT & ACQUIRED ASSETS\n', bold: true, fontSize: 10, color: '#0f172a' },
          `Under the Hire-Purchase/EMI Agreement executed in connection with Invoice Number `,
          { text: invoice.invoiceNumber, bold: true },
          ` dated `,
          { text: new Date(invoice.invoiceDate).toLocaleDateString(), bold: true },
          `, you purchased and took possession of the following electronic equipment/assets from Smart Plaza BD:\n`
        ],
        fontSize: 9.5,
        lineHeight: 1.4,
        margin: [0, 0, 0, 6]
      },
      // Product details list
      {
        stack: productSerials.map(ps => {
          return {
            text: `• ${ps.name} (Qty: ${ps.quantity}) — Serial/IMEI No: ${ps.serialNumber}`,
            fontSize: 9.5,
            bold: true,
            margin: [15, 0, 0, 2]
          };
        }),
        margin: [0, 0, 0, 12]
      },
      // 2. Record of Default
      {
        text: [
          { text: '2. DEFAULT RECORD & FINANCIAL DELINQUENCY\n', bold: true, fontSize: 10, color: '#0f172a' },
          `Our audit and accounts department records indicate that you have committed a `,
          { text: 'MATERIAL BREACH ', bold: true, color: '#991b1b' },
          `of the repayment terms. You have failed to pay the consecutive monthly instalments on their scheduled due dates. A full breakdown of the delinquent instalments is provided below:`
        ],
        fontSize: 9.5,
        lineHeight: 1.4,
        margin: [0, 0, 0, 8]
      },
      // Delinquent table
      {
        table: {
          headerRows: 1,
          widths: ['*', 'auto', 'auto', 'auto', 'auto'],
          body: [
            [
              { text: 'Instalment #', bold: true, fontSize: 9, fillColor: '#f1f5f9' },
              { text: 'Due Date', bold: true, fontSize: 9, fillColor: '#f1f5f9' },
              { text: 'Amount', bold: true, fontSize: 9, alignment: 'right', fillColor: '#f1f5f9' },
              { text: 'Paid Amount', bold: true, fontSize: 9, alignment: 'right', fillColor: '#f1f5f9' },
              { text: 'Days Overdue', bold: true, fontSize: 9, alignment: 'right', fillColor: '#f1f5f9', color: '#991b1b' }
            ],
            ...overdueInstalments.map(inst => {
              const diffTime = Math.abs(today - new Date(inst.dueDate));
              const daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              return [
                { text: `Instalment ${inst.instalmentNumber}`, fontSize: 8.5 },
                { text: new Date(inst.dueDate).toLocaleDateString(), fontSize: 8.5 },
                { text: `BDT ${(inst.amount || 0).toFixed(2)}`, fontSize: 8.5, alignment: 'right' },
                { text: `BDT ${(inst.paidAmount || 0).toFixed(2)}`, fontSize: 8.5, alignment: 'right' },
                { text: `${daysOverdue} Days`, fontSize: 8.5, alignment: 'right', color: '#991b1b', bold: true }
              ];
            })
          ]
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 12]
      },
      // Financial Summary Box
      {
        table: {
          widths: ['*', 'auto'],
          body: [
            [
              { text: 'Total Overdue Principal Balance:', fontSize: 9.5, color: '#334155' },
              { text: `BDT ${totalOverduePrincipal.toFixed(2)}`, fontSize: 9.5, alignment: 'right', bold: true }
            ],
            [
              { text: 'Accumulated Late Fees / Penalty Interest:', fontSize: 9.5, color: '#991b1b' },
              { text: `BDT ${totalLateFee.toFixed(2)}`, fontSize: 9.5, alignment: 'right', color: '#991b1b', bold: true }
            ],
            [
              { text: 'TOTAL OUTSTANDING DEFAULT DEMAND:', fontSize: 10, bold: true, color: '#0f172a' },
              { text: `BDT ${(totalOverduePrincipal + totalLateFee).toFixed(2)}`, fontSize: 10, alignment: 'right', bold: true, color: '#991b1b' }
            ]
          ]
        },
        layout: {
          hLineWidth: function(i, node) { return (i === 0 || i === node.table.body.length) ? 1.5 : 0.5; },
          vLineWidth: function() { return 0; },
          hLineColor: function(i, node) { return (i === 0 || i === node.table.body.length) ? '#991b1b' : '#cbd5e1'; },
          paddingLeft: function(i) { return 10; },
          paddingRight: function(i) { return 10; },
          paddingTop: function(i) { return 6; },
          paddingBottom: function(i) { return 6; }
        },
        margin: [0, 0, 0, 15]
      },
      // 3. Notice of Repossession & Criminal Liability
      {
        text: [
          { text: '3. REPOSSESSION DEMAND & CRIMINAL / CIVIL LIABILITY CLAUSE\n', bold: true, fontSize: 10, color: '#991b1b' },
          `Pursuant to the provisions of the executed Hire-Purchase Agreement and under the laws of Bangladesh (including the Contract Act, 1872 and the Penal Code, 1860):\n`,
          { text: 'a) Immediate Surrender/Repossession: ', bold: true },
          `You are hereby commanded to either settle the total delinquent outstanding of `,
          { text: `BDT ${(totalOverduePrincipal + totalLateFee).toFixed(2)}`, bold: true, color: '#991b1b' },
          ` OR immediately surrender the hired assets (listed under Section 1 above) to any authorized agent of Smart Plaza BD within `,
          { text: 'seven (7) business days ', bold: true, color: '#991b1b' },
          `from the date of issuance of this notice.\n`,
          { text: 'b) Criminal Prosecution under Section 406/420: ', bold: true },
          `Failure to return the assets or settle the outstanding dues will be treated as dishonest misappropriation and conversion of property. Smart Plaza BD shall immediately lodge a criminal complaint/case under `,
          { text: 'Section 406 (Criminal Breach of Trust) and Section 420 (Cheating/Dishonesty) of the Penal Code of Bangladesh ', bold: true, color: '#991b1b' },
          `against you and your guarantor(s), which may result in arrest and prosecution. Additionally, civil proceedings for recovery of debt will be filed to recover all legal costs, court fees, and interest.`
        ],
        fontSize: 9.2,
        lineHeight: 1.4,
        margin: [0, 0, 0, 20]
      },
      // Signatures
      {
        columns: [
          {
            stack: [
              { text: 'Issued by:', fontSize: 8.5, color: '#475569' },
              { text: '\n\n\n________________________', color: '#cbd5e1' },
              { text: 'Accounts & Credit Audit Dept.', bold: true, fontSize: 9, color: '#1e293b' },
              { text: 'Smart Plaza BD', fontSize: 8.5, color: '#475569' }
            ]
          },
          {
            stack: [
              { text: 'Approved & Signed by:', fontSize: 8.5, color: '#475569', alignment: 'right' },
              { text: '\n\n\n________________________', color: '#cbd5e1', alignment: 'right' },
              { text: 'Head of Legal & Compliance', bold: true, fontSize: 9, color: '#1e293b', alignment: 'right' },
              { text: 'Smart Plaza BD', fontSize: 8.5, color: '#475569', alignment: 'right' }
            ]
          }
        ],
        margin: [0, 15, 0, 0]
      }
    ],
    defaultStyle: {
      fontSize: 10,
      color: '#000000'
    }
  };

  const pdfDoc = pdfMake.createPdf(docDefinition);
  const pdfBuffer = await pdfDoc.getBuffer();

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="legal-notice-${invoice.invoiceNumber}.pdf"`);
  res.send(pdfBuffer);
});

// @desc    Repossess product(s) from a defaulted EMI invoice
// @route   POST /api/emi/invoices/:id/repossess
// @access  Private (Super Admin, Admin)
const repossessProduct = asyncHandler(async (req, res) => {
  const { productId, quantity, notes } = req.body;

  if (!productId || !quantity) {
    return res.status(400).json({
      success: false,
      message: 'Product ID and quantity are required'
    });
  }

  const invoice = await EMIInvoice.findById(req.params.id);

  if (!invoice) {
    return res.status(404).json({
      success: false,
      message: 'EMI Invoice not found'
    });
  }

  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }

  // Create Sale Return entry in Inventory to add back to warehouse
  const Inventory = mongoose.model('Inventory');
  const Shop = mongoose.model('Shop');
  let shopId = invoice.showroom || req.shopId;
  if (!shopId) {
    const defaultShop = await Shop.findOne();
    if (defaultShop) {
      shopId = defaultShop._id;
    }
  }

  await Inventory.create({
    shop: shopId || '654321098765432109876543',
    product: productId,
    type: 'Sale Return',
    referenceId: invoice._id,
    referenceModel: 'Sale', // Match enum: ['Sale', 'Purchase', 'SaleReturn', 'PurchaseReturn'] in referenceModel
    quantity: Math.abs(quantity), // Positives add stock back in
    unitPrice: product.price || 0,
    date: new Date(),
    note: notes || `Asset repossession for EMI Invoice ${invoice.invoiceNumber}`,
  });

  // Track the repossession in EMIInvoice
  invoice.repossessedProducts.push({
    product: productId,
    quantity: Math.abs(quantity),
    repossessedAt: new Date(),
    notes: notes || 'Product repossessed due to instalment defaults.'
  });

  // Automatically mark the invoice status as defaulted and set active to false
  invoice.status = 'defaulted';
  invoice.isActive = false;

  await invoice.save();

  res.status(200).json({
    success: true,
    message: 'Product successfully repossessed and stock routed back to warehouse',
    data: invoice
  });
});

module.exports = {
  getAllEMIInvoices,
  getEMIInvoiceById,
  createEMIInvoice,
  updateEMIInvoice,
  cancelEMIInvoice,
  markAsDefaulted,
  generateLegalNotice,
  repossessProduct
};
