const Testimonial = require('../models/Testimonial');
const asyncHandler = require('express-async-handler');
const cloudinary = require('cloudinary').v2;

// @desc    Submit testimonial (public/user)
// @route   POST /api/testimonials
// @access  Public
const submitTestimonial = asyncHandler(async (req, res) => {
  const { name, email, phone, rating, message, imageUrl, designation, company, location, product, productRef, purchasedDate } = req.body;

  // Validate required fields
  if (!name || !email || !rating || !message) {
    return res.status(400).json({
      success: false,
      message: 'Name, email, rating, and message are required'
    });
  }

  // Create testimonial
  const testimonial = await Testimonial.create({
    name,
    email,
    phone,
    rating,
    message,
    imageUrl,
    designation,
    company,
    location,
    product,
    productRef,
    purchasedDate,
    submittedBy: req.user ? req.user._id : null,
    status: 'pending' // Default to pending for user submissions
  });

  res.status(201).json({
    success: true,
    message: 'Testimonial submitted successfully! It will appear after admin approval.',
    data: testimonial
  });
});

// @desc    Get approved testimonials (public)
// @route   GET /api/testimonials/approved
// @access  Public
const getApprovedTestimonials = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, rating, product } = req.query;

  const query = { status: 'approved' };
  
  if (rating) query.rating = parseInt(rating);
  if (product) query.product = product;

  const testimonials = await Testimonial.find(query)
    .sort({ createdAt: -1, verified: -1 })
    .populate('submittedBy', 'name email')
    .populate('productRef', 'name image')
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const count = await Testimonial.countDocuments(query);

  res.status(200).json({
    success: true,
    count: testimonials.length,
    totalPages: Math.ceil(count / limit),
    currentPage: page,
    data: testimonials
  });
});

// @desc    Get all testimonials (admin only)
// @route   GET /api/testimonials/admin
// @access  Private/Admin
const getAllTestimonials = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, rating, search } = req.query;

  const query = {};
  
  if (status) query.status = status;
  if (rating) query.rating = parseInt(rating);
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { company: { $regex: search, $options: 'i' } },
      { product: { $regex: search, $options: 'i' } }
    ];
  }

  const testimonials = await Testimonial.find(query)
    .sort({ createdAt: -1 })
    .populate('submittedBy', 'name email phone')
    .populate('approvedBy', 'name email')
    .populate('productRef', 'name image')
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const count = await Testimonial.countDocuments(query);

  res.status(200).json({
    success: true,
    count: testimonials.length,
    totalPages: Math.ceil(count / limit),
    currentPage: page,
    total: count,
    data: testimonials
  });
});

// @desc    Approve/reject testimonial (admin only)
// @route   PUT /api/testimonials/admin/:id/status
// @access  Private/Admin
const updateTestimonialStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['pending', 'approved', 'rejected'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid status value'
    });
  }

  const updateData = {
    status,
    approvedBy: req.user._id
  };

  if (status === 'approved') {
    updateData.approvedAt = new Date();
    updateData.verified = true;
  }

  const testimonial = await Testimonial.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  ).populate('approvedBy', 'name email');

  if (!testimonial) {
    return res.status(404).json({
      success: false,
      message: 'Testimonial not found'
    });
  }

  res.status(200).json({
    success: true,
    message: `Testimonial ${status} successfully`,
    data: testimonial
  });
});

// @desc    Update testimonial content (admin only)
// @route   PUT /api/testimonials/admin/:id
// @access  Private/Admin
const updateTestimonial = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const allowedFields = ['name', 'email', 'phone', 'rating', 'message', 'imageUrl', 'designation', 'company', 'location', 'product', 'productRef', 'purchasedDate', 'verified', 'recommend'];
  
  const updateData = {};
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  });

  const testimonial = await Testimonial.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  );

  if (!testimonial) {
    return res.status(404).json({
      success: false,
      message: 'Testimonial not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Testimonial updated successfully',
    data: testimonial
  });
});

// @desc    Create testimonial as admin (auto-approved)
// @route   POST /api/testimonials/admin
// @access  Private/Admin
const adminCreateTestimonial = asyncHandler(async (req, res) => {
  const { name, email, phone, rating, message, imageUrl, designation, company, location, product, productRef, purchasedDate, verified, recommend } = req.body;

  if (!name || !email || !rating || !message) {
    return res.status(400).json({
      success: false,
      message: 'Name, email, rating, and message are required'
    });
  }

  const testimonial = await Testimonial.create({
    name,
    email,
    phone,
    rating,
    message,
    imageUrl,
    designation,
    company,
    location,
    product,
    productRef,
    purchasedDate,
    verified: verified !== undefined ? verified : true,
    recommend: recommend !== undefined ? recommend : true,
    status: 'approved', // Auto-approved for admin creation
    approvedBy: req.user._id,
    approvedAt: new Date(),
    submittedBy: req.user._id
  });

  res.status(201).json({
    success: true,
    message: 'Testimonial created successfully',
    data: testimonial
  });
});

// @desc    Delete testimonial (admin only)
// @route   DELETE /api/testimonials/admin/:id
// @access  Private/Admin
const deleteTestimonial = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const testimonial = await Testimonial.findByIdAndDelete(id);

  if (!testimonial) {
    return res.status(404).json({
      success: false,
      message: 'Testimonial not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Testimonial deleted successfully'
  });
});

// @desc    Upload testimonial image
// @route   POST /api/testimonials/upload
// @access  Private/Admin
const uploadTestimonialImage = asyncHandler(async (req, res) => {
  if (!req.files || !req.files.image) {
    return res.status(400).json({
      success: false,
      message: 'No image file uploaded'
    });
  }

  const file = req.files.image;
  
  // Upload to cloudinary
  const result = await cloudinary.uploader.upload(file.tempFilePath, {
    folder: 'DemoERP/testimonials',
    transformation: [
      { width: 400, height: 400, crop: 'fill', gravity: 'face' },
      { quality: 'auto:good' }
    ]
  });

  res.status(200).json({
    success: true,
    url: result.secure_url,
    public_id: result.public_id
  });
});

// @desc    Get testimonial statistics (admin only)
// @route   GET /api/testimonials/admin/stats
// @access  Private/Admin
const getTestimonialStats = asyncHandler(async (req, res) => {
  const stats = await Testimonial.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const averageRating = await Testimonial.aggregate([
    {
      $group: {
        _id: null,
        avgRating: { $avg: '$rating' }
      }
    }
  ]);

  const totalTestimonials = await Testimonial.countDocuments();
  const approvedCount = await Testimonial.countDocuments({ status: 'approved' });
  const pendingCount = await Testimonial.countDocuments({ status: 'pending' });
  const rejectedCount = await Testimonial.countDocuments({ status: 'rejected' });

  res.status(200).json({
    success: true,
    data: {
      total: totalTestimonials,
      approved: approvedCount,
      pending: pendingCount,
      rejected: rejectedCount,
      averageRating: averageRating[0]?.avgRating?.toFixed(1) || 0,
      breakdown: stats
    }
  });
});

module.exports = {
  submitTestimonial,
  getApprovedTestimonials,
  getAllTestimonials,
  updateTestimonialStatus,
  updateTestimonial,
  adminCreateTestimonial,
  deleteTestimonial,
  uploadTestimonialImage,
  getTestimonialStats
};
