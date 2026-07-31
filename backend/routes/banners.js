const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  getBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  uploadBannerImages
} = require('../controllers/bannerController');
const { protect, authorize } = require('../middleware/auth');

// Configure multer for memory storage (temporary, for parsing FormData before sending to image upload)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit per file (banners can be large)
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

router.use(protect);
router.use(authorize('Super Admin', 'Admin', 'E-Commerce Admin', 'Super Admin Plus'));

// Image upload route — must come BEFORE /:id routes to avoid "upload-images" being treated as an ID
router.post('/upload-images', upload.array('images', 10), uploadBannerImages);

router.route('/')
  .get(getBanners)
  .post(createBanner);

router.route('/:id')
  .put(updateBanner)
  .delete(deleteBanner);

module.exports = router;
