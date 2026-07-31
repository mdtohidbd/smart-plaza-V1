const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getAdminReviews,
  updateReviewStatus,
  deleteReview
} = require('../controllers/reviewController');

// All routes here are protected and restricted to Admin roles
router.use(protect);
router.use(authorize('Super Admin', 'Admin', 'E-Commerce Admin', 'Super Admin Plus'));

router.route('/')
  .get(getAdminReviews);

router.route('/:id')
  .patch(updateReviewStatus)
  .delete(deleteReview);

module.exports = router;
