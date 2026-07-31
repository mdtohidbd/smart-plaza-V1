require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const User = require('../models/User');

const checkPassword = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const user = await User.findOne({ email: 'admin@smartplazabd.com' }).select('+password');
  if (user) {
    console.log('User found:', user.email, 'Role:', user.role);
    const isMatch = await user.matchPassword('admin123');
    console.log('Password "admin123" match:', isMatch);
    if (!isMatch) {
      user.password = 'admin123';
      await user.save();
      console.log('✅ Reset password to "admin123" successfully!');
    }
  } else {
    console.log('User not found');
  }
  mongoose.disconnect();
};

checkPassword();
