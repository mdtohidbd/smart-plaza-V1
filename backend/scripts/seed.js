require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');

// Import ALL models to ensure full cleanup
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');
const Sale = require('../models/Sale');
const SaleOrder = require('../models/SaleOrder');
const Purchase = require('../models/Purchase');
const StockBatch = require('../models/StockBatch');
const StockUnit = require('../models/StockUnit');
const Inventory = require('../models/Inventory');
const Transfer = require('../models/Transfer');
const Quotation = require('../models/Quotation');
const EMIInvoice = require('../models/EMIInvoice');
const EMICollection = require('../models/EMICollection');
const Brand = require('../models/Brand');
const Category = require('../models/Category');
const Unit = require('../models/Unit');
const User = require('../models/User');
const POSMachine = require('../models/POSMachine');
const MFSProvider = require('../models/MFSProvider');
const Account = require('../models/Account');
const Income = require('../models/Income');
const Expense = require('../models/Expense');
const Investor = require('../models/Investor');
const ProfitDistribution = require('../models/ProfitDistribution');
const Payment = require('../models/Payment');
const Warranty = require('../models/Warranty');
const Notification = require('../models/Notification');
const Message = require('../models/Message');

let SHOP_ID = null;
let ADMIN_ID = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (uri.includes('ac-hatgiff-shard')) {
    console.log('🔍 Fetching shop ID from production DB...');
    const prodUri = uri.replace('/smartplaza-stress?', '/smartplaza?');
    await mongoose.connect(prodUri);
    const adminUser = await User.findOne({ email: 'admin@smartplazabd.com' }).select('activeShop _id').lean();
    SHOP_ID = adminUser?.activeShop?.toString();
    ADMIN_ID = adminUser?._id?.toString();
    await mongoose.disconnect();

    console.log("⚠️ Switching to 'smartplaza-stress' DB for cleanup...");
    await mongoose.connect(uri);
  } else {
    await mongoose.connect(uri);
    const adminUser = await User.findOne({ role: 'Super Admin' }).select('activeShop _id').lean();
    SHOP_ID = adminUser?.activeShop?.toString();
    ADMIN_ID = adminUser?._id?.toString() || new mongoose.Types.ObjectId().toString();
  }
  console.log(`✅ Using Shop ID: ${SHOP_ID}`);
};

const cleanData = async () => {
  console.log('\n🧹 Starting FULL system cleanup for client handover...\n');

  // 1. Sales & Orders
  console.log('  📋 Removing Sales & Orders...');
  await Sale.deleteMany({});
  await SaleOrder.deleteMany({});
  await Payment.deleteMany({});

  // 2. EMI System
  console.log('  📋 Removing EMI data...');
  await EMIInvoice.deleteMany({});
  await EMICollection.deleteMany({});

  // 3. Purchases
  console.log('  📋 Removing Purchases...');
  await Purchase.deleteMany({});

  // 4. Inventory & Stock
  console.log('  📋 Removing Stock Batches, Stock Units & Inventory history...');
  await StockBatch.deleteMany({});
  await StockUnit.deleteMany({});
  await Inventory.deleteMany({});

  // 5. Transfers & Quotations
  console.log('  📋 Removing Transfers & Quotations...');
  await Transfer.deleteMany({});
  await Quotation.deleteMany({});

  // 6. Finance: Income, Expenses, Accounts, Investors, Profit Distribution
  console.log('  📋 Removing Finance data (Income, Expenses, Accounts, Investors)...');
  await Income.deleteMany({});
  await Expense.deleteMany({});
  await Account.deleteMany({});
  await Investor.deleteMany({});
  await ProfitDistribution.deleteMany({});

  // 7. Warranty
  console.log('  📋 Removing Warranty records...');
  await Warranty.deleteMany({});

  // 8. Notifications & Messages
  console.log('  📋 Removing Notifications & Messages...');
  await Notification.deleteMany({});
  await Message.deleteMany({});

  // 9. Reset orphaned fields on master data
  console.log('  🔄 Resetting orphaned fields on Products...');
  await Product.updateMany({}, {
    $set: {
      purchaseQuantity: 0,
      saleQuantity: 0,
      openingStock: 0,
      currentStock: 0
    }
  });

  console.log('  🔄 Resetting orphaned dues on Customers...');
  await Customer.updateMany({}, {
    $set: {
      totalDue: 0,
      totalPurchase: 0,
      totalPaid: 0
    }
  });

  console.log('  🔄 Resetting orphaned dues on Suppliers...');
  await Supplier.updateMany({}, {
    $set: {
      totalDue: 0,
      totalPurchase: 0,
      totalPaid: 0
    }
  });

  console.log('  🔄 Resetting Account balances...');
  await Account.updateMany({}, {
    $set: { currentBalance: 0 }
  });

  console.log('\n✅ Full system cleanup complete! All sales, EMI, finance, and orphaned data removed.\n');
  console.log('📌 Preserved: Users, Shop, Roles, Brands, Categories, Units, Products, Customers, Suppliers, POS Machines, MFS Providers');
  console.log('📌 All transactional/financial data wiped clean for client handover.\n');
};

const run = async () => {
  await connectDB();
  try {
    await cleanData();
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    mongoose.disconnect();
    process.exit(0);
  }
};

run();
