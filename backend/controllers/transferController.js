const Transfer = require('../models/Transfer');
const Inventory = require('../models/Inventory');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Setting = require('../models/Setting');
const { generateTransferInvoicePDF } = require('../utils/transferInvoiceGenerator');

// @desc    Get all transfers
// @route   GET /api/transfers
// @access  Private
exports.getTransfers = async (req, res) => {
  try {
    const transfers = await Transfer.find({ shop: req.shopId })
      .populate('contact', 'contactName contactNumber')
      .populate('items.product', 'name sku sellingPrice mrp')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: transfers
    });
  } catch (error) {
    console.error('Error fetching transfers:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Create a new transfer
// @route   POST /api/transfers
// @access  Private
exports.createTransfer = async (req, res) => {
  try {
    const { contact, date, items, conditions, note } = req.body;

    if (!contact || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide contact and items'
      });
    }

    // Check inventory availability
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found with id ${item.product}`
        });
      }
      
      const actualStock = await product.getActualStock(req.shopId);
      if (actualStock < item.quantityTaken) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${actualStock}, Requested: ${item.quantityTaken}`
        });
      }
    }

    // Generate Reference Number
    let referenceNumber;
    let count = await Transfer.countDocuments(); // count globally to avoid shop-level duplication
    let isUnique = false;
    
    while (!isUnique) {
      referenceNumber = `TRF-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${(count + 1).toString().padStart(4, '0')}`;
      const existing = await Transfer.findOne({ referenceNumber });
      if (!existing) {
        isUnique = true;
      } else {
        count++;
      }
    }

    // Create Transfer
    const transfer = await Transfer.create({
      shop: req.shopId,
      referenceNumber,
      contact,
      date: date || new Date(),
      conditions,
      note,
      items: items.map(item => ({
        product: item.product,
        modelName: item.modelName,
        serialNumbers: item.serialNumbers || [],
        quantityTaken: item.quantityTaken,
        returnedQuantity: 0
      })),
      status: 'Pending',
      createdBy: req.user._id
    });

    // Update Inventory
    for (const item of items) {
      const product = await Product.findById(item.product);
      await Inventory.create({
        shop: req.shopId,
        product: item.product,
        type: 'Transfer Out',
        referenceId: transfer._id,
        referenceModel: 'Transfer',
        quantity: -item.quantityTaken,
        unitPrice: product.purchasePrice || 0, // Using purchase price as value reference
        date: date || new Date(),
        note: referenceNumber,
        serialNumbers: item.serialNumbers || []
      });
    }

    res.status(201).json({
      success: true,
      data: transfer
    });
  } catch (error) {
    console.error('Error creating transfer:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Process a transfer return
// @route   POST /api/transfers/:id/return
// @access  Private
exports.returnTransferItems = async (req, res) => {
  try {
    const { itemsReturned, date } = req.body;
    const transferId = req.params.id;

    if (!itemsReturned || itemsReturned.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide items being returned'
      });
    }

    const transfer = await Transfer.findOne({ _id: transferId, shop: req.shopId });
    
    if (!transfer) {
      return res.status(404).json({
        success: false,
        message: 'Transfer not found'
      });
    }

    if (transfer.status === 'Completed') {
      return res.status(400).json({
        success: false,
        message: 'This transfer is already completed'
      });
    }

    // Process each returned item
    const formattedReturnedItems = [];
    let hasUpdates = false;
    // Track which original products have already had their returnedQuantity updated
    const updatedOriginals = new Set();

    for (const returnItem of itemsReturned) {
      // Find the original item in the transfer
      const originalItemIndex = transfer.items.findIndex(
        item => item.product.toString() === returnItem.originalProduct
      );

      if (originalItemIndex !== -1) {
        const originalItem = transfer.items[originalItemIndex];
        const qtyToReturn = returnItem.quantity;
        
        if (qtyToReturn > 0) {
          hasUpdates = true;

          // Only increment returnedQuantity ONCE per unique originalProduct
          // (multiple replacement products for 1 original = still 1 original returned)
          if (!updatedOriginals.has(returnItem.originalProduct)) {
            const pendingQty = originalItem.quantityTaken - originalItem.returnedQuantity;
            // Mark the original as fully returned (or by pending amount)
            transfer.items[originalItemIndex].returnedQuantity += Math.min(pendingQty, originalItem.quantityTaken);
            updatedOriginals.add(returnItem.originalProduct);
          }
          
          formattedReturnedItems.push({
            originalProduct: returnItem.originalProduct,
            returnedProduct: returnItem.returnedProduct, // Can be different from original!
            serialNumbers: returnItem.serialNumbers || [],
            quantity: qtyToReturn
          });

          // Add to inventory
          const product = await Product.findById(returnItem.returnedProduct);
          await Inventory.create({
            shop: req.shopId,
            product: returnItem.returnedProduct,
            type: 'Transfer In',
            referenceId: transfer._id,
            referenceModel: 'Transfer',
            quantity: qtyToReturn, // Positive quantity for incoming
            unitPrice: product ? (product.purchasePrice || 0) : 0,
            date: date || new Date(),
            note: transfer.referenceNumber,
            serialNumbers: returnItem.serialNumbers || []
          });
        }
      }
    }

    if (hasUpdates) {
      // Add to return transactions history
      transfer.returnTransactions.push({
        date: date || new Date(),
        itemsReturned: formattedReturnedItems,
        processedBy: req.user._id
      });

      // Update overall status
      const allFullyReturned = transfer.items.every(item => item.returnedQuantity >= item.quantityTaken);
      const noneReturned = transfer.items.every(item => item.returnedQuantity === 0);
      
      if (allFullyReturned) {
        transfer.status = 'Completed';
      } else if (!noneReturned) {
        transfer.status = 'Partial';
      }

      await transfer.save();
    }

    res.json({
      success: true,
      data: transfer
    });
  } catch (error) {
    console.error('Error returning transfer items:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Generate Transfer Invoice PDF
// @route   GET /api/transfers/:id/invoice
// @access  Private
exports.generateTransferInvoice = async (req, res) => {
  try {
    const transfer = await Transfer.findById(req.params.id)
      .populate('contact', 'contactName contactNumber address')
      .populate('items.product', 'name sku sellingPrice mrp')
      .populate('returnTransactions.processedBy', 'name')
      .populate('returnTransactions.itemsReturned.originalProduct', 'name sku')
      .populate('returnTransactions.itemsReturned.returnedProduct', 'name sku');

    if (!transfer) {
      return res.status(404).json({ success: false, message: 'Transfer not found' });
    }

    const settings = await Setting.findOne();
    const companyInfo = settings ? {
      companyName: settings.companyName,
      companyAddress: settings.companyAddress,
      phone: settings.phone,
      email: settings.email
    } : {};

    const pdfBuffer = await generateTransferInvoicePDF(transfer, companyInfo);

    const action = req.query.action || 'view'; // default to view
    const disposition = action === 'download' ? 'attachment' : 'inline';

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `${disposition}; filename="transfer-${transfer.referenceNumber}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Transfer Invoice PDF Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating transfer invoice',
      error: error.message
    });
  }
};
