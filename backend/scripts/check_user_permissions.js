require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');

const checkPermissions = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const User = require('../models/User');
    const users = await User.find({}, 'name email role permissions').lean();
    console.log(JSON.stringify(users, null, 2));
  } catch (error) {
    console.error(error);
  } finally {
    await mongoose.disconnect();
  }
};

checkPermissions();
