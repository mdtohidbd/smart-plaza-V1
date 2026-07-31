const express = require('express');
const path = require('path');
const router = express.Router();

const { getProductReviews, submitReview } = require('../controllers/reviewController');
const { getProductQuestions, submitQuestion } = require('../controllers/questionController');
const {
  getPublicBanners,
  getPublicBrands,
  getRelatedProducts,
  getPublicProductById,
  getPublicProducts,
  getPublicCategories,
  getApprovedTestimonials,
  getLogo
} = require('../controllers/publicController');

// Banners & Brands
router.get('/banners', getPublicBanners);
router.get('/brands', getPublicBrands);

// Products
router.get('/products/:id/related', getRelatedProducts);
router.get('/products/:id/reviews', getProductReviews);
router.post('/products/:id/reviews', submitReview);
router.get('/products/:id/questions', getProductQuestions);
router.post('/products/:id/questions', submitQuestion);
router.get('/products/:id', getPublicProductById);
router.get('/products', getPublicProducts);

// Categories
router.get('/categories', getPublicCategories);

// Testimonials
router.get('/testimonials/approved', getApprovedTestimonials);

// Serve Logo
router.get('/logo', getLogo);

// Serve any other static files from the public folder
router.use('/', express.static(path.join(__dirname, '..', 'public')));

module.exports = router;