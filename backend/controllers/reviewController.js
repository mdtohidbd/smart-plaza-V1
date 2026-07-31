const Review = require('../models/Review');
const Product = require('../models/Product');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');

// @desc    Get all approved reviews for a specific product
// @route   GET /api/public/products/:id/reviews
// @access  Public
const getProductReviews = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: 'Invalid product ID' });
  }

  // Get reviews
  const reviews = await Review.find({ product: id, status: 'approved' })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Review.countDocuments({ product: id, status: 'approved' });

  // Calculate rating stats breakdown
  const stats = await Review.aggregate([
    {
      $match: { product: new mongoose.Types.ObjectId(id), status: 'approved' }
    },
    {
      $group: {
        _id: '$rating',
        count: { $sum: 1 }
      }
    }
  ]);

  // Format star breakdown [5, 4, 3, 2, 1]
  const ratingBreakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let totalRatings = 0;
  let sumRatings = 0;

  stats.forEach(stat => {
    ratingBreakdown[stat._id] = stat.count;
    totalRatings += stat.count;
    sumRatings += (stat._id * stat.count);
  });

  const averageRating = totalRatings > 0 ? Math.round((sumRatings / totalRatings) * 10) / 10 : 0;

  res.status(200).json({
    success: true,
    count: reviews.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    stats: {
      averageRating,
      totalReviews: totalRatings,
      breakdown: ratingBreakdown
    },
    data: reviews
  });
});

// @desc    Submit a review (guest/public)
// @route   POST /api/public/products/:id/reviews
// @access  Public
const submitReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, email, rating, comment, images } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: 'Invalid product ID' });
  }

  const productExists = await Product.findById(id);
  if (!productExists) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  // Check if it's a verified purchase
  let isVerified = false;
  
  try {
    // 1. Check direct matches in SaleOrder where customerEmail matches
    const saleOrderMatch = await mongoose.model('SaleOrder').findOne({
      customerEmail: { $regex: new RegExp(`^${email}$`, 'i') },
      'items.product': id,
      status: { $in: ['Delivered', 'Approved', 'Shipped', 'Out for Delivery'] }
    });

    if (saleOrderMatch) {
      isVerified = true;
    } else {
      // 2. Check direct matches in Sale where customerEmail matches
      const saleMatch = await mongoose.model('Sale').findOne({
        customerEmail: { $regex: new RegExp(`^${email}$`, 'i') },
        'items.product': id
      });

      if (saleMatch) {
        isVerified = true;
      } else {
        // 3. Find Customer by email, then check if they have Sales/SaleOrders
        const customer = await mongoose.model('Customer').findOne({
          email: { $regex: new RegExp(`^${email}$`, 'i') }
        });

        if (customer) {
          const customerSaleOrder = await mongoose.model('SaleOrder').findOne({
            customer: customer._id,
            'items.product': id,
            status: { $in: ['Delivered', 'Approved', 'Shipped', 'Out for Delivery'] }
          });

          if (customerSaleOrder) {
            isVerified = true;
          } else {
            const customerSale = await mongoose.model('Sale').findOne({
              customer: customer._id,
              'items.product': id
            });

            if (customerSale) {
              isVerified = true;
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error verifying purchase:', error);
    // Continue with review creation even if verification check fails
  }

  // Create review
  const review = await Review.create({
    product: id,
    name,
    email,
    rating: parseInt(rating, 10),
    comment,
    images: images || [],
    isVerified,
    status: 'approved' // Auto-approve reviews since there is no admin panel UI for approval (this UI is being built now, but default to approved for backward compatibility or pending based on pref. Let's keep it approved to not break current flow, admin can change it)
  });

  res.status(201).json({
    success: true,
    message: 'Review submitted successfully. Thank you for your feedback.',
    data: review
  });
});

// @desc    Get all reviews (for Admin panel)
// @route   GET /api/reviews
// @access  Private/Admin
const getAdminReviews = asyncHandler(async (req, res) => {
  const { status, rating, search } = req.query;
  const filter = {};

  if (status) filter.status = status;
  if (rating) filter.rating = parseInt(rating, 10);
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { comment: { $regex: search, $options: 'i' } }
    ];
  }

  const reviews = await Review.find(filter)
    .populate('product', 'name sku image sellingPrice')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: reviews.length,
    data: reviews
  });
});

// @desc    Update review status (approve/reject)
// @route   PATCH /api/reviews/:id
// @access  Private/Admin
const updateReviewStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const { id } = req.params;

  if (!['approved', 'rejected', 'pending'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status' });
  }

  const review = await Review.findById(id);
  if (!review) {
    return res.status(404).json({ success: false, message: 'Review not found' });
  }

  review.status = status;
  review.approvedBy = req.user ? req.user._id : null;
  review.approvedAt = status === 'approved' ? new Date() : null;
  
  await review.save(); // Using review.save() triggers calcAverageRating middleware

  res.status(200).json({
    success: true,
    message: `Review successfully updated to ${status}`,
    data: review
  });
});

// @desc    Delete a review
// @route   DELETE /api/reviews/:id
// @access  Private/Admin
const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  
  if (!review) {
    return res.status(404).json({ success: false, message: 'Review not found' });
  }

  await review.deleteOne(); // Triggers calcAverageRating middleware

  res.status(200).json({
    success: true,
    message: 'Review successfully deleted',
    data: {}
  });
});

module.exports = {
  getProductReviews,
  submitReview,
  getAdminReviews,
  updateReviewStatus,
  deleteReview
};
