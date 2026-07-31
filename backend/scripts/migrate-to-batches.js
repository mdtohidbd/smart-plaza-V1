const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

// Load models
const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const StockBatch = require('../models/StockBatch');
const Supplier = require('../models/Supplier');

// Connect to DB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
};

const migrateToBatches = async () => {
  try {
    await connectDB();

    console.log('Starting migration to StockBatches...');

    // Get a default supplier for legacy opening stock
    // If no supplier exists, we will create a dummy one
    let defaultSupplier = await Supplier.findOne();
    if (!defaultSupplier) {
      defaultSupplier = await Supplier.create({
        businessName: 'Legacy System Migrated',
        contactPerson: 'System',
        phone: '0000000000'
      });
      console.log('Created default dummy supplier for legacy stock.');
    }

    const products = await Product.find();
    let migratedCount = 0;
    let skippedCount = 0;

    for (const product of products) {
      // Calculate net stock from legacy Inventory collection
      const inventoryRecords = await Inventory.find({ product: product._id });
      
      let netQty = 0;
      inventoryRecords.forEach(record => {
        const type = record.type;
        const addTypes = ['Opening Stock', 'Purchase', 'Sale Return', 'Transfer In'];
        const subtractTypes = ['Sale', 'Purchase Return', 'Damage', 'Free Product', 'Transfer Out'];
        
        if (addTypes.includes(type)) {
          netQty += record.quantity;
        } else if (subtractTypes.includes(type)) {
          netQty -= record.quantity;
        } else if (type === 'Adjustment') {
          // Some systems use adjustment as absolute, but let's assume it's additive/subtractive based on sign
          netQty += record.quantity;
        }
      });

      if (netQty > 0) {
        // Check if a batch already exists for this product (idempotency)
        const existingBatch = await StockBatch.findOne({ product: product._id, isOpeningStock: true });
        
        if (!existingBatch) {
          // Create an initial stock batch
          const batchNumber = `MIGRATE-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          
          await StockBatch.create({
            batchNumber,
            product: product._id,
            supplier: defaultSupplier._id,
            isOpeningStock: true,
            purchaseDate: new Date(),
            purchasePrice: product.purchasePrice || 0,
            sellingPrice: product.sellingPrice || 0,
            emiPrice: product.emiPrice || 0,
            quantity: netQty,
            remainingQty: netQty,
            isActive: true,
            isListedOnEcommerce: product.isListedOnEcommerce || false,
            note: 'Auto-migrated from legacy inventory'
          });
          
          console.log(`Migrated Product: ${product.name} (Qty: ${netQty})`);
          migratedCount++;
        } else {
          console.log(`Skipped Product (Already Migrated): ${product.name}`);
          skippedCount++;
        }
      } else {
        console.log(`Skipped Product (Zero or Negative Stock): ${product.name}`);
        skippedCount++;
      }
    }

    console.log('--- Migration Summary ---');
    console.log(`Successfully migrated: ${migratedCount} products.`);
    console.log(`Skipped: ${skippedCount} products.`);
    console.log('Migration complete. You can now safely use the batch-based system.');

    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrateToBatches();
