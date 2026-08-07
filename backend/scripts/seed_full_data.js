/**
 * SMART PLAZA - COMPLETE ADMIN DUMMY DATA SEED SCRIPT
 * Covers ALL admin modules:
 * ✅ Units, Brands, Categories
 * ✅ Products + Stock Batches + Stock Units (Serial Numbers)
 * ✅ Customers + Suppliers
 * ✅ Sales (Retail + Wholesale)
 * ✅ Purchases
 * ✅ EMI Management
 * ✅ Accounts + Finance
 * ✅ Income Heads + Income Entries
 * ✅ Expense Heads + Expense Entries
 * ✅ Investors
 * ✅ Warranty Records
 * ✅ Offers Management
 * ✅ Banners + Testimonials (E-commerce)
 * ✅ POS Machines + MFS Providers
 */

require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');

// --- Import All Models ---
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

const connectDB = async () => {
  console.log('🔌 Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ MongoDB connected!\n');
};

const run = async () => {
  await connectDB();

  // ── STEP 0: Clean all transactional + master data ─────────────────────────
  console.log('🧹 Cleaning old data...');
  await Promise.all([
    Sale.deleteMany({}),
    Purchase.deleteMany({}),
    EMIInvoice.deleteMany({}),
    StockUnit.deleteMany({}),
    StockBatch.deleteMany({}),
    Product.deleteMany({}),
    Customer.deleteMany({}),
    Supplier.deleteMany({}),
    Account.deleteMany({}),
    IncomeHead.deleteMany({}),
    Income.deleteMany({}),
    ExpenseHead.deleteMany({}),
    Expense.deleteMany({}),
    Investor.deleteMany({}),
    Warranty.deleteMany({}),
    Offer.deleteMany({}),
    Banner.deleteMany({}),
    Testimonial.deleteMany({}),
    POSMachine.deleteMany({}),
    MFSProvider.deleteMany({}),
    Category.deleteMany({}),
    Brand.deleteMany({}),
    Unit.deleteMany({}),
  ]);
  console.log('✅ All old data cleared.\n');

  // ── STEP 1: Ensure Super Admin + Shop ─────────────────────────────────────
  let admin = await User.findOne({ role: 'Super Admin' }).select('+password');
  if (!admin) {
    admin = await User.create({
      name: 'Demo Admin',
      email: 'admin@yourskybridge.com',
      password: 'admin123',
      phone: '01700000000',
      role: 'Super Admin',
    });
    console.log('✅ Super Admin created.');
  } else {
    admin.password = 'admin123';
    await admin.save();
    console.log('✅ Super Admin password reset to admin123.');
  }

  let shop = await Shop.findOne({});
  if (!shop) {
    shop = await Shop.create({
      name: 'Demo ERP Head Office',
      owner: admin._id,
      address: 'Level 4, Multiplan Center, Elephant Road, Dhaka-1205',
      phone: '01700000000',
      email: 'info@yourskybridge.com',
      isActive: true,
    });
    console.log('✅ Shop created.');
  }
  admin.activeShop = shop._id;
  admin.shop = shop._id;
  await admin.save();

  const SID = shop._id;
  const AID = admin._id;
  console.log(`📌 Shop ID: ${SID}\n`);

  // ── STEP 2: Units ──────────────────────────────────────────────────────────
  console.log('📦 Seeding Units...');
  const units = await Unit.insertMany([
    { name: 'Piece', symbol: 'pcs', shortName: 'pcs', shop: SID },
    { name: 'Box', symbol: 'box', shortName: 'box', shop: SID },
    { name: 'Set', symbol: 'set', shortName: 'set', shop: SID },
  ]);
  const pcsUnit = units[0]._id;
  console.log(`  ✅ ${units.length} Units`);

  // ── STEP 3: Brands ─────────────────────────────────────────────────────────
  console.log('🏷️  Seeding Brands...');
  const brandsRaw = [
    { name: 'Apple', logo: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=300&q=80', country: 'USA' },
    { name: 'Samsung', logo: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=300&q=80', country: 'South Korea' },
    { name: 'Sony', logo: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=300&q=80', country: 'Japan' },
    { name: 'LG', logo: 'https://images.unsplash.com/photo-1571415060716-baff5f7179e6?w=300&q=80', country: 'South Korea' },
    { name: 'JBL', logo: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&q=80', country: 'USA' },
    { name: 'HP', logo: 'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=300&q=80', country: 'USA' },
    { name: 'Lenovo', logo: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=300&q=80', country: 'China' },
    { name: 'Singer', logo: 'https://images.unsplash.com/photo-1567690187548-f07b1d7bf5a9?w=300&q=80', country: 'Japan' },
    { name: 'Anker', logo: 'https://images.unsplash.com/photo-1609592424009-dd2790933737?w=300&q=80', country: 'China' },
    { name: 'Baseus', logo: 'https://images.unsplash.com/photo-1622445268465-8432b13d0859?w=300&q=80', country: 'China' },
  ];
  const brands = await Brand.insertMany(brandsRaw.map((b, i) => ({ ...b, shop: SID, isActive: true, displayOrder: i + 1 })));
  const bm = {}; brands.forEach(b => bm[b.name] = b._id);
  console.log(`  ✅ ${brands.length} Brands`);

  // ── STEP 4: Categories ─────────────────────────────────────────────────────
  console.log('🗂️  Seeding Categories...');
  const catsRaw = [
    { name: 'Smartphones', icon: 'Smartphone' },
    { name: 'Laptops', icon: 'Computer' },
    { name: 'Audio & Speakers', icon: 'Volume2' },
    { name: 'Smartwatches', icon: 'Watch' },
    { name: 'Accessories', icon: 'Cable' },
    { name: 'Television', icon: 'Tv' },
    { name: 'Headphones', icon: 'Headphones' },
  ];
  const cats = await Category.insertMany(catsRaw.map(c => ({ ...c, shop: SID, isActive: true })));
  const cm = {}; cats.forEach(c => cm[c.name] = c._id);
  console.log(`  ✅ ${cats.length} Categories`);

  // ── STEP 5: Accounts ───────────────────────────────────────────────────────
  console.log('💳 Seeding Accounts...');
  const accounts = await Account.insertMany([
    { name: 'Cash in Hand', type: 'Cash', openingBalance: 250000, currentBalance: 250000, shop: SID },
    { name: 'Islami Bank PLC', type: 'Bank', accountNumber: '20501234567890', bankName: 'Islami Bank PLC', branchName: 'Motijheel', openingBalance: 1500000, currentBalance: 1500000, shop: SID },
    { name: 'Dutch-Bangla Bank', type: 'Bank', accountNumber: '10810120014532', bankName: 'Dutch-Bangla Bank', branchName: 'Gulshan', openingBalance: 850000, currentBalance: 850000, shop: SID },
    { name: 'bKash Merchant', type: 'Mobile Banking', accountNumber: '01700000001', openingBalance: 180000, currentBalance: 180000, shop: SID },
    { name: 'Nagad Merchant', type: 'Mobile Banking', accountNumber: '01700000002', openingBalance: 95000, currentBalance: 95000, shop: SID },
  ]);
  const acctMap = {}; accounts.forEach(a => acctMap[a.name] = a._id);
  console.log(`  ✅ ${accounts.length} Accounts`);

  // ── STEP 6: POS Machines + MFS Providers ──────────────────────────────────
  console.log('🖥️  Seeding POS Machines & MFS Providers...');
  await POSMachine.insertMany([
    { name: 'City Bank POS Terminal 1', bankName: 'City Bank', feePercentage: 1.5, isActive: true },
    { name: 'EBL POS Machine', bankName: 'Eastern Bank PLC', feePercentage: 1.5, isActive: true },
    { name: 'DBBL POS Terminal', bankName: 'Dutch-Bangla Bank', feePercentage: 1.2, isActive: true },
  ]);
  await MFSProvider.insertMany([
    { name: 'bKash Merchant', feePerThousand: 12, isActive: true },
    { name: 'Nagad Merchant', feePerThousand: 10, isActive: true },
    { name: 'Rocket Merchant', feePerThousand: 15, isActive: true },
  ]);
  console.log('  ✅ 3 POS Machines, 3 MFS Providers');

  // ── STEP 7: Customers ──────────────────────────────────────────────────────
  console.log('👤 Seeding Customers...');
  const customers = await Customer.insertMany([
    { contactName: 'Tanvir Ahmed', contactNumber: '01711111111', email: 'tanvir@gmail.com', address: 'House 12, Road 3, Dhanmondi, Dhaka', contactType: 'Customer', customerType: 'Individual', shop: SID },
    { contactName: 'Rahim Telecom Manager', contactNumber: '01822222222', businessName: 'Rahim Telecom Ltd', email: 'rahimtelecom@gmail.com', address: 'Shop 4, Level 2, Multiplan Center, Dhaka', contactType: 'Customer', customerType: 'Business', totalDue: 50000, shop: SID },
    { contactName: 'Nusrat Jahan', contactNumber: '01933333333', email: 'nusrat@gmail.com', address: 'House 7, Road 11, Uttara Sector 4, Dhaka', contactType: 'Customer', customerType: 'Individual', shop: SID },
    { contactName: 'Jamuna Tech World Manager', contactNumber: '01644444444', businessName: 'Jamuna Tech World', email: 'jamunatech@gmail.com', address: 'Agrabad Commercial Area, Chittagong', contactType: 'Customer', customerType: 'Business', shop: SID },
    { contactName: 'Karim Brothers Owner', contactNumber: '01755555555', businessName: 'Karim Brothers Electronics', email: 'karimbrothers@gmail.com', address: 'IDB Bhaban, Agargaon, Dhaka', contactType: 'Customer', customerType: 'Business', totalDue: 120000, shop: SID },
    { contactName: 'Sharmin Akter', contactNumber: '01666666666', email: 'sharmin@gmail.com', address: 'House 3, Road 7, Mirpur-10, Dhaka', contactType: 'Customer', customerType: 'Individual', shop: SID },
    { contactName: 'Dhaka Mobile Zone Owner', contactNumber: '01777777777', businessName: 'Dhaka Mobile Zone', email: 'dhakazone@gmail.com', address: 'Nawabpur Road, Old Dhaka', contactType: 'Customer', customerType: 'Business', shop: SID },
  ]);
  console.log(`  ✅ ${customers.length} Customers`);

  // ── STEP 8: Suppliers ──────────────────────────────────────────────────────
  console.log('🏭 Seeding Suppliers...');
  const suppliers = await Supplier.insertMany([
    { name: 'Apple BD Official Importer', contactNumber: '01799999991', email: 'sales@applebdimporter.com', address: 'Banani, Dhaka', companyName: 'Apple BD Distribution Ltd', shop: SID },
    { name: 'Smart Technologies Ltd', contactNumber: '01799999992', email: 'info@smart-tech.com', address: 'IDB Bhaban, Agargaon, Dhaka', companyName: 'Smart Technologies BD', totalDue: 75000, shop: SID },
    { name: 'JBL Official BD Supplier', contactNumber: '01799999993', email: 'supply@jblbd.com', address: 'Gulshan-2, Dhaka', companyName: 'JBL Audio BD', shop: SID },
    { name: 'Samsung Bangladesh', contactNumber: '01799999994', email: 'b2b@samsung.com.bd', address: 'Samsung Tower, Karwan Bazar, Dhaka', companyName: 'Samsung Bangladesh Electronics', shop: SID },
    { name: 'HP Authorized Distributor', contactNumber: '01799999995', email: 'supply@hpbd.com', address: 'Panthapath, Dhaka', companyName: 'HP Bangladesh Distribution', shop: SID },
    { name: 'Sony-LG-Singer BD Distributor', contactNumber: '01799999996', email: 'supply@sonylgbd.com', address: 'Elephant Road, Dhaka', companyName: 'Sony LG Singer BD Electronics', shop: SID },
  ]);
  console.log(`  ✅ ${suppliers.length} Suppliers`);

  // ── STEP 9: Products + Stock Batches + Stock Units ────────────────────────
  console.log('🛍️  Seeding Products, Batches & Serial Units...');

  const productsData = [
    {
      name: 'iPhone 15 Pro Max 256GB Natural Titanium',
      brand: bm['Apple'], category: cm['Smartphones'], unit: pcsUnit,
      model: 'MU793HN/A', mrp: 158000, purchasePrice: 132000, sellingPrice: 144990,
      image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&q=80',
      images: ['https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&q=80','https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80'],
      color: 'Natural Titanium', warrantyPeriod: '1 Year Apple Official Warranty',
      landingPageSection: 'Featured Products', supplier: suppliers[0]._id,
      serials: ['IMEI-IP15PM-001','IMEI-IP15PM-002','IMEI-IP15PM-003','IMEI-IP15PM-004','IMEI-IP15PM-005'],
      qty: 5
    },
    {
      name: 'iPhone 15 128GB Blue',
      brand: bm['Apple'], category: cm['Smartphones'], unit: pcsUnit,
      model: 'MTLP3HN/A', mrp: 105000, purchasePrice: 85000, sellingPrice: 96990,
      image: 'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=800&q=80',
      images: ['https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=800&q=80'],
      color: 'Blue', warrantyPeriod: '1 Year Apple Official Warranty',
      landingPageSection: 'Best Sellers', supplier: suppliers[0]._id,
      serials: ['IMEI-IP15-001','IMEI-IP15-002','IMEI-IP15-003','IMEI-IP15-004','IMEI-IP15-005','IMEI-IP15-006','IMEI-IP15-007','IMEI-IP15-008'],
      qty: 8
    },
    {
      name: 'Samsung Galaxy S24 Ultra 5G 256GB Titanium Gray',
      brand: bm['Samsung'], category: cm['Smartphones'], unit: pcsUnit,
      model: 'SM-S928BZTGBTU', mrp: 148000, purchasePrice: 122000, sellingPrice: 135990,
      image: 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800&q=80',
      images: ['https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800&q=80','https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800&q=80'],
      color: 'Titanium Gray', warrantyPeriod: '1 Year Brand Warranty',
      landingPageSection: 'Featured Products', supplier: suppliers[3]._id,
      serials: ['IMEI-S24U-001','IMEI-S24U-002','IMEI-S24U-003','IMEI-S24U-004','IMEI-S24U-005','IMEI-S24U-006'],
      qty: 6
    },
    {
      name: 'Samsung Galaxy A55 5G 128GB Awesome Navy',
      brand: bm['Samsung'], category: cm['Smartphones'], unit: pcsUnit,
      model: 'SM-A556EZKDBTU', mrp: 45000, purchasePrice: 35000, sellingPrice: 39990,
      image: 'https://images.unsplash.com/photo-1581795669633-91ef7c9699a8?w=800&q=80',
      images: ['https://images.unsplash.com/photo-1581795669633-91ef7c9699a8?w=800&q=80'],
      color: 'Awesome Navy', warrantyPeriod: '1 Year Brand Warranty',
      landingPageSection: 'Hot Deals', supplier: suppliers[3]._id,
      serials: ['IMEI-A55-001','IMEI-A55-002','IMEI-A55-003','IMEI-A55-004','IMEI-A55-005','IMEI-A55-006','IMEI-A55-007','IMEI-A55-008','IMEI-A55-009','IMEI-A55-010'],
      qty: 10
    },
    {
      name: 'Apple MacBook Air M3 13-inch 8GB 256GB',
      brand: bm['Apple'], category: cm['Laptops'], unit: pcsUnit,
      model: 'MRXT3HN/A', mrp: 145000, purchasePrice: 118000, sellingPrice: 130990,
      image: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800&q=80',
      images: ['https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800&q=80','https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80'],
      color: 'Space Grey', warrantyPeriod: '1 Year Apple Care',
      landingPageSection: 'Featured Products', supplier: suppliers[0]._id,
      serials: ['SN-MBA-M3-001','SN-MBA-M3-002','SN-MBA-M3-003','SN-MBA-M3-004','SN-MBA-M3-005'],
      qty: 5
    },
    {
      name: 'HP Pavilion 15-eg3001TU Core i7 13th Gen',
      brand: bm['HP'], category: cm['Laptops'], unit: pcsUnit,
      model: '7P6V1PA', mrp: 98000, purchasePrice: 78000, sellingPrice: 88990,
      image: 'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=800&q=80',
      images: ['https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=800&q=80'],
      color: 'Silver', warrantyPeriod: '2 Years HP Official Warranty',
      landingPageSection: 'Hot Deals', supplier: suppliers[4]._id,
      serials: ['SN-HP-PAV-001','SN-HP-PAV-002','SN-HP-PAV-003','SN-HP-PAV-004','SN-HP-PAV-005','SN-HP-PAV-006','SN-HP-PAV-007'],
      qty: 7
    },
    {
      name: 'Lenovo ThinkPad E14 Gen 5 Core i5 13th Gen',
      brand: bm['Lenovo'], category: cm['Laptops'], unit: pcsUnit,
      model: '21JKS04T00', mrp: 75000, purchasePrice: 58000, sellingPrice: 68990,
      image: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&q=80',
      images: ['https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&q=80'],
      color: 'Black', warrantyPeriod: '1 Year Lenovo Warranty',
      landingPageSection: 'Best Sellers', supplier: suppliers[1]._id,
      serials: ['SN-TP-E14-001','SN-TP-E14-002','SN-TP-E14-003','SN-TP-E14-004','SN-TP-E14-005','SN-TP-E14-006'],
      qty: 6
    },
    {
      name: 'JBL Charge 5 Portable Waterproof Speaker',
      brand: bm['JBL'], category: cm['Audio & Speakers'], unit: pcsUnit,
      model: 'JBLCHARGE5BLK', mrp: 18000, purchasePrice: 13000, sellingPrice: 15990,
      image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&q=80',
      images: ['https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&q=80','https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80'],
      color: 'Black', warrantyPeriod: '6 Months Warranty',
      landingPageSection: 'Featured Products', supplier: suppliers[2]._id,
      serials: ['SN-JBLC5-001','SN-JBLC5-002','SN-JBLC5-003','SN-JBLC5-004','SN-JBLC5-005','SN-JBLC5-006','SN-JBLC5-007','SN-JBLC5-008','SN-JBLC5-009','SN-JBLC5-010','SN-JBLC5-011','SN-JBLC5-012','SN-JBLC5-013','SN-JBLC5-014','SN-JBLC5-015'],
      qty: 15
    },
    {
      name: 'JBL Flip 6 Waterproof Bluetooth Speaker',
      brand: bm['JBL'], category: cm['Audio & Speakers'], unit: pcsUnit,
      model: 'JBLFLIP6BLU', mrp: 14000, purchasePrice: 9500, sellingPrice: 11990,
      image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&q=80',
      images: ['https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&q=80'],
      color: 'Ocean Blue', warrantyPeriod: '6 Months Warranty',
      landingPageSection: 'Best Sellers', supplier: suppliers[2]._id,
      serials: ['SN-JBLF6-001','SN-JBLF6-002','SN-JBLF6-003','SN-JBLF6-004','SN-JBLF6-005','SN-JBLF6-006','SN-JBLF6-007','SN-JBLF6-008','SN-JBLF6-009','SN-JBLF6-010'],
      qty: 10
    },
    {
      name: 'Apple Watch Series 9 GPS 45mm Midnight Aluminum',
      brand: bm['Apple'], category: cm['Smartwatches'], unit: pcsUnit,
      model: 'MR993HN/A', mrp: 55000, purchasePrice: 42000, sellingPrice: 47990,
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
      images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80','https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&q=80'],
      color: 'Midnight Aluminum', warrantyPeriod: '1 Year Apple Warranty',
      landingPageSection: 'Best Sellers', supplier: suppliers[0]._id,
      serials: ['SN-AW9-001','SN-AW9-002','SN-AW9-003','SN-AW9-004','SN-AW9-005','SN-AW9-006','SN-AW9-007','SN-AW9-008'],
      qty: 8
    },
    {
      name: 'Anker PowerCore 20000mAh 22.5W Power Bank',
      brand: bm['Anker'], category: cm['Accessories'], unit: pcsUnit,
      model: 'A1268H11', mrp: 5000, purchasePrice: 2800, sellingPrice: 3499,
      image: 'https://images.unsplash.com/photo-1609592424009-dd2790933737?w=800&q=80',
      images: ['https://images.unsplash.com/photo-1609592424009-dd2790933737?w=800&q=80'],
      color: 'Black', warrantyPeriod: '18 Months Anker Warranty',
      landingPageSection: 'Hot Deals', supplier: suppliers[1]._id,
      serials: ['SN-ANKER-001','SN-ANKER-002','SN-ANKER-003','SN-ANKER-004','SN-ANKER-005','SN-ANKER-006','SN-ANKER-007','SN-ANKER-008','SN-ANKER-009','SN-ANKER-010','SN-ANKER-011','SN-ANKER-012','SN-ANKER-013','SN-ANKER-014','SN-ANKER-015','SN-ANKER-016','SN-ANKER-017','SN-ANKER-018','SN-ANKER-019','SN-ANKER-020'],
      qty: 20
    },
    {
      name: 'JBL Tune 720BT Over-Ear Bluetooth Headphones',
      brand: bm['JBL'], category: cm['Headphones'], unit: pcsUnit,
      model: 'JBLT720BTBLU', mrp: 8500, purchasePrice: 5500, sellingPrice: 6990,
      image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=80',
      images: ['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=80'],
      color: 'Blue', warrantyPeriod: '6 Months Warranty',
      landingPageSection: 'Featured Products', supplier: suppliers[2]._id,
      serials: ['SN-JT720-001','SN-JT720-002','SN-JT720-003','SN-JT720-004','SN-JT720-005','SN-JT720-006','SN-JT720-007','SN-JT720-008','SN-JT720-009','SN-JT720-010'],
      qty: 10
    },
    // ── Television Products ──
    {
      name: 'Samsung 55" Crystal UHD 4K Smart TV (2024)',
      brand: bm['Samsung'], category: cm['Television'], unit: pcsUnit,
      model: 'UA55CU7000KXXD', mrp: 72000, purchasePrice: 55000, sellingPrice: 64990,
      image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&q=80',
      images: ['https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&q=80','https://images.unsplash.com/photo-1461151304267-38535e780c79?w=800&q=80'],
      color: 'Black', warrantyPeriod: '2 Years Samsung Official Warranty',
      landingPageSection: 'Featured Products', supplier: suppliers[3]._id,
      serials: ['SN-SAMTV55-001','SN-SAMTV55-002','SN-SAMTV55-003','SN-SAMTV55-004','SN-SAMTV55-005'],
      qty: 5
    },
    {
      name: 'Sony Bravia 43" X80L 4K HDR Google TV',
      brand: bm['Sony'], category: cm['Television'], unit: pcsUnit,
      model: 'KD-43X80L', mrp: 58000, purchasePrice: 44000, sellingPrice: 52990,
      image: 'https://images.unsplash.com/photo-1567690187548-f07b1d7bf5a9?w=800&q=80',
      images: ['https://images.unsplash.com/photo-1567690187548-f07b1d7bf5a9?w=800&q=80','https://images.unsplash.com/photo-1593784991095-a205069470b6?w=800&q=80'],
      color: 'Black', warrantyPeriod: '2 Years Sony Official Warranty',
      landingPageSection: 'Best Sellers', supplier: suppliers[5]._id,
      serials: ['SN-SONYTV43-001','SN-SONYTV43-002','SN-SONYTV43-003','SN-SONYTV43-004'],
      qty: 4
    },
    {
      name: 'LG 50" UQ8050 4K UHD Smart TV webOS',
      brand: bm['LG'], category: cm['Television'], unit: pcsUnit,
      model: '50UQ8050PSB', mrp: 62000, purchasePrice: 47000, sellingPrice: 55990,
      image: 'https://images.unsplash.com/photo-1571415060716-baff5f7179e6?w=800&q=80',
      images: ['https://images.unsplash.com/photo-1571415060716-baff5f7179e6?w=800&q=80','https://images.unsplash.com/photo-1461151304267-38535e780c79?w=800&q=80'],
      color: 'Black', warrantyPeriod: '2 Years LG Official Warranty',
      landingPageSection: 'Hot Deals', supplier: suppliers[5]._id,
      serials: ['SN-LGTV50-001','SN-LGTV50-002','SN-LGTV50-003','SN-LGTV50-004','SN-LGTV50-005','SN-LGTV50-006'],
      qty: 6
    },
    {
      name: 'Samsung 32" HD Smart TV T4501 Series',
      brand: bm['Samsung'], category: cm['Television'], unit: pcsUnit,
      model: 'UA32T4501AKXXD', mrp: 28000, purchasePrice: 20000, sellingPrice: 24990,
      image: 'https://images.unsplash.com/photo-1461151304267-38535e780c79?w=800&q=80',
      images: ['https://images.unsplash.com/photo-1461151304267-38535e780c79?w=800&q=80'],
      color: 'Black', warrantyPeriod: '2 Years Samsung Warranty',
      landingPageSection: 'Best Sellers', supplier: suppliers[3]._id,
      serials: ['SN-SAMTV32-001','SN-SAMTV32-002','SN-SAMTV32-003','SN-SAMTV32-004','SN-SAMTV32-005','SN-SAMTV32-006','SN-SAMTV32-007','SN-SAMTV32-008'],
      qty: 8
    },
    {
      name: 'Singer 43" Full HD Android Smart LED TV',
      brand: bm['Singer'], category: cm['Television'], unit: pcsUnit,
      model: 'S43-SMARTLED', mrp: 35000, purchasePrice: 25000, sellingPrice: 30990,
      image: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=800&q=80',
      images: ['https://images.unsplash.com/photo-1593784991095-a205069470b6?w=800&q=80'],
      color: 'Black', warrantyPeriod: '2 Years Singer Warranty',
      landingPageSection: 'Hot Deals', supplier: suppliers[5]._id,
      serials: ['SN-SINGTV43-001','SN-SINGTV43-002','SN-SINGTV43-003','SN-SINGTV43-004','SN-SINGTV43-005','SN-SINGTV43-006','SN-SINGTV43-007'],
      qty: 7
    },
  ];

  const createdProducts = [];
  const createdBatches = [];

  for (let i = 0; i < productsData.length; i++) {
    const pd = productsData[i];
    const product = await Product.create({
      name: pd.name, shop: SID, brand: pd.brand, category: pd.category, unit: pd.unit,
      model: pd.model, mrp: pd.mrp, purchasePrice: pd.purchasePrice, sellingPrice: pd.sellingPrice,
      image: pd.image, images: pd.images, color: pd.color, warrantyPeriod: pd.warrantyPeriod,
      landingPageSection: pd.landingPageSection, isListedOnEcommerce: true, isPreorder: true,
      isRetailProduct: true, trackSerials: true, ecommerceOrder: i + 1,
    });
    createdProducts.push(product);

    const batchNum = `BATCH-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${String(i+1).padStart(3,'0')}`;
    const batch = await StockBatch.create({
      batchNumber: batchNum, product: product._id, supplier: pd.supplier,
      isOpeningStock: true, purchaseDate: new Date(Date.now() - (i * 2 * 24*60*60*1000)),
      purchasePrice: pd.purchasePrice, sellingPrice: pd.sellingPrice,
      quantity: pd.qty, remainingQty: pd.qty, isActive: true, isListedOnEcommerce: true, shop: SID,
    });
    createdBatches.push(batch);

    // Create StockUnits for serial-tracked products
    const stockUnits = pd.serials.map(serial => ({
      batch: batch._id, product: product._id, serialNumber: serial,
      status: 'available', shop: SID,
    }));
    await StockUnit.insertMany(stockUnits);
  }
  console.log(`  ✅ ${createdProducts.length} Products + Batches + Serial Units`);

  // ── STEP 10: Income & Expense Heads ───────────────────────────────────────
  console.log('💰 Seeding Income & Expense Heads...');
  const incomeHeads = await IncomeHead.insertMany([
    { name: 'Product Sales Revenue', description: 'Revenue from product sales', shop: SID },
    { name: 'Service Income', description: 'Income from repair and service', shop: SID },
    { name: 'Commission Income', description: 'Sales representative commission', shop: SID },
    { name: 'Interest Income', description: 'Bank interest received', shop: SID },
  ]);
  const ihm = {}; incomeHeads.forEach(h => ihm[h.name] = h._id);

  const expenseHeads = await ExpenseHead.insertMany([
    { name: 'Office Rent', description: 'Monthly shop/office rent', shop: SID },
    { name: 'Salaries & Wages', description: 'Employee salaries', shop: SID },
    { name: 'Electricity & Utilities', description: 'Power and utility bills', shop: SID },
    { name: 'Marketing & Advertising', description: 'Promotions, ads, campaigns', shop: SID },
    { name: 'Transport & Logistics', description: 'Delivery and transport costs', shop: SID },
    { name: 'Miscellaneous', description: 'Other operational expenses', shop: SID },
  ]);
  const ehm = {}; expenseHeads.forEach(h => ehm[h.name] = h._id);
  console.log(`  ✅ ${incomeHeads.length} Income Heads, ${expenseHeads.length} Expense Heads`);

  // ── STEP 11: Sales (Retail + Wholesale) ───────────────────────────────────
  console.log('🧾 Seeding Sales (Retail + Wholesale)...');

  // Wholesale Sale 1 – Rahim Telecom buys phones + speakers
  const ws1 = await Sale.create({
    shop: SID, type: 'wholesale', invoiceType: 'Cash',
    invoiceNumber: 'INV-WS-2026-001', customer: customers[1]._id,
    date: new Date(Date.now() - 5 * 24*60*60*1000),
    items: [
      { product: createdProducts[0]._id, quantity: 2, unitPrice: 144990, discount: 1500, productName: createdProducts[0].name, model: createdProducts[0].model, batchesUsed: [{ batch: createdBatches[0]._id, quantity: 2, purchasePrice: 132000 }] },
      { product: createdProducts[7]._id, quantity: 5, unitPrice: 15990, discount: 500, productName: createdProducts[7].name, model: createdProducts[7].model, batchesUsed: [{ batch: createdBatches[7]._id, quantity: 5, purchasePrice: 13000 }] },
    ],
    subTotal: (2 * 144990) + (5 * 15990),
    total: 365930, paidAmount: 315930, dueAmount: 50000,
    status: 'Partial', paymentMethod: 'Bank',
    payments: [{ method: 'Bank', amount: 315930, bankName: 'Islami Bank PLC', transactionId: 'TRX-WS-001' }]
  });

  // Wholesale Sale 2 – Karim Brothers buys laptops
  const ws2 = await Sale.create({
    shop: SID, type: 'wholesale', invoiceType: 'Cash',
    invoiceNumber: 'INV-WS-2026-002', customer: customers[4]._id,
    date: new Date(Date.now() - 3 * 24*60*60*1000),
    items: [
      { product: createdProducts[5]._id, quantity: 3, unitPrice: 88990, discount: 2000, productName: createdProducts[5].name, model: createdProducts[5].model, batchesUsed: [{ batch: createdBatches[5]._id, quantity: 3, purchasePrice: 78000 }] },
      { product: createdProducts[6]._id, quantity: 2, unitPrice: 68990, discount: 1000, productName: createdProducts[6].name, model: createdProducts[6].model, batchesUsed: [{ batch: createdBatches[6]._id, quantity: 2, purchasePrice: 58000 }] },
    ],
    subTotal: (3 * 88990) + (2 * 68990),
    total: 399950, paidAmount: 399950, dueAmount: 0,
    status: 'Completed', paymentMethod: 'Bank',
    payments: [{ method: 'Bank', amount: 399950, bankName: 'Dutch-Bangla Bank', transactionId: 'TRX-WS-002' }]
  });

  // Retail Sale 1 – Tanvir Ahmed buys MacBook + Watch
  const rs1 = await Sale.create({
    shop: SID, type: 'retail', invoiceType: 'Cash',
    invoiceNumber: 'INV-RT-2026-001', customer: customers[0]._id,
    date: new Date(Date.now() - 2 * 24*60*60*1000),
    items: [
      { product: createdProducts[4]._id, quantity: 1, unitPrice: 130990, discount: 990, productName: createdProducts[4].name, model: createdProducts[4].model, serialNumber: 'SN-MBA-M3-001', batchesUsed: [{ batch: createdBatches[4]._id, quantity: 1, purchasePrice: 118000 }] },
      { product: createdProducts[9]._id, quantity: 1, unitPrice: 47990, discount: 500, productName: createdProducts[9].name, model: createdProducts[9].model, serialNumber: 'SN-AW9-001', batchesUsed: [{ batch: createdBatches[9]._id, quantity: 1, purchasePrice: 42000 }] },
    ],
    subTotal: 130000 + 47490,
    total: 176490, paidAmount: 176490, dueAmount: 0,
    status: 'Completed', paymentMethod: 'MFS',
    payments: [{ method: 'MFS', amount: 176490, mfsProviderName: 'bKash Merchant', transactionId: 'BK-RT-001' }]
  });

  // Retail Sale 2 – Nusrat Jahan buys Samsung phone
  const rs2 = await Sale.create({
    shop: SID, type: 'retail', invoiceType: 'Cash',
    invoiceNumber: 'INV-RT-2026-002', customer: customers[2]._id,
    date: new Date(Date.now() - 1 * 24*60*60*1000),
    items: [
      { product: createdProducts[2]._id, quantity: 1, unitPrice: 135990, discount: 0, productName: createdProducts[2].name, model: createdProducts[2].model, serialNumber: 'IMEI-S24U-001', batchesUsed: [{ batch: createdBatches[2]._id, quantity: 1, purchasePrice: 122000 }] },
    ],
    subTotal: 135990, total: 135990, paidAmount: 135990, dueAmount: 0,
    status: 'Completed', paymentMethod: 'Cash',
    payments: [{ method: 'Cash', amount: 135990 }]
  });

  // Mark sold StockUnits
  await StockUnit.updateOne({ batch: createdBatches[0]._id, serialNumber: 'IMEI-IP15PM-001' }, { status: 'sold', saleRef: ws1._id, saleDate: ws1.date });
  await StockUnit.updateOne({ batch: createdBatches[0]._id, serialNumber: 'IMEI-IP15PM-002' }, { status: 'sold', saleRef: ws1._id, saleDate: ws1.date });
  await StockUnit.updateOne({ batch: createdBatches[4]._id, serialNumber: 'SN-MBA-M3-001' }, { status: 'sold', saleRef: rs1._id, saleDate: rs1.date });
  await StockUnit.updateOne({ batch: createdBatches[9]._id, serialNumber: 'SN-AW9-001' }, { status: 'sold', saleRef: rs1._id, saleDate: rs1.date });
  await StockUnit.updateOne({ batch: createdBatches[2]._id, serialNumber: 'IMEI-S24U-001' }, { status: 'sold', saleRef: rs2._id, saleDate: rs2.date });

  // Update batch remainingQty
  await StockBatch.findByIdAndUpdate(createdBatches[0]._id, { $inc: { remainingQty: -2 } });
  await StockBatch.findByIdAndUpdate(createdBatches[2]._id, { $inc: { remainingQty: -1 } });
  await StockBatch.findByIdAndUpdate(createdBatches[4]._id, { $inc: { remainingQty: -1 } });
  await StockBatch.findByIdAndUpdate(createdBatches[7]._id, { $inc: { remainingQty: -5 } });
  await StockBatch.findByIdAndUpdate(createdBatches[9]._id, { $inc: { remainingQty: -1 } });

  console.log('  ✅ 4 Sales Invoices (2 Wholesale, 2 Retail)');

  // ── STEP 12: Purchases ────────────────────────────────────────────────────
  console.log('🛒 Seeding Purchases...');
  await Purchase.insertMany([
    {
      shop: SID, purchaseNumber: 'PO-2026-001', challanNumber: 'CH-20260115',
      supplier: suppliers[0]._id, date: new Date(Date.now() - 20 * 24*60*60*1000),
      items: [
        { product: createdProducts[0]._id, quantity: 5, unitPrice: 132000, sellingPrice: 144990 },
        { product: createdProducts[4]._id, quantity: 5, unitPrice: 118000, sellingPrice: 130990 },
      ],
      subTotal: 5*132000 + 5*118000,
      total: 5*132000 + 5*118000, paidAmount: 5*132000 + 5*118000, dueAmount: 0,
      paymentMethod: 'Bank', status: 'Completed', note: 'Apple Q1 2026 stock purchase',
    },
    {
      shop: SID, purchaseNumber: 'PO-2026-002', challanNumber: 'CH-20260201',
      supplier: suppliers[3]._id, date: new Date(Date.now() - 15 * 24*60*60*1000),
      items: [
        { product: createdProducts[2]._id, quantity: 6, unitPrice: 122000, sellingPrice: 135990 },
        { product: createdProducts[3]._id, quantity: 10, unitPrice: 35000, sellingPrice: 39990 },
      ],
      subTotal: 6*122000 + 10*35000,
      total: 6*122000 + 10*35000, paidAmount: 6*122000 + 10*35000 - 75000, dueAmount: 75000,
      paymentMethod: 'Bank', status: 'Completed', note: 'Samsung Bangladesh Q1 stock',
    },
    {
      shop: SID, purchaseNumber: 'PO-2026-003', challanNumber: 'CH-20260210',
      supplier: suppliers[2]._id, date: new Date(Date.now() - 10 * 24*60*60*1000),
      items: [
        { product: createdProducts[7]._id, quantity: 15, unitPrice: 13000, sellingPrice: 15990 },
        { product: createdProducts[8]._id, quantity: 10, unitPrice: 9500, sellingPrice: 11990 },
      ],
      subTotal: 15*13000 + 10*9500,
      total: 15*13000 + 10*9500, paidAmount: 15*13000 + 10*9500, dueAmount: 0,
      paymentMethod: 'Cash', status: 'Completed', note: 'JBL Audio products restock',
    },
  ]);
  console.log('  ✅ 3 Purchase Orders');

  // ── STEP 13: Income Entries ───────────────────────────────────────────────
  console.log('📈 Seeding Income Entries...');
  await Income.insertMany([
    { shop: SID, incomeHead: ihm['Product Sales Revenue'], name: 'January Sales Revenue', date: new Date('2026-01-31'), amount: 850000, paymentMethod: 'Bank', accountId: acctMap['Islami Bank PLC'], description: 'Total January wholesale+retail revenue' },
    { shop: SID, incomeHead: ihm['Product Sales Revenue'], name: 'February Sales Revenue', date: new Date('2026-02-28'), amount: 1200000, paymentMethod: 'Bank', accountId: acctMap['Islami Bank PLC'], description: 'Total February revenue' },
    { shop: SID, incomeHead: ihm['Service Income'], name: 'iPhone Screen Repair Service', date: new Date(Date.now() - 7*24*60*60*1000), amount: 15000, paymentMethod: 'Cash', accountId: acctMap['Cash in Hand'], description: 'Mobile repair service revenue' },
    { shop: SID, incomeHead: ihm['Service Income'], name: 'Laptop Service & Maintenance', date: new Date(Date.now() - 3*24*60*60*1000), amount: 25000, paymentMethod: 'Cash', accountId: acctMap['Cash in Hand'], description: 'Laptop repair and service income' },
    { shop: SID, incomeHead: ihm['Interest Income'], name: 'Bank Interest – January', date: new Date('2026-01-31'), amount: 8500, paymentMethod: 'Bank', accountId: acctMap['Islami Bank PLC'], description: 'Monthly bank savings interest' },
  ]);
  console.log('  ✅ 5 Income Entries');

  // ── STEP 14: Expense Entries ──────────────────────────────────────────────
  console.log('📉 Seeding Expense Entries...');
  await Expense.insertMany([
    { shop: SID, expenseHead: ehm['Office Rent'], name: 'January Office Rent - Multiplan Center', date: new Date('2026-01-05'), amount: 120000, paymentMethod: 'Bank', accountId: acctMap['Islami Bank PLC'], description: 'Level 4, Multiplan Center monthly rent' },
    { shop: SID, expenseHead: ehm['Office Rent'], name: 'February Office Rent', date: new Date('2026-02-05'), amount: 120000, paymentMethod: 'Bank', accountId: acctMap['Islami Bank PLC'], description: 'Monthly rent payment' },
    { shop: SID, expenseHead: ehm['Salaries & Wages'], name: 'January Staff Salaries', date: new Date('2026-01-31'), amount: 285000, paymentMethod: 'Bank', accountId: acctMap['Islami Bank PLC'], description: 'Full staff salary for January' },
    { shop: SID, expenseHead: ehm['Salaries & Wages'], name: 'February Staff Salaries', date: new Date('2026-02-28'), amount: 285000, paymentMethod: 'Bank', accountId: acctMap['Islami Bank PLC'], description: 'Full staff salary for February' },
    { shop: SID, expenseHead: ehm['Electricity & Utilities'], name: 'January Electricity Bill', date: new Date('2026-01-20'), amount: 22000, paymentMethod: 'Cash', accountId: acctMap['Cash in Hand'], description: 'Shop electricity and internet bill' },
    { shop: SID, expenseHead: ehm['Marketing & Advertising'], name: 'Facebook Ads – January Campaign', date: new Date('2026-01-15'), amount: 35000, paymentMethod: 'Mobile Banking', accountId: acctMap['bKash Merchant'], description: 'Social media advertising budget' },
    { shop: SID, expenseHead: ehm['Transport & Logistics'], name: 'Product Delivery Charges', date: new Date(Date.now() - 5*24*60*60*1000), amount: 12000, paymentMethod: 'Cash', accountId: acctMap['Cash in Hand'], description: 'Customer delivery charges for February' },
    { shop: SID, expenseHead: ehm['Miscellaneous'], name: 'Office Supplies & Stationery', date: new Date(Date.now() - 10*24*60*60*1000), amount: 8500, paymentMethod: 'Cash', accountId: acctMap['Cash in Hand'], description: 'Office stationery, packaging materials' },
  ]);
  console.log('  ✅ 8 Expense Entries');

  // ── STEP 15: Investors ────────────────────────────────────────────────────
  console.log('💼 Seeding Investors...');
  await Investor.insertMany([
    {
      name: 'Demo Admin', email: 'investor1@yourskybridge.com', phone: '01700000010',
      imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
      nid: '1234567890123', investmentAmount: 5000000, profitSharePercentage: 40,
      totalProfitEarned: 450000, totalWithdrawn: 200000,
      investedDate: new Date('2024-01-15'), status: 'Active',
      address: { street: 'House 25, Road 12', city: 'Dhaka', district: 'Dhaka', zipCode: '1205' },
      bankAccount: { accountNumber: '20501234567', bankName: 'Islami Bank PLC', branchName: 'Motijheel' },
      nomineeName: 'Fatema Begum', nomineeRelation: 'Spouse', nomineePhone: '01700000020',
      notes: 'Founding investor and CEO of Demo Electronics ERP',
    },
    {
      name: 'Kamal Hossain', email: 'kamal@gmail.com', phone: '01800001111',
      imageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80',
      nid: '9876543210123', investmentAmount: 2500000, profitSharePercentage: 20,
      totalProfitEarned: 225000, totalWithdrawn: 100000,
      investedDate: new Date('2024-03-20'), status: 'Active',
      address: { street: 'House 8, Road 5', city: 'Dhaka', district: 'Dhaka', zipCode: '1000' },
      bankAccount: { accountNumber: '10810120014', bankName: 'Dutch-Bangla Bank', branchName: 'Gulshan' },
      nomineeName: 'Rina Hossain', nomineeRelation: 'Spouse', nomineePhone: '01800002222',
      notes: 'Silent investor, 20% profit share agreement',
    },
    {
      name: 'Farida Begum', email: 'farida@gmail.com', phone: '01900003333',
      imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80',
      nid: '1122334455667', investmentAmount: 1500000, profitSharePercentage: 12,
      totalProfitEarned: 135000, totalWithdrawn: 50000,
      investedDate: new Date('2024-06-01'), status: 'Active',
      address: { street: 'Apt 12, Block B', city: 'Chittagong', district: 'Chittagong', zipCode: '4000' },
      bankAccount: { accountNumber: '12345670008', bankName: 'Islami Bank PLC', branchName: 'Agrabad' },
      nomineeName: 'Rahim Begum', nomineeRelation: 'Daughter', nomineePhone: '01900004444',
      notes: 'Long-term passive investor',
    },
  ]);
  console.log('  ✅ 3 Investors');

  // ── STEP 16: Warranty Records ─────────────────────────────────────────────
  console.log('🛡️  Seeding Warranty Records...');
  const rs1Date = rs1.date || new Date(Date.now() - 2 * 24*60*60*1000);
  const rs2Date = rs2.date || new Date(Date.now() - 1 * 24*60*60*1000);
  await Warranty.insertMany([
    {
      shop: SID, product: createdProducts[4]._id, customer: customers[0]._id, sale: rs1._id,
      startDate: rs1Date, endDate: new Date(new Date(rs1Date).setFullYear(new Date(rs1Date).getFullYear() + 1)),
      status: 'Active', serialNumber: 'SN-MBA-M3-001', warrantyName: 'Apple MacBook Warranty',
      description: '1 Year Apple Official Warranty - MacBook Air M3',
    },
    {
      shop: SID, product: createdProducts[9]._id, customer: customers[0]._id, sale: rs1._id,
      startDate: rs1Date, endDate: new Date(new Date(rs1Date).setFullYear(new Date(rs1Date).getFullYear() + 1)),
      status: 'Active', serialNumber: 'SN-AW9-001', warrantyName: 'Apple Watch Warranty',
      description: '1 Year Apple Official Warranty - Apple Watch Series 9',
    },
    {
      shop: SID, product: createdProducts[2]._id, customer: customers[2]._id, sale: rs2._id,
      startDate: rs2Date, endDate: new Date(new Date(rs2Date).setFullYear(new Date(rs2Date).getFullYear() + 1)),
      status: 'Active', serialNumber: 'IMEI-S24U-001', warrantyName: 'Samsung Galaxy Warranty',
      description: '1 Year Brand Warranty - Samsung Galaxy S24 Ultra',
    },
  ]);
  console.log('  ✅ 3 Warranty Records');

  // ── STEP 17: EMI Invoice ──────────────────────────────────────────────────
  console.log('💳 Seeding EMI Invoice...');
  const emiStartDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const emiInstalments = [];
  for (let m = 1; m <= 12; m++) {
    const dueDate = new Date(emiStartDate);
    dueDate.setMonth(dueDate.getMonth() + m);
    emiInstalments.push({
      instalmentNumber: m,
      dueDate,
      amount: 13250,
      paidAmount: m <= 2 ? 13250 : 0,
      status: m <= 2 ? 'paid' : m === 3 ? 'overdue' : 'pending',
      paidDate: m <= 2 ? new Date(dueDate.getTime() - 2 * 24*60*60*1000) : undefined,
      paymentMethod: m <= 2 ? 'cash' : undefined,
    });
  }
  await EMIInvoice.create({
    customer: customers[5]._id, customerName: 'Sharmin Akter',
    customerPhone: '01666666666', customerAddress: 'House 3, Road 7, Mirpur-10, Dhaka',
    showroom: 'Demo ERP Head Office', invoiceNumber: 'EMI-2026-001',
    invoiceDate: emiStartDate,
    products: [{ product: createdProducts[0]._id, name: createdProducts[0].name, quantity: 1, unitPrice: 144990, total: 144990 }],
    subtotal: 144990, totalAmount: 159000,
    emiPlan: {
      planType: '12months', duration: 12, interestRate: 10,
      interestAmount: 14910, totalPayableAmount: 159000, monthlyInstalment: 13250,
    },
    downPayment: { amount: 0, method: 'cash' },
    outstandingBalance: 159000 - (2 * 13250),
    paidAmount: 2 * 13250,
    status: 'active', isActive: true,
    instalments: emiInstalments,
    createdBy: AID,
    notes: 'iPhone 15 Pro Max EMI Plan – 12 months 10% interest',
  });
  console.log('  ✅ 1 EMI Invoice (12-month plan)');

  // ── STEP 18: Offers ───────────────────────────────────────────────────────
  console.log('🏷️  Seeding Offers...');
  await Offer.insertMany([
    {
      type: 'campaign', title: '10% Off on JBL Speakers', subtitle: 'Limited Time Deal',
      description: 'Get 10% discount on all JBL Bluetooth speakers this month',
      image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&q=80',
      code: 'JBL10', color: '#14B8A6', tag: 'HOT DEAL',
      isActive: true, product: createdProducts[7]._id,
      discountType: 'percentage', discountPercentage: 10,
    },
    {
      type: 'campaign', title: '৳5000 Off MacBook Air M3', subtitle: 'MacBook Season Sale',
      description: 'Flat ৳5000 discount on Apple MacBook Air M3 purchase',
      image: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800&q=80',
      code: 'MBA5000', color: '#3B82F6', tag: 'EXCLUSIVE',
      isActive: true, product: createdProducts[4]._id,
      discountType: 'flat', discountAmount: 5000,
    },
    {
      type: 'bank', title: 'City Bank Credit Card 5% Cashback', subtitle: 'Bank Offer',
      description: '5% cashback on City Bank credit card purchases above ৳50,000',
      color: '#F59E0B', tag: 'BANK OFFER', isActive: true,
      discountType: 'percentage', discountPercentage: 5,
    },
  ]);
  console.log('  ✅ 3 Offers');

  // ── STEP 19: Banners ──────────────────────────────────────────────────────
  console.log('🖼️  Seeding Banners...');
  await Banner.insertMany([
    { title: 'Next Gen Tech – Unbeatable Prices', image: 'https://images.unsplash.com/photo-1498049860654-af1a5c566876?w=1600&q=80', link: '/shop/products', position: 'main', isActive: true, displayOrder: 1 },
    { title: 'Premium Gadgets & Smart Accessories', image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1600&q=80', link: '/shop/products', position: 'main', isActive: true, displayOrder: 2 },
    { title: 'Apple Ecosystem – MacBook, iPhone, Watch', image: 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=1600&q=80', link: '/shop/products', position: 'main', isActive: true, displayOrder: 3 },
    { title: 'JBL Wireless Audio Sale', image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&q=80', link: '/shop/products', position: 'side_top', isActive: true, displayOrder: 1 },
    { title: 'Smart Wearables Collection', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80', link: '/shop/products', position: 'side_bottom', isActive: true, displayOrder: 1 },
  ]);
  console.log('  ✅ 5 Banners (3 Main, 2 Side)');

  // ── STEP 20: Testimonials ─────────────────────────────────────────────────
  console.log('💬 Seeding Testimonials...');
  await Testimonial.insertMany([
    { name: 'Tanvir Ahmed', email: 'tanvir@gmail.com', rating: 5, message: 'Bought a MacBook Air M3 and Apple Watch Series 9 from Demo ERP. Genuine products, amazing service, and super fast delivery. Highly recommend!', imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80', designation: 'Software Engineer', company: 'Dhaka Tech Solutions', location: 'Dhaka', product: 'MacBook Air M3', verified: true, recommend: true, status: 'approved' },
    { name: 'Nusrat Jahan', email: 'nusrat2@gmail.com', rating: 5, message: 'Ordered Samsung Galaxy S24 Ultra online. Delivered next day with authentic box and all accessories. Best gadget shop in Dhaka!', imageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&q=80', designation: 'UI/UX Designer', company: 'Creative Studio BD', location: 'Chittagong', product: 'Samsung Galaxy S24 Ultra', verified: true, recommend: true, status: 'approved' },
    { name: 'Rahim Chowdhury', email: 'rahimtelecom2@gmail.com', rating: 5, message: 'I buy electronics in bulk from Demo ERP for my shop. Always get original products with proper warranty. Trusted supplier for 2+ years!', imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80', designation: 'Electronics Retailer', company: 'Rahim Telecom Ltd', location: 'Dhaka', product: 'Wholesale Electronics', verified: true, recommend: true, status: 'approved' },
    { name: 'Sharmin Akter', email: 'sharmin2@gmail.com', rating: 4, message: 'Bought iPhone 15 Pro Max on EMI. Very smooth process and the staff explained everything clearly. Monthly installment is very affordable.', imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80', designation: 'School Teacher', company: 'Dhaka Govt. School', location: 'Dhaka', product: 'iPhone 15 Pro Max', verified: true, recommend: true, status: 'approved' },
  ]);
  console.log('  ✅ 4 Testimonials');

  // ── STEP 21: Seeding Demo Accounts ─────────────────────────────────────────
  console.log('👥 Seeding/ensuring demo accounts...');
  try {
    const { ensureDemoAccounts } = require('../controllers/authController');
    await ensureDemoAccounts();
    console.log('  ✅ All Demo Accounts Synced Successfully');
  } catch (demoErr) {
    console.error('  ⚠️ Error seeding demo accounts:', demoErr.message);
  }

  console.log('\n' + '═'.repeat(60));
  console.log('🎉  ALL ADMIN DUMMY DATA SEEDED SUCCESSFULLY!');
  console.log('═'.repeat(60));
  console.log('\n📋 Summary:');
  console.log('  ✅ 3 Units | 7 Brands | 7 Categories');
  console.log('  ✅ 5 Accounts | 3 POS Machines | 3 MFS Providers');
  console.log('  ✅ 7 Customers | 5 Suppliers');
  console.log(`  ✅ ${productsData.length} Products + Stock Batches + Serial Units`);
  console.log('  ✅ 3 Purchases | 4 Sales (2 Wholesale + 2 Retail)');
  console.log('  ✅ 1 EMI Invoice (12-month plan, 3 instalment due)');
  console.log('  ✅ 4 Income Heads + 5 Incomes | 6 Expense Heads + 8 Expenses');
  console.log('  ✅ 3 Investors | 3 Warranty Records | 3 Offers');
  console.log('  ✅ 5 Banners | 4 Testimonials');
  console.log('\n🔑 Admin Login:');
  console.log('   Email   : admin@yourskybridge.com');
  console.log('   Password: admin123');
  console.log('   URL     : http://localhost:5173/admin/login\n');
};

run()
  .then(() => { mongoose.disconnect(); process.exit(0); })
  .catch(err => { console.error('❌ Seed Error:', err.message || err); console.error(err); mongoose.disconnect(); process.exit(1); });
