const express = require('express');
const router = express.Router();
const multer = require('multer');
const { uploadSingleImage } = require('../controllers/uploadController');
const { protect } = require('../middleware/auth');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

router.post('/', protect, upload.single('image'), uploadSingleImage);

module.exports = router;
