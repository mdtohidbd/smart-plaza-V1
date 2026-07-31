const Inventory = require('../models/Inventory');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Warranty = require('../models/Warranty');
const WarrantyTemplate = require('../models/WarrantyTemplate');
const mongoose = require('mongoose');

/**
 * Validates stock availability for the given items
 * @param {Array} items - Array of items with {product, quantity}
 * @returns {Object} { isValid: boolean, error: string|null }
 */
const validateStock = async (items, shopId) => {
  for (const item of items) {
    const product = await Product.findById(item.product);
    if (!product) {
      return { isValid: false, error: `Product not found with id ${item.product}` };
    }
    
    // Get actual stock from inventory
    const actualStock = await product.getActualStock(shopId);
    
    if (actualStock < item.quantity) {
      return { 
        isValid: false, 
        error: `Insufficient stock for ${product.name}. Available: ${actualStock}, Requested: ${item.quantity}` 
      };
    }
  }
  return { isValid: true, error: null };
};

/**
 * Deducts stock for a newly created sale
 * @param {Array} items - Array of items sold
 * @param {ObjectId} saleId - The sale ID
 * @param {Date} date - Sale date
 * @param {String} invoiceNumber - Sale invoice number
 * @param {ObjectId} shopId - Shop ID
 */
const deductInventoryForSale = async (items, saleId, date, invoiceNumber, shopId) => {
  for (const item of items) {
    await Inventory.create({
      product: item.product,
      type: 'Sale',
      referenceId: saleId,
      referenceModel: 'Sale',
      quantity: -item.quantity, // Negative because it's a sale (stock going out)
      unitPrice: item.unitPrice,
      date: date || new Date(),
      note: invoiceNumber,
      shop: shopId,
      serialNumbers: item.serialNumber ? item.serialNumber.split(',').map(s => s.trim()) : []
    });

    // 1. Deduct from StockBatch (FIFO)
    const StockBatch = mongoose.model('StockBatch');
    const batches = await StockBatch.find({
      product: item.product,
      ...(shopId && { shop: shopId }),
      remainingQty: { $gt: 0 }
    }).sort({ purchaseDate: 1 });

    let qtyToDeduct = item.quantity;
    let totalPurchaseCost = 0;
    let itemBatchesUsed = [];

    for (const batch of batches) {
      if (qtyToDeduct <= 0) break;
      const deductAmt = Math.min(batch.remainingQty, qtyToDeduct);
      batch.remainingQty -= deductAmt;
      qtyToDeduct -= deductAmt;
      
      itemBatchesUsed.push({
        batch: batch._id,
        quantity: deductAmt,
        purchasePrice: batch.purchasePrice
      });
      totalPurchaseCost += (deductAmt * batch.purchasePrice);
      
      if (batch.remainingQty === 0) {
        batch.isActive = false;
      }
      await batch.save();
    }
    
    // Attach computed values to the item object for later saving
    item.computedBatches = itemBatchesUsed;
    item.computedPurchaseCost = totalPurchaseCost;

      // Deduct from StockUnit if trackSerials is true
    const product = await Product.findById(item.product);
    if (product && product.trackSerials) {
      if (item.serialNumber) {
        const serials = item.serialNumber.split(',').map(s => s.trim());
        await mongoose.model('StockUnit').updateMany(
          { product: item.product, serialNumber: { $in: serials } },
          { $set: { status: 'sold' } }
        );
      }
    }
  }

  // Find the Sale document and update items with computed batches and cost
  const Sale = mongoose.model('Sale');
  const sale = await Sale.findById(saleId);
  if (sale) {
    for (let i = 0; i < sale.items.length; i++) {
      const saleItem = sale.items[i];
      // Find matching item from the frontend request to get its computed values
      const origItemIndex = items.findIndex(item => item.product.toString() === saleItem.product.toString());
      if (origItemIndex !== -1) {
        saleItem.batchesUsed = items[origItemIndex].computedBatches || [];
        saleItem.purchaseCost = items[origItemIndex].computedPurchaseCost || 0;
      }
    }
    await sale.save();
  }
};

/**
 * Pre-allocates serial numbers for items if they track serials and don't have them assigned.
 * @param {Array} items - Array of items from req.body.items
 * @param {ObjectId} shopId - Shop ID
 * @returns {Array} items with assigned serial numbers
 */
const allocateSerialNumbers = async (items, shopId) => {
  const StockUnit = mongoose.model('StockUnit');
  console.log(`[ALLOCATE] Start allocating for ${items.length} items. ShopID:`, shopId);
  
  for (const item of items) {
    console.log(`[ALLOCATE] Processing item product: ${item.product}, qty: ${item.quantity}`);
    const product = await Product.findById(item.product);
    if (product && product.trackSerials) {
      console.log(`[ALLOCATE] Product ${product.name} tracks serials.`);
      if (!item.serialNumber) {
        console.log(`[ALLOCATE] No serialNumber provided by frontend. Searching DB...`);
        // Find available units
        let availableUnits = await StockUnit.find({
          product: item.product,
          shop: shopId,
          status: 'available'
        }).limit(item.quantity).sort({ createdAt: 1 });
        
        console.log(`[ALLOCATE] Found ${availableUnits.length} units for shop ${shopId}`);

        // Fallback if not enough in this shop
        if (availableUnits.length < item.quantity && shopId) {
          const extraNeeded = item.quantity - availableUnits.length;
          const extraUnits = await StockUnit.find({
            product: item.product,
            shop: { $exists: false },
            status: 'available'
          }).limit(extraNeeded).sort({ createdAt: 1 });
          
          console.log(`[ALLOCATE] Fallback found ${extraUnits.length} extra units without shop constraint`);
          availableUnits = [...availableUnits, ...extraUnits];
        }

        if (availableUnits.length > 0) {
          item.serialNumber = availableUnits.map(u => u.serialNumber).join(', ');
          console.log(`[ALLOCATE] Assigned serialNumber: ${item.serialNumber}`);
        } else {
          item.serialNumber = item.serialNumber || '';
          console.log(`[ALLOCATE] No available units found! Kept serialNumber empty.`);
        }
      } else {
        console.log(`[ALLOCATE] item.serialNumber already exists: ${item.serialNumber}`);
      }
    } else {
      console.log(`[ALLOCATE] Product does not track serials or not found.`);
      item.serialNumber = item.serialNumber || '';
    }
  }
  
  console.log(`[ALLOCATE] Final items array:`, JSON.stringify(items, null, 2));
  return items;
};

/**
 * Automatically creates warranty records for applicable products
 * @param {Array} warrantyData - Array of warranty data from frontend
 * @param {ObjectId} customerId - Customer ID
 * @param {ObjectId} saleId - Sale ID
 * @param {Date} date - Sale date
 */
const createWarrantyRecords = async (warrantyData, customerId, saleId, date) => {
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
          warrantyTemplate: template._id,
          warrantyName: template.name,
          product: wd.productId,
          customer: customerId,
          sale: saleId,
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
};

/**
 * Updates customer's total due balance
 * @param {ObjectId} customerId - Customer ID
 * @param {Number} dueAmount - Amount due added from this sale
 */
const updateCustomerDue = async (customerId, dueAmount) => {
  if (dueAmount > 0) {
    const customerDoc = await Customer.findById(customerId);
    if (customerDoc) {
      customerDoc.totalDue += dueAmount;
      await customerDoc.save();
    }
  }
};

module.exports = {
  validateStock,
  deductInventoryForSale,
  createWarrantyRecords,
  updateCustomerDue,
  allocateSerialNumbers
};
