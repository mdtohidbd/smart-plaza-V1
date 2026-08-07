const Banner = require('../models/Banner');
const asyncHandler = require('express-async-handler');
const { uploadImage } = require('../utils/imageUpload');

// @desc    Get all banners
// @route   GET /api/banners
// @access  Private/Admin
const getBanners = asyncHandler(async (req, res) => {
  const banners = await Banner.find({}).sort({ displayOrder: 1, createdAt: -1 });
  res.status(200).json({
    success: true,
    count: banners.length,
    data: banners
  });
});

// @desc    Create a banner
// @route   POST /api/banners
// @access  Private/Admin
const createBanner = asyncHandler(async (req, res) => {
  const banner = await Banner.create(req.body);
  res.status(201).json({
    success: true,
    data: banner
  });
});

// @desc    Update a banner
// @route   PUT /api/banners/:id
// @access  Private/Admin
const updateBanner = asyncHandler(async (req, res) => {
  let banner = await Banner.findById(req.params.id);

  if (!banner) {
    res.status(404);
    throw new Error('Banner not found');
  }

  banner = await Banner.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: banner
  });
});

// @desc    Delete a banner
// @route   DELETE /api/banners/:id
// @access  Private/Admin
const deleteBanner = asyncHandler(async (req, res) => {
  const banner = await Banner.findById(req.params.id);

  if (!banner) {
    res.status(404);
    throw new Error('Banner not found');
  }

  await banner.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Upload banner images to ImgBB
// @route   POST /api/banners/upload-images
// @access  Private/Admin
const uploadBannerImages = asyncHandler(async (req, res) => {
  // Check if files are provided
  if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No files uploaded'
    });
  }

  try {
    // Upload each image
    const uploadPromises = req.files.map(file =>
      uploadImage(file.buffer, file.originalname, file.mimetype, 'DemoERP/banners')
    );
    const uploadResults = await Promise.all(uploadPromises);

    // Extract image URLs
    const imageUrls = uploadResults.map(result => result.url);

    res.status(200).json({
      success: true,
      message: `${req.files.length} image(s) uploaded successfully`,
      data: imageUrls,
      details: uploadResults.map(result => ({
        url: result.url,
        display_url: result.display_url,
        thumb_url: result.thumb_url,
        delete_hash: result.delete_hash
      }))
    });
  } catch (error) {
    console.error('Banner image upload error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to upload images',
      error: error.message
    });
  }
});

module.exports = {
  getBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  uploadBannerImages
};
