const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permission');

const {
  getBrands,
  getBrandById,
  createBrand,
  updateBrand,
  deleteBrand,
  toggleBrandStatus
} = require('../controllers/brandController');

// All routes are protected and require shop context
router.use(protect);


// Public route for e-commerce (no auth required)
router.get('/public', async (req, res) => {
  try {
    const Brand = require('../models/Brand');
    
    const brands = await Brand.find({ isActive: true })
      .select('name logo description website country displayOrder')
      .sort({ displayOrder: 1, name: 1 })
      .lean();
    
    res.status(200).json({
      success: true,
      count: brands.length,
      data: brands
    });
  } catch (error) {
    console.error('[BRANDS PUBLIC] Error fetching brands:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch brands'
    });
  }
});

// Protected routes
router.route('/')
  .get(checkPermission('products', 'read'), getBrands)
  .post(checkPermission('products', 'create'), createBrand);

router.route('/:id')
  .get(checkPermission('products', 'read'), getBrandById)
  .put(checkPermission('products', 'update'), updateBrand)
  .delete(checkPermission('products', 'delete'), deleteBrand);

router.put('/:id/toggle-status', checkPermission('products', 'update'), toggleBrandStatus);

module.exports = router;
