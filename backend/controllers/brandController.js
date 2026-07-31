const Brand = require('../models/Brand');
const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');

// @desc    Get all brands
// @route   GET /api/brands
// @access  Private
const getBrands = asyncHandler(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter including global brands
    const filter = {};
    
    if (req.shopId) {
      filter.$or = [
        { shop: req.shopId },
        { shop: null },
        { shop: { $exists: false } }
      ];
    }

    if (req.query.search) {
      filter.name = { $regex: req.query.search, $options: 'i' };
    }

    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === 'true';
    }

    // Get total count
    let total = await Brand.countDocuments(filter);

    // Get brands
    let brands = await Brand.find(filter)
      .sort({ displayOrder: 1, name: 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Fail-safe: If no brands were found for shop filter, return all available brands
    if (brands.length === 0 && !req.query.search) {
      const globalFilter = req.query.isActive !== undefined ? { isActive: req.query.isActive === 'true' } : {};
      total = await Brand.countDocuments(globalFilter);
      brands = await Brand.find(globalFilter)
        .sort({ displayOrder: 1, name: 1 })
        .skip(skip)
        .limit(limit)
        .lean();
    }

    res.status(200).json({
      success: true,
      count: brands.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: brands
    });
  } catch (error) {
    console.error('[BRANDS] Error fetching brands:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

// @desc    Get single brand
// @route   GET /api/brands/:id
// @access  Private
const getBrandById = asyncHandler(async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: 'Brand not found'
      });
    }

    res.status(200).json({
      success: true,
      data: brand
    });
  } catch (error) {
    console.error('[BRANDS] Error fetching brand:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

// @desc    Create brand
// @route   POST /api/brands
// @access  Private
const createBrand = asyncHandler(async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { name, logo, description, website, country, isActive, displayOrder } = req.body;

    // Check if brand already exists
    const existingBrand = await Brand.findOne({ name: new RegExp(`^${name}$`, 'i') });
    if (existingBrand) {
      return res.status(400).json({
        success: false,
        message: 'Brand with this name already exists'
      });
    }

    const brandData = {
      name,
      logo,
      description,
      website,
      country,
      isActive: isActive !== undefined ? isActive : true,
      displayOrder: displayOrder || 0
    };

    // Add shop context if available
    if (req.shopId) {
      brandData.shop = req.shopId;
    }

    const brand = await Brand.create(brandData);

    console.log('[BRAND CREATED] New brand created:', {
      id: brand._id,
      name: brand.name,
      shop: brand.shop
    });

    res.status(201).json({
      success: true,
      message: 'Brand created successfully',
      data: brand
    });
  } catch (error) {
    console.error('[BRANDS] Error creating brand:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Brand name must be unique'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

// @desc    Update brand
// @route   PUT /api/brands/:id
// @access  Private
const updateBrand = asyncHandler(async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    let brand = await Brand.findById(req.params.id);

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: 'Brand not found'
      });
    }

    const { name, logo, description, website, country, isActive, displayOrder } = req.body;

    // Check if name is being changed and if it conflicts
    if (name && name !== brand.name) {
      const existingBrand = await Brand.findOne({ 
        name: new RegExp(`^${name}$`, 'i'),
        _id: { $ne: req.params.id }
      });
      
      if (existingBrand) {
        return res.status(400).json({
          success: false,
          message: 'Another brand with this name already exists'
        });
      }
    }

    brand = await Brand.findByIdAndUpdate(
      req.params.id,
      {
        name: name || brand.name,
        logo: logo !== undefined ? logo : brand.logo,
        description: description !== undefined ? description : brand.description,
        website: website !== undefined ? website : brand.website,
        country: country !== undefined ? country : brand.country,
        isActive: isActive !== undefined ? isActive : brand.isActive,
        displayOrder: displayOrder !== undefined ? displayOrder : brand.displayOrder
      },
      { new: true, runValidators: true }
    );

    console.log('[BRAND UPDATED] Brand updated:', {
      id: brand._id,
      name: brand.name
    });

    res.status(200).json({
      success: true,
      message: 'Brand updated successfully',
      data: brand
    });
  } catch (error) {
    console.error('[BRANDS] Error updating brand:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Brand name must be unique'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

// @desc    Delete brand
// @route   DELETE /api/brands/:id
// @access  Private
const deleteBrand = asyncHandler(async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: 'Brand not found'
      });
    }

    await Brand.findByIdAndDelete(req.params.id);

    console.log('[BRAND DELETED] Brand deleted:', {
      id: brand._id,
      name: brand.name
    });

    res.status(200).json({
      success: true,
      message: 'Brand deleted successfully'
    });
  } catch (error) {
    console.error('[BRANDS] Error deleting brand:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

// @desc    Toggle brand active status
// @route   PUT /api/brands/:id/toggle-status
// @access  Private
const toggleBrandStatus = asyncHandler(async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: 'Brand not found'
      });
    }

    brand.isActive = !brand.isActive;
    await brand.save();

    res.status(200).json({
      success: true,
      message: `Brand ${brand.isActive ? 'activated' : 'deactivated'} successfully`,
      data: brand
    });
  } catch (error) {
    console.error('[BRANDS] Error toggling brand status:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

module.exports = {
  getBrands,
  getBrandById,
  createBrand,
  updateBrand,
  deleteBrand,
  toggleBrandStatus
};
