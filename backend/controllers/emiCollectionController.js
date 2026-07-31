const EMICollection = require('../models/EMICollection');
const EMIInvoice = require('../models/EMIInvoice');
const Sale = require('../models/Sale');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const { recordEmiCollectionIncome } = require('../utils/accountLedgerSync');

// @desc    Get all EMI collections
// @route   GET /api/emi/collections
// @access  Private
const getAllEMICollections = asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 10, 
    status, 
    customer,
    invoiceNumber,
    startDate,
    endDate,
    collectedBy
  } = req.query;

  const query = {};

  if (status) query.status = status;
  if (customer) query.customer = customer;
  if (invoiceNumber) query.invoiceNumber = invoiceNumber;
  if (collectedBy) query.collectedBy = collectedBy;

  // Date range filter
  if (startDate || endDate) {
    query.collectionDate = {};
    if (startDate) query.collectionDate.$gte = new Date(startDate);
    if (endDate) query.collectionDate.$lte = new Date(endDate);
  }

  const collections = await EMICollection.find(query)
    .populate('customer', 'name phone businessName')
    .populate('emiInvoice', 'invoiceNumber emiPlan')
    .populate('collectedBy', 'name email')
    .sort({ collectionDate: -1 })
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));

  const total = await EMICollection.countDocuments(query);

  res.status(200).json({
    success: true,
    count: collections.length,
    totalPages: Math.ceil(total / parseInt(limit)),
    currentPage: parseInt(page),
    data: collections
  });
});

// @desc    Get single EMI collection
// @route   GET /api/emi/collections/:id
// @access  Private
const getEMICollectionById = asyncHandler(async (req, res) => {
  const collection = await EMICollection.findById(req.params.id)
    .populate('customer', 'name phone email address')
    .populate('emiInvoice')
    .populate('collectedBy', 'name email phone');

  if (!collection) {
    return res.status(404).json({
      success: false,
      message: 'EMI Collection not found'
    });
  }

  res.status(200).json({
    success: true,
    data: collection
  });
});

// @desc    Record EMI collection
// @route   POST /api/emi/collections
// @access  Private (Super Admin, Admin, SR, DSR)
const recordEMICollection = asyncHandler(async (req, res) => {
  const {
    emiInvoice,
    invoiceNumber,
    customer,
    customerName,
    customerPhone,
    instalmentNumber,
    dueDate,
    scheduledAmount,
    collectedAmount,
    paymentMethod,
    transactionId,
    chequeNumber,
    bankName,
    lateFee,
    notes,
    customerFeedback,
    followUpRequired,
    followUpDate,
    collectionLocation
  } = req.body;

  console.log('--- RECORD EMI COLLECTION PAYLOAD ---', req.body);

  let resolvedCustomer = customer;
  if (!resolvedCustomer && emiInvoice) {
    const invoiceDoc = await EMIInvoice.findById(emiInvoice);
    if (invoiceDoc && invoiceDoc.customer) {
      resolvedCustomer = invoiceDoc.customer;
    }
  }
  
  // If customer is STILL missing (e.g. database corruption where the original customer was permanently dropped),
  // we fallback to a new valid ObjectId so the collection can still be recorded (since we have customerName anyway).
  if (!resolvedCustomer) {
    resolvedCustomer = new mongoose.Types.ObjectId();
  }

  // Validate required fields
  if (!emiInvoice || !resolvedCustomer || !customerName || !instalmentNumber) {
    return res.status(400).json({
      success: false,
      message: `Invoice, customer, and instalment details are required. Missing: ${!emiInvoice ? 'emiInvoice ' : ''}${!resolvedCustomer ? 'customer ' : ''}${!customerName ? 'customerName ' : ''}${!instalmentNumber ? 'instalmentNumber' : ''}`
    });
  }

  if (!collectedAmount || collectedAmount <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Collection amount must be greater than 0'
    });
  }

  // Check if instalment already paid
  const existingCollection = await EMICollection.findOne({
    emiInvoice,
    instalmentNumber,
    status: 'paid'
  });

  if (existingCollection) {
    return res.status(400).json({
      success: false,
      message: 'This instalment is already marked as paid'
    });
  }

  const collection = await EMICollection.create({
    emiInvoice,
    invoiceNumber,
    customer: resolvedCustomer,
    customerName,
    customerPhone,
    instalmentNumber,
    dueDate,
    scheduledAmount,
    collectedAmount,
    paymentMethod,
    transactionId,
    chequeNumber,
    bankName,
    lateFee: lateFee || 0,
    notes,
    customerFeedback,
    followUpRequired: followUpRequired || false,
    followUpDate,
    collectionLocation: collectionLocation || 'showroom',
    collectedBy: req.body.collectedBy || req.user._id
  });

  try {
    const emiInvoiceDoc = await EMIInvoice.findById(emiInvoice);
    if (!emiInvoiceDoc) {
      return res.status(404).json({ success: false, message: 'EMI Invoice not found' });
    }

    let saleInvoiceNumber = invoiceNumber;
    if (emiInvoiceDoc.relatedSaleOrder) {
      const relatedSale = await Sale.findById(emiInvoiceDoc.relatedSaleOrder).select('invoiceNumber');
      if (relatedSale?.invoiceNumber) {
        saleInvoiceNumber = relatedSale.invoiceNumber;
      }
    }

    await recordEmiCollectionIncome({
      collection,
      saleInvoiceNumber,
      customerName,
      shopId: req.shopId,
      userId: req.user?._id || req.user?.id,
    });
  } catch (ledgerError) {
    console.error('Failed to sync EMI collection income or update invoice:', ledgerError.message);
  }

  res.status(201).json({
    success: true,
    message: 'EMI collection recorded successfully',
    data: collection
  });
});

// @desc    Update EMI collection
// @route   PUT /api/emi/collections/:id
// @access  Private (Super Admin, Admin)
const updateEMICollection = asyncHandler(async (req, res) => {
  let collection = await EMICollection.findById(req.params.id);

  if (!collection) {
    return res.status(404).json({
      success: false,
      message: 'EMI Collection not found'
    });
  }

  collection = await EMICollection.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    message: 'EMI collection updated successfully',
    data: collection
  });
});

// @desc    Delete EMI collection
// @route   DELETE /api/emi/collections/:id
// @access  Private (Super Admin, Admin)
const deleteEMICollection = asyncHandler(async (req, res) => {
  const collection = await EMICollection.findById(req.params.id);

  if (!collection) {
    return res.status(404).json({
      success: false,
      message: 'EMI Collection not found'
    });
  }

  await collection.deleteOne();

  res.status(200).json({
    success: true,
    message: 'EMI collection deleted successfully',
    data: {}
  });
});

// @desc    Get EMI collection installments (overdue, today, upcoming)
// @route   GET /api/emi/collections/installments
// @access  Private
const getCollectionInstallments = asyncHandler(async (req, res) => {
  console.log('💵 EMI Installments request received with query:', req.query);

  const { page = 1, limit = 10, filter = 'overdue', search = '', sort = '' } = req.query; // overdue, today, upcoming

  // Build query
  const invoiceQuery = { status: { $in: ['active', 'defaulted'] } };
  
  if (search) {
    invoiceQuery.$or = [
      { invoiceNumber: { $regex: search, $options: 'i' } },
      { customerName: { $regex: search, $options: 'i' } }
    ];
  }

  // Get all active EMI invoices
  const invoices = await EMIInvoice.find(invoiceQuery);

  console.log('🔍 Found EMI invoices:', invoices.length);

  const instalmentsList = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  invoices.forEach((invoice, idx) => {
    console.log(`  📄 Invoice ${idx+1} (${invoice.invoiceNumber}) has ${invoice.instalments?.length || 0} instalments`);
    
    if (!Array.isArray(invoice.instalments)) {
      console.log(`  ⚠️  Invoice ${invoice.invoiceNumber} has no instalments array!`);
      return;
    }
    
    invoice.instalments.forEach((instalment, instIdx) => {
      console.log(`    📅 Instalment ${instIdx+1}:`, {
        status: instalment.status,
        dueDate: instalment.dueDate,
        amount: instalment.amount,
        paidAmount: instalment.paidAmount
      });

      // Include pending, partial, or overdue status (for extra safety)
      if (instalment.status === 'pending' || instalment.status === 'partial' || instalment.status === 'overdue') {
        if (instalment.dueDate) {
          const dueDate = new Date(instalment.dueDate);
          dueDate.setHours(0, 0, 0, 0);

          let match = false;
          let daysOverdue = 0;
          
          if (filter === 'all') {
            match = true;
            if (dueDate < today) {
              const diffTime = Math.abs(today - dueDate);
              daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            }
          } else if (filter === 'overdue' && dueDate < today) {
            match = true;
            const diffTime = Math.abs(today - dueDate);
            daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          } else if (filter === 'today' && dueDate.getTime() === today.getTime()) {
            match = true;
          } else if (filter === 'upcoming' && dueDate > today) {
            match = true;
          }

          if (match) {
            let recommendedLateFee = 0;
            if (dueDate < today) {
              const monthsOverdue = Math.ceil(daysOverdue / 30) || 1; // At least 1 if overdue
              const totalLateFee = (monthsOverdue * 0.01) * (invoice.subtotal || 0);
              const alreadyPaid = instalment.lateFeePaid || 0;
              recommendedLateFee = Math.max(0, Math.round(totalLateFee - alreadyPaid));
            }

            const instalmentData = {
              invoice: invoice._id,
              invoiceNumber: invoice.invoiceNumber,
              customer: invoice.customer,
              customerName: invoice.customerName,
              customerPhone: invoice.customerPhone,
              customerAddress: invoice.customerAddress,
              instalmentNumber: instalment.instalmentNumber,
              dueDate: instalment.dueDate,
              amount: instalment.amount,
              paidAmount: instalment.paidAmount || 0,
              lateFeePaid: instalment.lateFeePaid || 0,
              subtotal: invoice.subtotal || 0,
              daysOverdue,
              recommendedLateFee,
              status: instalment.status
            };
            
            console.log(`    ✅ Adding to list:`, instalmentData);
            instalmentsList.push(instalmentData);
          } else {
            console.log(`    ❌ Not matching filter: ${filter}`);
          }
        }
      }
    });
  });

  console.log('📋 Total matching instalments:', instalmentsList.length);

  // Optional JS-level search filter (in case customerName isn't directly on invoice for some reason)
  let filteredInstalments = instalmentsList;
  if (search) {
    const searchLower = search.toLowerCase();
    filteredInstalments = instalmentsList.filter(inst => 
      (inst.customerName && inst.customerName.toLowerCase().includes(searchLower)) ||
      (inst.invoiceNumber && inst.invoiceNumber.toLowerCase().includes(searchLower))
    );
  }

  // Sort by date
  if (sort === 'asc') {
    filteredInstalments.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  } else if (sort === 'desc') {
    filteredInstalments.sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate));
  } else {
    // Default Sorting
    if (filter === 'all') {
      filteredInstalments.sort((a, b) => {
        const dateA = new Date(a.dueDate);
        const dateB = new Date(b.dueDate);
        dateA.setHours(0, 0, 0, 0);
        dateB.setHours(0, 0, 0, 0);

        const isTodayA = dateA.getTime() === today.getTime();
        const isTodayB = dateB.getTime() === today.getTime();
        
        const isOverdueA = dateA < today;
        const isOverdueB = dateB < today;

        const isUpcomingA = dateA > today;
        const isUpcomingB = dateB > today;

        // 1. Today's due first
        if (isTodayA && !isTodayB) return -1;
        if (!isTodayA && isTodayB) return 1;

        // 2. Overdues second
        if (isOverdueA && !isOverdueB) return -1;
        if (!isOverdueA && isOverdueB) return 1;

        // 3. Upcomings third (implicitly handled if the above two don't return)

        // If in the same group, sort appropriately
        if (isOverdueA && isOverdueB) {
          return b.daysOverdue - a.daysOverdue; // Most overdue first
        }
        
        // For today or upcoming, sort by earliest date first
        return dateA - dateB;
      });
    } else if (filter === 'upcoming') {
      filteredInstalments.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    } else {
      // overdue or today: sort by most overdue first (or earliest date first)
      filteredInstalments.sort((a, b) => b.daysOverdue - a.daysOverdue);
    }
  }

  // Paginate
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedInstalments = filteredInstalments.slice(startIndex, endIndex);

  res.status(200).json({
    success: true,
    count: paginatedInstalments.length,
    total: filteredInstalments.length,
    currentPage: parseInt(page),
    data: paginatedInstalments
  });
});

module.exports = {
  getAllEMICollections,
  getEMICollectionById,
  recordEMICollection,
  updateEMICollection,
  deleteEMICollection,
  getCollectionInstallments
};
