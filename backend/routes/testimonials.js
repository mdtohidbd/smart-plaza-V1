const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const fileUpload = require('express-fileupload');
const {
  submitTestimonial,
  getApprovedTestimonials,
  getAllTestimonials,
  updateTestimonialStatus,
  updateTestimonial,
  adminCreateTestimonial,
  deleteTestimonial,
  uploadTestimonialImage,
  getTestimonialStats
} = require('../controllers/testimonialController');

// Apply file upload middleware
router.use(fileUpload());

// Public routes
// router.post('/', submitTestimonial);
router.get('/approved', getApprovedTestimonials);

// Admin routes
router.get('/admin/stats', protect, authorize('Super Admin', 'Admin', 'Super Admin Plus'), getTestimonialStats);
router.get('/admin', protect, authorize('Super Admin', 'Admin', 'Super Admin Plus'), getAllTestimonials);
// router.post('/admin', protect, authorize('Super Admin', 'Admin'), adminCreateTestimonial);
// router.put('/admin/:id', protect, authorize('Super Admin', 'Admin'), updateTestimonial);
// router.put('/admin/:id/status', protect, authorize('Super Admin', 'Admin'), updateTestimonialStatus);
// router.delete('/admin/:id', protect, authorize('Super Admin', 'Admin'), deleteTestimonial);
// router.post('/upload', protect, authorize('Super Admin', 'Admin'), uploadTestimonialImage);

module.exports = router;
