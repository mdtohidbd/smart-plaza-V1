const express = require('express');
const {
  getOffers,
  getOfferById,
  createOffer,
  updateOffer,
  deleteOffer
} = require('../controllers/offerController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.route('/')
  .get(getOffers)
  .post(protect, authorize('admin', 'owner', 'Super Admin'), createOffer);

router.route('/:id')
  .get(protect, authorize('admin', 'owner', 'Super Admin', 'Super Admin Plus'), getOfferById)
  .put(protect, authorize('admin', 'owner', 'Super Admin'), updateOffer)
  .delete(protect, authorize('admin', 'owner', 'Super Admin'), deleteOffer);

module.exports = router;
