require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const User = require('../models/User');

const checkUsers = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const users = await User.find({}, 'name email role shop activeShop status').lean();
  console.log('--- ADMIN & SYSTEM USERS ---');
  console.dir(users, { depth: null });
  mongoose.disconnect();
};

checkUsers();
