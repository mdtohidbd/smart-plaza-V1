const Shop = require('../models/Shop');
const User = require('../models/User');
const Setting = require('../models/Setting');
const asyncHandler = require('express-async-handler');

// @desc    Get all shops
// @route   GET /api/shops
// @access  Private
// @desc    Get all shops
// @route   GET /api/shops
// @access  Private
const getShops = asyncHandler(async (req, res) => {
  let shops;
  if (['Super Admin', 'Admin'].includes(req.user.role)) {
    shops = await Shop.find().populate('owner', 'name email').sort({ createdAt: -1 });
  } else {
    shops = await Shop.find({ isActive: true }).populate('owner', 'name email').sort({ createdAt: -1 });
  }

  // If DB is completely empty (no shops exist at all), seed initial shop
  const totalCount = await Shop.countDocuments();
  if (totalCount === 0) {
    await Shop.create({
      name: 'kybridge Systems Demo',
      owner: req.user._id,
      address: 'Level 4, Multiplan Center, Elephant Road, Dhaka-1205',
      phone: '+8801700000000',
      email: 'info@yourskybridge.com',
      isActive: true
    });
    if (['Super Admin', 'Admin'].includes(req.user.role)) {
      shops = await Shop.find().populate('owner', 'name email').sort({ createdAt: -1 });
    } else {
      shops = await Shop.find({ isActive: true }).populate('owner', 'name email').sort({ createdAt: -1 });
    }
  }

  res.status(200).json({
    success: true,
    count: shops.length,
    data: shops
  });
});

// @desc    Create new shop
// @route   POST /api/shops
// @access  Private (Admin / Super Admin)
const createShop = asyncHandler(async (req, res) => {
  const { name, address, phone, email, settings } = req.body;

  if (!name) {
    return res.status(400).json({ success: false, message: 'Shop name is required' });
  }

  const shop = await Shop.create({
    name,
    owner: req.user._id,
    address: address || '',
    phone: phone || '',
    email: email || '',
    settings: settings || {
      currency: 'BDT',
      taxRate: 0,
      discountRate: 0
    }
  });

  // Also create/initialize default settings document for this new shop
  await Setting.create({
    companyName: name,
    companyAddress: address || '1 KDA Avenue, Shibbari, Khulna',
    phone: phone || '01842-144844',
    email: email || 'admin@yourskybridge.com',
    shop: shop._id
  });

  res.status(201).json({
    success: true,
    data: shop,
    message: 'Shop created successfully'
  });
});

// @desc    Update shop details
// @route   PUT /api/shops/:id
// @access  Private (Admin / Super Admin)
const updateShop = asyncHandler(async (req, res) => {
  let shop = await Shop.findById(req.params.id);

  if (!shop) {
    return res.status(404).json({ success: false, message: 'Shop not found' });
  }

  shop = await Shop.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: shop,
    message: 'Shop updated successfully'
  });
});

// @desc    Delete shop permanently from database
// @route   DELETE /api/shops/:id
// @access  Private (Super Admin / Admin)
const deleteShop = asyncHandler(async (req, res) => {
  const shop = await Shop.findById(req.params.id);

  if (!shop) {
    return res.status(404).json({ success: false, message: 'Shop not found' });
  }

  // Delete associated settings for this shop
  await Setting.deleteMany({ shop: shop._id });

  // Delete shop from DB
  await shop.deleteOne();

  // If this shop was active for current user, reset activeShop to another shop if available
  if (req.user.activeShop && req.user.activeShop.toString() === shop._id.toString()) {
    const nextShop = await Shop.findOne({});
    await User.findByIdAndUpdate(req.user._id, { activeShop: nextShop ? nextShop._id : null });
  }

  res.status(200).json({
    success: true,
    message: 'Shop deleted successfully from database'
  });
});

// @desc    Switch user active shop
// @route   POST /api/shops/switch
// @access  Private
const switchShop = asyncHandler(async (req, res) => {
  const { shopId } = req.body;

  if (!shopId) {
    return res.status(400).json({ success: false, message: 'Shop ID is required' });
  }

  const shop = await Shop.findById(shopId);
  if (!shop || !shop.isActive) {
    return res.status(404).json({ success: false, message: 'Shop not found or inactive' });
  }

  // Update activeShop on current user profile
  await User.findByIdAndUpdate(req.user._id, { activeShop: shop._id });

  res.status(200).json({
    success: true,
    data: shop,
    message: `Switched active shop to ${shop.name}`
  });
});

module.exports = {
  getShops,
  createShop,
  updateShop,
  deleteShop,
  switchShop
};
