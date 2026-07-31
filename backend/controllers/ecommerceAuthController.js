const User = require('../models/User');
const Customer = require('../models/Customer');
const jwt = require('jsonwebtoken');

// Generate JWT
const generateToken = (id, version = 0) => {
  return jwt.sign({ id, version }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register new online customer
// @route   POST /api/ecommerce/auth/register
// @access  Public
exports.registerOnlineCustomer = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // Create User with role 'Online Customer'
    // Auto-approve so they can login immediately
    const user = await User.create({
      name,
      email,
      phone,
      password,
      role: 'Online Customer',
      isActive: true,
      isApproved: true,
      approvalStatus: 'Approved'
    });

    if (user) {
      // Create linked Customer record
      await Customer.create({
        contactName: name,
        email,
        contactNumber: phone,
        contactType: 'Customer',
        customerType: 'Online',
        userId: user._id
      });

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        approvalStatus: user.approvalStatus,
        token: generateToken(user._id, user.tokenVersion),
      });
    } else {
      res.status(400).json({ success: false, message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Error in registerOnlineCustomer:', error);
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
};

// @desc    Login online customer
// @route   POST /api/ecommerce/auth/login
// @access  Public
exports.loginOnlineCustomer = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Since we want this to be exclusive for online customers, but maybe other roles 
    // want to buy? It's better to just allow Online Customer to avoid complications.
    if (user.role !== 'Online Customer') {
      return res.status(403).json({ success: false, message: 'This account cannot be used for online shopping directly. Please use the admin portal.' });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Account is pending or inactive' });
    }

    const newTokenVersion = (user.tokenVersion || 0) + 1;
    await User.findByIdAndUpdate(user._id, { tokenVersion: newTokenVersion });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      approvalStatus: user.approvalStatus,
      token: generateToken(user._id, newTokenVersion),
    });
  } catch (error) {
    console.error('Error in loginOnlineCustomer:', error);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
};
