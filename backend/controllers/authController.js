const User = require('../models/User');
const Customer = require('../models/Customer');
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const { isSuperAdminPlus, isSuperAdmin, getSuperAdminPlusPermissions, getSuperAdminPermissions, isInvestor, getInvestorPermissions } = require('../utils/roleUtils');
const { createNotification } = require('../utils/notificationFeed');

// Generate JWT Token
const generateToken = (id, version = 0) => {
  return jwt.sign({ id, version }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, phone, password, role } = req.body;

  // Check if user already exists
  const userExists = await User.findOne({
    $or: [{ email }, { phone }]
  });

  if (userExists) {
    return res.status(400).json({ message: 'User already exists with this email or phone' });
  }

  // Create user
  const user = await User.create({
    name,
    email,
    phone,
    password,
    role
  });

  if (user) {
    // NEW: Auto-heal/Link existing customer record if guest checkout was previously used
    try {
      const existingCustomer = await Customer.findOne({
        $or: [
          { email: new RegExp(`^${email}$`, 'i') },
          { contactNumber: phone }
        ]
      });

      if (existingCustomer && !existingCustomer.userId) {
        existingCustomer.userId = user._id;
        await existingCustomer.save();
        console.log(`[AUTH] Linked existing customer record to new user: ${email}`);
      }
    } catch (err) {
      console.error('[AUTH] Failed to link existing customer to new user:', err);
    }

    // Notify Super Admin of new user sign up
    try {
      await createNotification({
        type: 'System',
        message: `New system user signup: ${user.name} (${user.email}). Action required: Assign role and approve.`,
        severity: 'medium',
        audience: 'super_admin',
        actionLink: '/dashboard/users/approval',
        actionLabel: 'Go to User Approval',
        metadata: { userId: user._id }
      });
      console.log(`[AUTH] Notification created for new user registration: ${user.email}`);
    } catch (notifyErr) {
      console.error('[AUTH] Failed to create notification for new user registration:', notifyErr);
    }

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      shops: user.shops || [],
      activeShop: user.activeShop || null,
      token: generateToken(user._id, user.tokenVersion),
    });
  } else {
    res.status(400).json({ message: 'Invalid user data' });
  }
});

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  console.log('Login request received:', req.body);
  const { email, password } = req.body;

  // Check for email and password
  if (!email || !password) {
    console.log('Missing email or password');
    return res.status(400).json({ message: 'Please provide email and password' });
  }

  // Find user by email
  const user = await User.findOne({ email }).select('+password');
  console.log('User found:', user ? user.email : 'No user found');

  if (!user) {
    console.log('Invalid email or password for:', email);
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  // FIRST: Check if user is approved (for SR role and below)
  // This check happens BEFORE checking isActive to prevent bypass
  if (['SR', 'DSR'].includes(user.role)) {
    if (user.approvalStatus !== 'Approved') {
      console.log('Unapproved user trying to login:', email, 'Status:', user.approvalStatus);
      return res.status(403).json({ 
        message: `Your account is under review (${user.approvalStatus}). Please wait for Super Admin approval.` 
      });
    }
    // Even if approved, check if active
    if (!user.isActive) {
      console.log('Approved but inactive user:', email);
      return res.status(403).json({ 
        message: 'Your account is under review. Please contact administrator.' 
      });
    }
  } else {
    // For non-SR roles (Admin, Manager, Super Admin), just check isActive
    // They don't need approval status check
    if (!user.isActive) {
      console.log('Account inactive for user:', email);
      return res.status(403).json({ 
        message: 'Your account is under review. Please contact administrator.' 
      });
    }
  }

  // Validate password
  if (await user.matchPassword(password)) {
    console.log('Login successful for user:', user.email);

    // Prepare targeted update to avoid full document write overhead
    const updateData = { tokenVersion: (user.tokenVersion || 0) + 1 };

    if (isSuperAdmin(user)) {
      updateData.permissions = getSuperAdminPermissions();
      updateData.permissionVersion = (user.permissionVersion || 0) + 1;
    } else if (isSuperAdminPlus(user)) {
      updateData.permissions = getSuperAdminPlusPermissions();
      updateData.permissionVersion = (user.permissionVersion || 0) + 1;
    } else if (isInvestor(user)) {
      updateData.permissions = getInvestorPermissions();
      updateData.permissionVersion = (user.permissionVersion || 0) + 1;
    }

    // Use updateOne for better performance (bypasses full save and middleware)
    await User.updateOne({ _id: user._id }, { $set: updateData });

    // Apply updates to local user object for response
    user.tokenVersion = updateData.tokenVersion;
    if (updateData.permissions) {
      user.permissions = updateData.permissions;
      user.permissionVersion = updateData.permissionVersion;
    }
    
    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,  // Include isActive for frontend validation
      approvalStatus: user.approvalStatus,  // Include approval status for SR roles
      permissions: user.permissions,
      permissionVersion: user.permissionVersion,  // Include to detect permission changes
      shops: user.shops || [],
      activeShop: user.activeShop || null,
      token: generateToken(user._id, user.tokenVersion),
    });
  } else {
    console.log('Invalid email or password for:', email);
    return res.status(401).json({ message: 'Invalid email or password' });
  }
});

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  if (user) {
    // Auto-sync Super Admin permissions so role always works correctly
    if (isSuperAdmin(user)) {
      const expected = getSuperAdminPermissions();
      const current = JSON.stringify(user.permissions || {});
      const next = JSON.stringify(expected);
      if (current !== next) {
        user.permissions = expected;
        user.permissionVersion = (user.permissionVersion || 0) + 1;
        await user.save();
      }
    } else if (isSuperAdminPlus(user)) {
      const expected = getSuperAdminPlusPermissions();
      const current = JSON.stringify(user.permissions || {});
      const next = JSON.stringify(expected);
      if (current !== next) {
        user.permissions = expected;
        user.permissionVersion = (user.permissionVersion || 0) + 1;
        await user.save();
      }
    }

    // Auto-sync Investor permissions so role always works correctly
    if (isInvestor(user)) {
      const expected = getInvestorPermissions();
      const current = JSON.stringify(user.permissions || {});
      const next = JSON.stringify(expected);
      if (current !== next) {
        user.permissions = expected;
        user.permissionVersion = (user.permissionVersion || 0) + 1;
        await user.save();
      }
    }

    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive !== undefined ? user.isActive : true,        // ✅ Include for validation
      approvalStatus: user.approvalStatus,  // ✅ Include for SR validation
      permissions: user.permissions,
      permissionVersion: user.permissionVersion,  // ✅ Include to detect changes
      shops: user.shops || [],
      activeShop: user.activeShop || null,
      address: user.address,
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.phone = req.body.phone || user.phone;
    user.address = req.body.address || user.address;

    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.status(200).json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      role: updatedUser.role,
      permissions: updatedUser.permissions,
      shops: updatedUser.shops || [],
      activeShop: updatedUser.activeShop || null,
      address: updatedUser.address,
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
});

// Demo accounts definition
const DEMO_ACCOUNTS_DEF = [
  {
    role: 'Super Admin',
    name: 'MD Reajul Hasan (Super Admin)',
    email: 'admin@smartplazabd.com',
    password: 'admin123',
    phone: '01700000000',
    description: 'Full system control, financial analytics, settings & permissions management.',
    badge: 'Full Access',
    color: '#10B981'
  },
  {
    role: 'Manager',
    name: 'Tanvir Ahmed (Manager)',
    email: 'manager@smartplazabd.com',
    password: 'manager123',
    phone: '01711111111',
    description: 'Inventory management, purchases, sales oversight & daily reporting.',
    badge: 'Management',
    color: '#3B82F6'
  },
  {
    role: 'Sales Staff',
    name: 'Rahim Uddin (Sales Executive)',
    email: 'sales@smartplazabd.com',
    password: 'sales123',
    phone: '01722222222',
    description: 'Retail POS checkout, customer management & warranty claims.',
    badge: 'POS & Sales',
    color: '#F59E0B'
  },
  {
    role: 'Investor',
    name: 'Kazi Tariqul Islam (Investor)',
    email: 'investor@smartplazabd.com',
    password: 'investor123',
    phone: '01733333333',
    description: 'Investment capital tracker, monthly profit distributions & withdrawals.',
    badge: 'Investor Portal',
    color: '#8B5CF6'
  },
  {
    role: 'E-Commerce Admin',
    name: 'Smart Plaza Admin (E-Commerce)',
    email: 'ecommerce@smartplazabd.com',
    password: 'ecommerce123',
    phone: '01744444444',
    description: 'E-commerce store management, catalog & customer order fulfillment.',
    badge: 'Store Admin',
    color: '#EC4899'
  },
  {
    role: 'Customer',
    name: 'Anwar Hossain (Customer)',
    email: 'customer@smartplazabd.com',
    password: 'customer123',
    phone: '01755555555',
    description: 'Online store customer profile, order history & EMI payments.',
    badge: 'Customer',
    color: '#14B8A6'
  },
  {
    role: 'Super Admin Plus',
    name: 'Rasel Khan (Super Admin Plus)',
    email: 'adminplus@smartplazabd.com',
    password: 'adminplus123',
    phone: '01766666666',
    description: 'System configuration, extended access & master role override.',
    badge: 'Master Role',
    color: '#06B6D4'
  }
];

// Helper to seed/ensure demo accounts exist
const ensureDemoAccounts = async () => {
  try {
    const Shop = require('../models/Shop');
    const mainShop = await Shop.findOne({});
    const shopId = mainShop ? mainShop._id : null;

    for (const item of DEMO_ACCOUNTS_DEF) {
      let user = await User.findOne({ email: item.email }).select('+password');
      if (!user) {
        // Clear any phone clashes for non-matching email
        await User.deleteMany({ phone: item.phone, email: { $ne: item.email } });
        user = await User.create({
          name: item.name,
          email: item.email,
          password: item.password,
          phone: item.phone,
          role: item.role,
          isActive: true,
          isApproved: true,
          approvalStatus: 'Approved',
          activeShop: shopId,
          shop: shopId
        });
        console.log(`✅ [DEMO SEED] Created demo user: ${item.role} (${item.email})`);
      } else {
        user.isActive = true;
        user.isApproved = true;
        user.approvalStatus = 'Approved';
        user.password = item.password; // Ensure password matches
        if (shopId && !user.activeShop) {
          user.activeShop = shopId;
          user.shop = shopId;
        }
        await user.save();
      }
    }
  } catch (err) {
    console.error('⚠️ Error ensuring demo accounts:', err.message);
  }
};

// @desc    Get all available demo role accounts
// @route   GET /api/auth/demo-accounts
// @access  Public
const getDemoAccounts = asyncHandler(async (req, res) => {
  await ensureDemoAccounts();
  res.status(200).json({
    success: true,
    data: DEMO_ACCOUNTS_DEF
  });
});

module.exports = {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  getDemoAccounts,
  ensureDemoAccounts
};