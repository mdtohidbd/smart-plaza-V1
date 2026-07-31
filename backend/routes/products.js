const express = require('express');
const { 
  getProducts, 
  getProduct, 
  createProduct, 
  updateProduct, 
  deleteProduct
} = require('../controllers/productController');
const multer = require('multer');
const { 
  uploadProductImages,
  setPrimaryImage,
  removeProductImage
} = require('../controllers/productImageController');
const { protect, authorize } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permission');


// Configure multer for memory storage (temporary, just for parsing FormData)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit per file
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

const router = express.Router();

// Special route for /all to avoid CastError when "all" is treated as ObjectId
router.get('/all', protect, checkPermission('products', 'read'), getProducts);

router.route('/')
  .get(protect, checkPermission('products', 'read'), getProducts)
  .post(protect, checkPermission('products', 'create'), createProduct);

router.route('/:id')
  .get(protect, checkPermission('products', 'read'), getProduct)
  .put(protect, checkPermission('products', 'update'), updateProduct)
  .delete(protect, checkPermission('products', 'delete'), deleteProduct);

// Image management routes - use multer.array() to parse FormData, then upload
router.route('/:id/images')
  .post(protect, checkPermission('products', 'update'), upload.array('images', 10), uploadProductImages)
  .delete(protect, checkPermission('products', 'update'), removeProductImage);

router.route('/:id/primary-image')
  .put(protect, checkPermission('products', 'update'), setPrimaryImage);

module.exports = router;
