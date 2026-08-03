const mongoose = require('mongoose');
const https = require('https');
const Role = require('../models/Role');

const getPublicIP = () => {
  return new Promise((resolve) => {
    https.get('https://api.ipify.org?format=json', (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data).ip);
        } catch (e) {
          resolve(null);
        }
      });
    }).on('error', () => {
      resolve(null);
    });
  });
};

const initializePermanentRoles = async () => {
  const allTrue  = { read: true,  create: true,  update: true,  delete: true  };
  const readOnly = { read: true,  create: false, update: false, delete: false };
  const noAccess = { read: false, create: false, update: false, delete: false };

  const permanentRoles = [
    {
      name: 'Super Admin',
      permissions: {
        dashboard: allTrue, sales: allTrue, purchase: allTrue, products: allTrue,
        contacts: allTrue, inventory: allTrue, accounts: allTrue, reports: allTrue,
        users: allTrue, messages: allTrue, settings: allTrue, warranty: allTrue,
        investors: allTrue, emi: allTrue, ecommerce: allTrue
      },
      isActive: true
    },
    {
      name: 'Super Admin Plus',
      permissions: {
        dashboard: noAccess,
        sales: allTrue,
        purchase: noAccess,
        products: allTrue,
        contacts: allTrue,
        inventory: allTrue,
        accounts: noAccess,
        reports: noAccess,
        users: noAccess,
        messages: noAccess,
        settings: { read: true, create: false, update: true, delete: false },
        warranty: allTrue,
        investors: noAccess,
        emi: noAccess,
        ecommerce: allTrue
      },
      isActive: true
    },
    {
      name: 'Manager',
      permissions: {
        dashboard: allTrue, sales: allTrue, purchase: allTrue, products: allTrue,
        contacts: allTrue, inventory: allTrue, accounts: readOnly, reports: allTrue,
        users: noAccess, messages: allTrue, settings: noAccess, warranty: allTrue,
        investors: noAccess, emi: allTrue, ecommerce: readOnly
      },
      isActive: true
    },
    {
      name: 'Sales Staff',
      permissions: {
        dashboard: readOnly, 
        sales: { read: true, create: true, update: false, delete: false },
        retail: { read: true, create: true, update: false, delete: false },
        purchase: noAccess, 
        products: { read: true, create: true, update: false, delete: false },
        contacts: { read: true, create: true, update: true, delete: false },
        inventory: { read: true, create: true, update: false, delete: false }, 
        accounts: noAccess, 
        reports: readOnly,
        users: noAccess, 
        messages: noAccess, 
        settings: noAccess, 
        warranty: { read: true, create: true, update: false, delete: false },
        investors: noAccess, 
        emi: { read: true, create: true, update: true, delete: false }, 
        ecommerce: noAccess
      },
      isActive: true
    },
    {
      name: 'Investor',
      permissions: {
        dashboard: noAccess, sales: noAccess, purchase: noAccess, products: noAccess,
        contacts: noAccess, inventory: noAccess, accounts: noAccess, reports: noAccess,
        users: noAccess, messages: noAccess, settings: noAccess, warranty: noAccess,
        investors: readOnly, emi: noAccess, ecommerce: noAccess
      },
      isActive: true
    },
    {
      name: 'E-Commerce Admin',
      permissions: {
        dashboard: readOnly, sales: noAccess, purchase: noAccess,
        products: { read: true, create: true, update: true, delete: false },
        contacts: { read: true, create: true, update: true, delete: false },
        inventory: readOnly, accounts: noAccess, reports: noAccess,
        users: noAccess, messages: noAccess, settings: noAccess, warranty: noAccess,
        investors: noAccess, emi: noAccess, ecommerce: allTrue
      },
      isActive: true
    }
  ];

  for (const roleData of permanentRoles) {
    await Role.findOneAndUpdate(
      { name: roleData.name },
      { $setOnInsert: roleData }, // Only set if inserting new
      { upsert: true, new: true }
    );
  }
  console.log('✅ Permanent roles initialized');
};

const fixLegacyIndexes = async () => {
  try {
    const db = mongoose.connection.db;
    const indexes = await db.collection('products').indexes();
    const skuIndex = indexes.find(idx => idx.name === 'sku_1');
    if (skuIndex && skuIndex.unique) {
      console.log('🔄 Dropping legacy unique index sku_1 from products collection...');
      await db.collection('products').dropIndex('sku_1');
      await db.collection('products').createIndex({ sku: 1 }, { background: true });
      console.log('✅ Legacy unique index sku_1 replaced with standard index');
    }
  } catch (err) {
    // Ignore if collection/index does not exist
  }
};

const connectDB = async () => {
  if (mongoose.connection && mongoose.connection.readyState >= 1) {
    return;
  }
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smartplaza', {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    await initializePermanentRoles();
    await fixLegacyIndexes();
    try {
      const { ensureDemoAccounts } = require('../controllers/authController');
      await ensureDemoAccounts();
    } catch (e) {
      console.error('Demo accounts init note:', e.message);
    }
  } catch (error) {
    console.error('\n🔴 Error connecting to MongoDB:', error.message);
    
    // Check if we are trying to connect to Atlas
    if (process.env.MONGODB_URI && (process.env.MONGODB_URI.includes('mongodb.net') || process.env.MONGODB_URI.includes('shard'))) {
      const publicIp = await getPublicIP();
      console.log(`\n========================================================================`);
      console.log(`⚠️  MongoDB Atlas Connection Failed!`);
      if (publicIp) {
        console.log(`👉 Your current Public IP is: ${publicIp}`);
        console.log(`👉 Please ensure this IP is whitelisted on your MongoDB Atlas Console:`);
        console.log(`   https://cloud.mongodb.com/`);
      } else {
        console.log(`👉 Please verify your network/firewall settings and Atlas IP Whitelist.`);
      }
      console.log(`========================================================================\n`);

      if (!process.env.VERCEL) {
        console.log('🔄 Attempting fallback connection to local MongoDB database...');
        try {
          const localConn = await mongoose.connect('mongodb://127.0.0.1:27017/smartplaza');
          console.log(`✅ Success! MongoDB Connected to Local Fallback: ${localConn.connection.host}`);
          await initializePermanentRoles();
          await fixLegacyIndexes();
          try {
            const { ensureDemoAccounts } = require('../controllers/authController');
            await ensureDemoAccounts();
          } catch (e) {
            console.error('Demo accounts init note:', e.message);
          }
          return;
        } catch (localError) {
          console.error('❌ Local fallback connection failed:', localError.message);
          console.log('👉 Make sure you have MongoDB running locally: net start MongoDB');
        }
      }
    }
    if (!process.env.VERCEL) {
      process.exit(1);
    } else {
      console.error('⚠️ Running on Vercel: skipping process.exit(1) to prevent Serverless function crash.');
    }
  }
};

module.exports = connectDB;
