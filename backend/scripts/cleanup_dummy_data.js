/**
 * SMART PLAZA - CLEANUP DUMMY DATA SCRIPT
 * Removes all seeded/dummy data from the database
 * Keeps only essential data:
 *   ✅ Super Admin user + Demo accounts
 *   ✅ Shop configuration
 *   ✅ Permanent Roles
 * 
 * Run: node scripts/cleanup_dummy_data.js
 */

require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');

// Import all models
const User = require('../models/User');
const Role = require('../models/Role');
const Shop = require('../models/Shop');
const Category = require('../models/Category');
const Brand = require('../models/Brand');
const Unit = require('../models/Unit');
const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');
const Product = require('../models/Product');
const StockBatch = require('../models/StockBatch');
const StockUnit = require('../models/StockUnit');
const Sale = require('../models/Sale');
const Purchase = require('../models/Purchase');
const EMIInvoice = require('../models/EMIInvoice');
const Account = require('../models/Account');
const IncomeHead = require('../models/IncomeHead');
const Income = require('../models/Income');
const ExpenseHead = require('../models/ExpenseHead');
const Expense = require('../models/Expense');
const Investor = require('../models/Investor');
const Warranty = require('../models/Warranty');
const Offer = require('../models/Offer');
const Banner = require('../models/Banner');
const Testimonial = require('../models/Testimonial');
const POSMachine = require('../models/POSMachine');
const MFSProvider = require('../models/MFSProvider');

const run = async () => {
  console.log('🔌 Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ MongoDB connected!\n');

  console.log('═'.repeat(60));
  console.log('🧹  CLEANING ALL DUMMY DATA...');
  console.log('═'.repeat(60));
  console.log('');

  // ── Remove all transactional dummy data ──
  console.log('📦 Removing dummy Products, Stock Batches & Units...');
  const prodCount = await Product.countDocuments();
  const batchCount = await StockBatch.countDocuments();
  const unitCount = await StockUnit.countDocuments();
  await Product.deleteMany({});
  await StockBatch.deleteMany({});
  await StockUnit.deleteMany({});
  console.log(`  ✅ Removed ${prodCount} Products, ${batchCount} Batches, ${unitCount} Stock Units`);

  console.log('🧾 Removing dummy Sales...');
  const salesCount = await Sale.countDocuments();
  await Sale.deleteMany({});
  console.log(`  ✅ Removed ${salesCount} Sales`);

  console.log('🛒 Removing dummy Purchases...');
  const purchaseCount = await Purchase.countDocuments();
  await Purchase.deleteMany({});
  console.log(`  ✅ Removed ${purchaseCount} Purchases`);

  console.log('💳 Removing dummy EMI Invoices...');
  const emiCount = await EMIInvoice.countDocuments();
  await EMIInvoice.deleteMany({});
  console.log(`  ✅ Removed ${emiCount} EMI Invoices`);

  console.log('👤 Removing dummy Customers...');
  const custCount = await Customer.countDocuments();
  await Customer.deleteMany({});
  console.log(`  ✅ Removed ${custCount} Customers`);

  console.log('🏭 Removing dummy Suppliers...');
  const suppCount = await Supplier.countDocuments();
  await Supplier.deleteMany({});
  console.log(`  ✅ Removed ${suppCount} Suppliers`);

  console.log('🏷️  Removing dummy Brands...');
  const brandCount = await Brand.countDocuments();
  await Brand.deleteMany({});
  console.log(`  ✅ Removed ${brandCount} Brands`);

  console.log('🗂️  Removing dummy Categories...');
  const catCount = await Category.countDocuments();
  await Category.deleteMany({});
  console.log(`  ✅ Removed ${catCount} Categories`);

  console.log('📏 Removing dummy Units...');
  const unitModelCount = await Unit.countDocuments();
  await Unit.deleteMany({});
  console.log(`  ✅ Removed ${unitModelCount} Units`);

  console.log('💰 Removing dummy Accounts...');
  const accCount = await Account.countDocuments();
  await Account.deleteMany({});
  console.log(`  ✅ Removed ${accCount} Accounts`);

  console.log('📈 Removing dummy Income Heads & Entries...');
  const ihCount = await IncomeHead.countDocuments();
  const incCount = await Income.countDocuments();
  await IncomeHead.deleteMany({});
  await Income.deleteMany({});
  console.log(`  ✅ Removed ${ihCount} Income Heads, ${incCount} Income Entries`);

  console.log('📉 Removing dummy Expense Heads & Entries...');
  const ehCount = await ExpenseHead.countDocuments();
  const expCount = await Expense.countDocuments();
  await ExpenseHead.deleteMany({});
  await Expense.deleteMany({});
  console.log(`  ✅ Removed ${ehCount} Expense Heads, ${expCount} Expense Entries`);

  console.log('💼 Removing dummy Investors...');
  const invCount = await Investor.countDocuments();
  await Investor.deleteMany({});
  console.log(`  ✅ Removed ${invCount} Investors`);

  console.log('🛡️  Removing dummy Warranty Records...');
  const warCount = await Warranty.countDocuments();
  await Warranty.deleteMany({});
  console.log(`  ✅ Removed ${warCount} Warranty Records`);

  console.log('🏷️  Removing dummy Offers...');
  const offerCount = await Offer.countDocuments();
  await Offer.deleteMany({});
  console.log(`  ✅ Removed ${offerCount} Offers`);

  console.log('🖼️  Removing dummy Banners...');
  const bannerCount = await Banner.countDocuments();
  await Banner.deleteMany({});
  console.log(`  ✅ Removed ${bannerCount} Banners`);

  console.log('💬 Removing dummy Testimonials...');
  const testCount = await Testimonial.countDocuments();
  await Testimonial.deleteMany({});
  console.log(`  ✅ Removed ${testCount} Testimonials`);

  console.log('🖥️  Removing dummy POS Machines & MFS Providers...');
  const posCount = await POSMachine.countDocuments();
  const mfsCount = await MFSProvider.countDocuments();
  await POSMachine.deleteMany({});
  await MFSProvider.deleteMany({});
  console.log(`  ✅ Removed ${posCount} POS Machines, ${mfsCount} MFS Providers`);

  // ── Keep essential data ──
  console.log('\n📌 Keeping essential data:');
  
  const users = await User.find({}, 'name email role').lean();
  console.log(`  ✅ ${users.length} Users (Admin + Demo accounts):`);
  users.forEach(u => console.log(`     • ${u.role} — ${u.email}`));

  const shops = await Shop.find({}, 'name').lean();
  console.log(`  ✅ ${shops.length} Shop(s): ${shops.map(s => s.name).join(', ')}`);

  const roles = await Role.find({}, 'name').lean();
  console.log(`  ✅ ${roles.length} Permanent Roles: ${roles.map(r => r.name).join(', ')}`);

  console.log('\n' + '═'.repeat(60));
  console.log('🎉  ALL DUMMY DATA CLEANED SUCCESSFULLY!');
  console.log('    Project is ready for upload/deployment.');
  console.log('═'.repeat(60));
  console.log('\n💡 Tip: Run "node scripts/seed_full_data.js" anytime to');
  console.log('   repopulate demo data for testing.\n');
};

run()
  .then(() => { mongoose.disconnect(); process.exit(0); })
  .catch(err => { console.error('❌ Cleanup Error:', err.message || err); mongoose.disconnect(); process.exit(1); });
