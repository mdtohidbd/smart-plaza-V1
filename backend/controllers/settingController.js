const Setting = require('../models/Setting');
const asyncHandler = require('express-async-handler');

// @desc    Get settings
// @route   GET /api/settings
// @access  Private
const getSettings = asyncHandler(async (req, res) => {
  // Get settings for the current shop
  let settings = await Setting.findOne({ shop: req.shopId });

  if (!settings) {
    // If no settings exist, create default settings with required fields
    settings = await Setting.create({
      companyName: 'Smart Plaza BD',
      companyAddress: '1 KDA Avenue, Shibbari, Khulna, Khulna, Bangladesh, 9100',
      phone: '01842-144844',
      email: 'smartplazabd@gmail.com',
      shop: req.shopId
    });
  }

  res.status(200).json({
    success: true,
    data: settings
  });
});

// @desc    Update settings
// @route   PUT /api/settings
// @access  Private
const updateSettings = asyncHandler(async (req, res) => {
  let settings = await Setting.findOne({ shop: req.shopId });

  if (!settings) {
    // If no settings exist, create them with default values for required fields
    const settingsData = {
      companyName: req.body.companyName || 'Smart Plaza BD',
      companyAddress: req.body.companyAddress || '1 KDA Avenue, Shibbari, Khulna, Khulna, Bangladesh, 9100',
      phone: req.body.phone || '01842-144844',
      email: req.body.email || 'smartplazabd@gmail.com',
      shop: req.shopId
    };
    
    // Add any other provided fields
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined && ['companyName', 'companyAddress', 'phone', 'email'].indexOf(key) === -1) {
        settingsData[key] = req.body[key];
      }
    });
    
    settings = await Setting.create(settingsData);
  } else {
    // Update existing settings - only update provided fields
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        settings[key] = req.body[key];
      }
    });
    
    // Ensure required fields are present
    if (!settings.companyName) settings.companyName = 'Smart Plaza BD';
    if (!settings.companyAddress) settings.companyAddress = '1 KDA Avenue, Shibbari, Khulna, Khulna, Bangladesh, 9100';
    if (!settings.phone) settings.phone = '01842-144844';
    if (!settings.email) settings.email = 'smartplazabd@gmail.com';
    
    // Use updateOne to bypass validation temporarily
    await Setting.updateOne({ _id: settings._id }, { $set: settings.toObject() });
    
    // Fetch the updated document
    settings = await Setting.findById(settings._id);
  }

  res.status(200).json({
    success: true,
    data: settings
  });
});

// @desc    Get modules
// @route   GET /api/settings/modules
// @access  Private
const getModules = asyncHandler(async (req, res) => {
  let settings = await Setting.findOne({ shop: req.shopId });

  if (!settings) {
    settings = await Setting.create({
      companyName: 'Smart Plaza BD',
      companyAddress: '1 KDA Avenue, Shibbari, Khulna, Khulna, Bangladesh, 9100',
      phone: '01842-144844',
      email: 'smartplazabd@gmail.com',
      shop: req.shopId
    });
  }

  const modules = [
    { name: 'enableRetail', label: 'Retail', enabled: settings.enableRetail },
    { name: 'enableWholesale', label: 'Wholesale', enabled: settings.enableWholesale },
    { name: 'enableMultipleWarehouse', label: 'Multiple Warehouse', enabled: settings.enableMultipleWarehouse }
  ];

  res.status(200).json({
    success: true,
    data: modules
  });
});

// @desc    Update modules
// @route   PUT /api/settings/modules
// @access  Private
const updateModules = asyncHandler(async (req, res) => {
  const { modules } = req.body;
  let settings = await Setting.findOne({ shop: req.shopId });

  if (!settings) {
    settings = new Setting({
      companyName: 'Smart Plaza BD',
      companyAddress: '1 KDA Avenue, Shibbari, Khulna, Khulna, Bangladesh, 9100',
      phone: '01842-144844',
      email: 'smartplazabd@gmail.com',
      shop: req.shopId
    });
  }

  if (modules && Array.isArray(modules)) {
    modules.forEach(mod => {
      if (['enableRetail', 'enableWholesale', 'enableMultipleWarehouse'].includes(mod.name)) {
        settings[mod.name] = mod.enabled;
      }
    });
    
    await Setting.updateOne({ _id: settings._id }, { $set: settings.toObject() }, { upsert: true });
  }

  const updatedModules = [
    { name: 'enableRetail', label: 'Retail', enabled: settings.enableRetail },
    { name: 'enableWholesale', label: 'Wholesale', enabled: settings.enableWholesale },
    { name: 'enableMultipleWarehouse', label: 'Multiple Warehouse', enabled: settings.enableMultipleWarehouse }
  ];

  res.status(200).json({
    success: true,
    data: updatedModules
  });
});

module.exports = {
  getSettings,
  updateSettings,
  getModules,
  updateModules
};