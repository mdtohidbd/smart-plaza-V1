/**
 * SMART PLAZA - COMPREHENSIVE HANDOVER CLEANUP SCRIPT
 * Removes all transactional, test, and operational dummy data.
 * Preserves essential system configuration, users, roles, shops, settings, 
 * and catalog metadata (categories, brands, units, expenseheads, incomeheads, MFS/POS, warranty templates).
 * 
 * Run: node scripts/handover_cleanup.js
 */

require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');

// Import transactional models to clear
const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');
const Product = require('../models/Product');
const StockBatch = require('../models/StockBatch');
const StockUnit = require('../models/StockUnit');
const Sale = require('../models/Sale');
const SaleOrder = require('../models/SaleOrder');
const Purchase = require('../models/Purchase');
const Quotation = require('../models/Quotation');
const EMIInvoice = require('../models/EMIInvoice');
const EMICollection = require('../models/EMICollection');
const Payment = require('../models/Payment');
const Inventory = require('../models/Inventory');
const Transfer = require('../models/Transfer');
const Warranty = require('../models/Warranty');
const Offer = require('../models/Offer');
const Banner = require('../models/Banner');
const Testimonial = require('../models/Testimonial');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const Income = require('../models/Income');
const Expense = require('../models/Expense');
const ProfitDistribution = require('../models/ProfitDistribution');
const Review = require('../models/Review');
const Question = require('../models/Question');
const Investor = require('../models/Investor');

// Import configuration/catalog models to preserve/reset
const Account = require('../models/Account');

const runCleanup = async () => {
  console.log('🔌 Connecting to MongoDB Atlas...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to Database!\n');

  console.log('═'.repeat(60));
  console.log('🧹 RUNNING THOROUGH HANDOVER CLEANUP...');
  console.log('═'.repeat(60));

  // Helper function to delete and log
  const wipeCollection = async (model, label) => {
    try {
      const count = await model.countDocuments();
      if (count > 0) {
        await model.deleteMany({});
        console.log(`  🗑️  Wiped ${count} documents from ${label}`);
      } else {
        console.log(`  ⚪ No documents to clean in ${label}`);
      }
    } catch (err) {
      console.error(`  ❌ Error wiping ${label}:`, err.message);
    }
  };

  // 1. Transactional & E-commerce Operations
  await wipeCollection(Sale, 'Sales');
  await wipeCollection(SaleOrder, 'Sale Orders');
  await wipeCollection(Purchase, 'Purchases');
  await wipeCollection(Quotation, 'Quotations');
  await wipeCollection(EMIInvoice, 'EMI Invoices');
  await wipeCollection(EMICollection, 'EMI Collections');
  await wipeCollection(Payment, 'Payments');
  await wipeCollection(Inventory, 'Inventories (Stock logs)');
  await wipeCollection(Transfer, 'Product Transfers');

  // 2. Inventory Items & Stock Batches
  await wipeCollection(Product, 'Products');
  await wipeCollection(StockBatch, 'Stock Batches');
  await wipeCollection(StockUnit, 'Stock Units (Serial Numbers)');

  // 3. Customers & Suppliers
  await wipeCollection(Customer, 'Customers');
  await wipeCollection(Supplier, 'Suppliers');

  // 4. Financial logs & Investors
  await wipeCollection(Income, 'Income Entries');
  await wipeCollection(Expense, 'Expense Entries');
  await wipeCollection(ProfitDistribution, 'Profit Distributions');
  await wipeCollection(Investor, 'Investors');

  // 5. Customer Engagement & Marketing
  await wipeCollection(Review, 'Reviews');
  await wipeCollection(Question, 'Q&A Questions');
  await wipeCollection(Warranty, 'Warranty Records');
  await wipeCollection(Offer, 'Offers');
  await wipeCollection(Banner, 'Banners');
  await wipeCollection(Testimonial, 'Testimonials');

  // 6. Communications & System Events
  await wipeCollection(Message, 'Messages');
  await wipeCollection(Notification, 'Notifications');

  // 7. Reset financial accounts
  console.log('\n💳 Resetting Financial Accounts balance to 0...');
  try {
    const accCount = await Account.countDocuments();
    await Account.updateMany({}, { $set: { currentBalance: 0 } });
    console.log(`  ✅ Reset current balance of ${accCount} accounts to ৳0`);
  } catch (err) {
    console.error('  ❌ Error resetting accounts:', err.message);
  }

  console.log('\n' + '═'.repeat(60));
  console.log('🎉 ALL DUMMY AND TRANSACTIONAL DATA Wiped!');
  console.log('📌 System handover cleanup complete.');
  console.log('═'.repeat(60));
};

runCleanup()
  .then(() => {
    mongoose.disconnect();
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Handover cleanup failed:', err);
    mongoose.disconnect();
    process.exit(1);
  });
