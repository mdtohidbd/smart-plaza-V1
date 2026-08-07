const asyncHandler = require('express-async-handler');
const { uploadImage } = require('../utils/imageUpload');

// @desc    Upload a single image
// @route   POST /api/upload
// @access  Private
const uploadSingleImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded'
    });
  }

  try {
    const result = await uploadImage(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      'DemoERP/general'
    );
    
    res.status(200).json({
      success: true,
      url: result.url,
      display_url: result.display_url,
      thumb_url: result.thumb_url,
      delete_hash: result.delete_hash
    });
  } catch (error) {
    console.error('Image upload error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to upload image',
      error: error.message
    });
  }
});

module.exports = {
  uploadSingleImage
};
