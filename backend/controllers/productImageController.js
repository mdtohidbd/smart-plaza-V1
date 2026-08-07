const Product = require('../models/Product');
const asyncHandler = require('express-async-handler');
const { uploadImage } = require('../utils/imageUpload');

// @desc    Upload product images
// @route   POST /api/products/:id/images
// @access  Private
const uploadProductImages = asyncHandler(async (req, res) => {
  const productId = req.params.id;
  
  // Find the product
  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }

  // Check if files are provided
  if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No files uploaded'
    });
  }

  // Enforce max 5 images total limit
  const currentTotal = product.images?.length > 0 ? product.images.length : (product.image ? 1 : 0);
  if (currentTotal + req.files.length > 5) {
    return res.status(400).json({
      success: false,
      message: `Cannot upload more than 5 images per product. You currently have ${currentTotal} images.`
    });
  }

  try {
    // Upload each image
    const uploadPromises = req.files.map(file => 
      uploadImage(file.buffer, file.originalname, file.mimetype, 'DemoERP/products')
    );
    const uploadResults = await Promise.all(uploadPromises);
    
    // Extract image URLs
    const imageUrls = uploadResults.map(result => result.url);
    
    // If this is the first image, set it as the primary image as well
    if (!product.image && imageUrls.length > 0) {
      product.image = imageUrls[0];
    }
    
    // Add new images to existing images array
    product.images = [...new Set([...product.images, ...imageUrls])]; // Avoid duplicates
    
    await product.save();

    res.status(200).json({
      success: true,
      data: product,
      message: `${req.files.length} image(s) uploaded successfully`,
      uploadedImages: uploadResults.map(result => ({
        url: result.url,
        display_url: result.display_url,
        thumb_url: result.thumb_url,
        delete_hash: result.delete_hash
      }))
    });
  } catch (error) {
    console.error('Image upload error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to upload images',
      error: error.message
    });
  }
});

// @desc    Set primary image for product
// @route   PUT /api/products/:id/primary-image
// @access  Private
const setPrimaryImage = asyncHandler(async (req, res) => {
  const { imageUrl } = req.body;
  const productId = req.params.id;
  
  // Find the product
  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }

  // Check if the image exists in the product's images array
  if (!product.images.includes(imageUrl)) {
    return res.status(400).json({
      success: false,
      message: 'Image not found in product images'
    });
  }

  // Set the primary image
  product.image = imageUrl;
  await product.save();

  res.status(200).json({
    success: true,
    data: product,
    message: 'Primary image updated successfully'
  });
});

// @desc    Remove image from product
// @route   DELETE /api/products/:id/images
// @access  Private
const removeProductImage = asyncHandler(async (req, res) => {
  const { imageUrl } = req.body;
  const productId = req.params.id;
  
  // Find the product
  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }

  // Remove the image from the images array
  product.images = product.images.filter(img => img !== imageUrl);
  
  // If the removed image was the primary image, set a new primary image
  if (product.image === imageUrl && product.images.length > 0) {
    product.image = product.images[0];
  } else if (product.image === imageUrl && product.images.length === 0) {
    product.image = '';
  }
  
  await product.save();

  res.status(200).json({
    success: true,
    data: product,
    message: 'Image removed successfully'
  });
});

module.exports = {
  uploadProductImages,
  setPrimaryImage,
  removeProductImage
};
