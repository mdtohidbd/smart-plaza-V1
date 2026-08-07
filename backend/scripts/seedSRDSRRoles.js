require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const Role = require('../models/Role');
const connectDB = require('../config/db');

const seedRoles = async () => {
  try {
    await connectDB();
    
    const srPermissions = {
      dashboard: { read: true, create: false, update: false, delete: false },
      sales: { read: true, create: true, update: false, delete: false },
      retail: { read: false, create: false, update: false, delete: false },
      purchase: { read: false, create: false, update: false, delete: false },
      products: { read: true, create: false, update: false, delete: false },
      contacts: { read: true, create: true, update: true, delete: false },
      inventory: { read: true, create: false, update: false, delete: false },
      accounts: { read: false, create: false, update: false, delete: false },
      reports: { read: true, create: false, update: false, delete: false },
      users: { read: false, create: false, update: false, delete: false },
      messages: { read: false, create: false, update: false, delete: false },
      settings: { read: false, create: false, update: false, delete: false },
      warranty: { read: true, create: true, update: false, delete: false },
      investors: { read: false, create: false, update: false, delete: false },
      emi: { read: false, create: false, update: false, delete: false },
      ecommerce: { read: false, create: false, update: false, delete: false }
    };

    const dsrPermissions = { ...srPermissions }; // Same as SR for now

    const roles = [
      { name: 'SR', permissions: srPermissions },
      { name: 'DSR', permissions: dsrPermissions }
    ];

    for (const roleData of roles) {
      const existing = await Role.findOne({ name: roleData.name });
      if (!existing) {
        await Role.create(roleData);
        console.log(`[SEED] Created missing role: ${roleData.name}`);
      } else {
        console.log(`[SEED] Role ${roleData.name} already exists.`);
      }
    }
    
    console.log('Role seeding completed.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding roles:', error);
    process.exit(1);
  }
};

seedRoles();
