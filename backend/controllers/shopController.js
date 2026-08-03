const Shop = require('../models/Shop');
const User = require('../models/User');
const Setting = require('../models/Setting');
const asyncHandler = require('express-async-handler');

// @desc    Get all shops
// @route   GET /api/shops
// @access  Private
const getShops = asyncHandler(async (req, res) => {
  let shops;
  // Super Admin or Admin can see all shops, otherwise filter by owner or active shops
  if (['Super Admin', 'Admin'].includes(req.user.role)) {
    shops = await Shop.find().populate('owner', 'name email').sort({ createdAt: -1 });
  } else {
    shops = await Shop.find({ isActive: true }).populate('owner', 'name email').sort({ createdAt: -1 });
  }

  // Ensure at least one shop exists in DB
  if (!shops || shops.length === 0) {
    const defaultShop = await Shop.create({
      name: 'Smart Plaza Main Branch',
      owner: req.user._id,
      address: '1 KDA Avenue, Shibbari, Khulna',
      phone: '01842-144844',
      email: 'smartplazabd@gmail.com',
      isActive: true
    });
    shops = [defaultShop];
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
    email: email || 'smartplazabd@gmail.com',
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

// @desc    Delete or Deactivate shop
// @route   DELETE /api/shops/:id
// @access  Private (Super Admin)
const deleteShop = asyncHandler(async (req, res) => {
  const shop = await Shop.findById(req.params.id);

  if (!shop) {
    return res.status(404).json({ success: false, message: 'Shop not found' });
  }

  // Deactivate instead of hard delete to preserve historical integrity
  shop.isActive = false;
  await shop.save();

  res.status(200).json({
    success: true,
    message: 'Shop deactivated successfully'
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
