const Warranty = require('../models/Warranty');
const WarrantyTemplate = require('../models/WarrantyTemplate');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Sale = require('../models/Sale');
const asyncHandler = require('express-async-handler');

// =====================================================
// WARRANTY TEMPLATE ENDPOINTS
// =====================================================

// @desc    Get all warranty templates
// @route   GET /api/warranty/templates
// @access  Private
const getWarrantyTemplates = asyncHandler(async (req, res) => {
  const shopFilter = req.shopId ? { shop: req.shopId } : {};
  const { brand, category, isActive } = req.query;

  const filter = { ...shopFilter };
  if (brand) filter.brand = brand;
  if (category) filter.category = category;
  if (isActive !== undefined) filter.isActive = isActive === 'true';

  const templates = await WarrantyTemplate.find(filter)
    .populate('brand', 'name')
    .populate('category', 'name')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: templates.length,
    data: templates
  });
});

// @desc    Get single warranty template
// @route   GET /api/warranty/templates/:id
// @access  Private
const getWarrantyTemplate = asyncHandler(async (req, res) => {
  const template = await WarrantyTemplate.findOne({
    _id: req.params.id,
    shop: req.shopId
  })
    .populate('brand', 'name')
    .populate('category', 'name');

  if (!template) {
    return res.status(404).json({
      success: false,
      message: `Warranty template not found with id ${req.params.id}`
    });
  }

  res.status(200).json({
    success: true,
    data: template
  });
});

// @desc    Create warranty template
// @route   POST /api/warranty/templates
// @access  Private
const createWarrantyTemplate = asyncHandler(async (req, res) => {
  const { name, brand, category, durationMonths, description, isDefault } = req.body;

  if (!name || !brand || !category || !durationMonths) {
    return res.status(400).json({
      success: false,
      message: 'Name, brand, category, and duration are required'
    });
  }

  // If setting as default, unset other defaults for this brand+category
  if (isDefault) {
    await WarrantyTemplate.updateMany(
      { shop: req.shopId, brand, category, isDefault: true },
      { isDefault: false }
    );
  }

  const template = await WarrantyTemplate.create({
    name,
    brand,
    category,
    durationMonths,
    description,
    isDefault: isDefault || false,
    shop: req.shopId
  });

  // Populate the brand and category before returning
  const populatedTemplate = await WarrantyTemplate.findById(template._id)
    .populate('brand', 'name')
    .populate('category', 'name');

  res.status(201).json({
    success: true,
    data: populatedTemplate
  });
});

// @desc    Update warranty template
// @route   PUT /api/warranty/templates/:id
// @access  Private
const updateWarrantyTemplate = asyncHandler(async (req, res) => {
  let template = await WarrantyTemplate.findOne({
    _id: req.params.id,
    shop: req.shopId
  });

  if (!template) {
    return res.status(404).json({
      success: false,
      message: `Warranty template not found with id ${req.params.id}`
    });
  }

  // If setting as default, unset other defaults for this brand+category
  if (req.body.isDefault) {
    const brand = req.body.brand || template.brand;
    const category = req.body.category || template.category;
    await WarrantyTemplate.updateMany(
      { shop: req.shopId, brand, category, isDefault: true, _id: { $ne: req.params.id } },
      { isDefault: false }
    );
  }

  template = await WarrantyTemplate.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  })
    .populate('brand', 'name')
    .populate('category', 'name');

  res.status(200).json({
    success: true,
    data: template
  });
});

// @desc    Delete warranty template
// @route   DELETE /api/warranty/templates/:id
// @access  Private
const deleteWarrantyTemplate = asyncHandler(async (req, res) => {
  const template = await WarrantyTemplate.findOne({
    _id: req.params.id,
    shop: req.shopId
  });

  if (!template) {
    return res.status(404).json({
      success: false,
      message: `Warranty template not found with id ${req.params.id}`
    });
  }

  await template.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get warranty templates by product (looks up product's brand + category)
// @route   GET /api/warranty/templates/by-product/:productId
// @access  Private
const getWarrantyTemplatesByProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.productId).select('brand category');

  if (!product) {
    return res.status(404).json({
      success: false,
      message: `Product not found with id ${req.params.productId}`
    });
  }

  const templates = await WarrantyTemplate.find({
    shop: req.shopId,
    brand: product.brand,
    category: product.category,
    isActive: true
  })
    .populate('brand', 'name')
    .populate('category', 'name')
    .sort({ isDefault: -1, name: 1 }); // Default first

  res.status(200).json({
    success: true,
    count: templates.length,
    data: templates
  });
});

// =====================================================
// ACTIVE WARRANTY (SALE WARRANTY) ENDPOINTS
// =====================================================

// @desc    Get all warranties
// @route   GET /api/warranty
// @access  Private
const getWarranties = asyncHandler(async (req, res) => {
  const shopFilter = req.shopId ? { shop: req.shopId } : {};
  const { status } = req.query;
  
  const filter = { ...shopFilter };
  if (status) filter.status = status;

  const warranties = await Warranty.find(filter)
    .populate('product', 'name sku')
    .populate('customer', 'contactName contactNumber')
    .populate('sale', 'invoiceNumber')
    .populate('warrantyTemplate', 'name durationMonths')
    .populate('replacementProduct', 'name sku')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: warranties.length,
    data: warranties
  });
});

// @desc    Get single warranty
// @route   GET /api/warranty/:id
// @access  Private
const getWarranty = asyncHandler(async (req, res) => {
  const warranty = await Warranty.findOne({
    _id: req.params.id,
    shop: req.shopId
  })
    .populate('product', 'name sku')
    .populate('customer', 'contactName contactNumber')
    .populate('sale', 'invoiceNumber')
    .populate('warrantyTemplate', 'name durationMonths')
    .populate('replacementProduct', 'name sku');

  if (!warranty) {
    return res.status(404).json({
      success: false,
      message: `Warranty not found with id ${req.params.id}`
    });
  }

  res.status(200).json({
    success: true,
    data: warranty
  });
});

// @desc    Create warranty (manual or from sale)
// @route   POST /api/warranty
// @access  Private
const createWarranty = asyncHandler(async (req, res) => {
  const {
    warrantyTemplate: templateId,
    product,
    customer,
    sale,
    startDate,
    endDate,
    warrantyName,
    description,
    notes
  } = req.body;

  // Validate required fields
  if (!product || !customer || !sale || !startDate || !endDate) {
    return res.status(400).json({
      success: false,
      message: 'Product, customer, sale, start date, and end date are required'
    });
  }

  const warrantyData = {
    product,
    customer,
    sale,
    startDate,
    endDate,
    description,
    notes,
    shop: req.shopId
  };

  // Link to template if provided
  if (templateId) {
    warrantyData.warrantyTemplate = templateId;
    const template = await WarrantyTemplate.findById(templateId);
    if (template) {
      warrantyData.warrantyName = template.name;
    }
  }

  if (warrantyName) {
    warrantyData.warrantyName = warrantyName;
  }

  const warranty = await Warranty.create(warrantyData);

  res.status(201).json({
    success: true,
    data: warranty
  });
});

// @desc    Update warranty
// @route   PUT /api/warranty/:id
// @access  Private
const updateWarranty = asyncHandler(async (req, res) => {
  let warranty = await Warranty.findOne({
    _id: req.params.id,
    shop: req.shopId
  });

  if (!warranty) {
    return res.status(404).json({
      success: false,
      message: `Warranty not found with id ${req.params.id}`
    });
  }

  warranty = await Warranty.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  })
  .populate('product', 'name sku')
  .populate('customer', 'contactName contactNumber')
  .populate('sale', 'invoiceNumber')
  .populate('warrantyTemplate', 'name durationMonths')
  .populate('replacementProduct', 'name sku');

  res.status(200).json({
    success: true,
    data: warranty
  });
});

// @desc    Delete warranty
// @route   DELETE /api/warranty/:id
// @access  Private
const deleteWarranty = asyncHandler(async (req, res) => {
  const warranty = await Warranty.findOne({
    _id: req.params.id,
    shop: req.shopId
  });

  if (!warranty) {
    return res.status(404).json({
      success: false,
      message: `Warranty not found with id ${req.params.id}`
    });
  }

  await warranty.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Claim warranty
// @route   PUT /api/warranty/:id/claim
// @access  Private
const claimWarranty = asyncHandler(async (req, res) => {
  const { replacementProduct, claimDate, notes } = req.body;
  
  let warranty = await Warranty.findOne({
    _id: req.params.id,
    shop: req.shopId
  });

  if (!warranty) {
    return res.status(404).json({
      success: false,
      message: `Warranty not found with id ${req.params.id}`
    });
  }

  if (warranty.status !== 'Active') {
    return res.status(400).json({
      success: false,
      message: 'Warranty is not active and cannot be claimed'
    });
  }

  // Update warranty status and details
  warranty.status = 'Claimed';
  warranty.claimDate = claimDate || new Date();
  if (replacementProduct) warranty.replacementProduct = replacementProduct;
  if (notes) warranty.notes = notes;

  await warranty.save();

  res.status(200).json({
    success: true,
    data: warranty
  });
});

module.exports = {
  // Template endpoints
  getWarrantyTemplates,
  getWarrantyTemplate,
  createWarrantyTemplate,
  updateWarrantyTemplate,
  deleteWarrantyTemplate,
  getWarrantyTemplatesByProduct,
  // Active warranty endpoints
  getWarranties,
  getWarranty,
  createWarranty,
  updateWarranty,
  deleteWarranty,
  claimWarranty
};