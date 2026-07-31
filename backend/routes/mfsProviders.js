const express = require('express');
const {
  getMFSProviders,
  getMFSProvider,
  createMFSProvider,
  updateMFSProvider,
  deleteMFSProvider
} = require('../controllers/mfsProviderController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.route('/')
  .get(protect, getMFSProviders)
  .post(protect, authorize('Super Admin', 'Admin'), createMFSProvider);

router.route('/:id')
  .get(protect, getMFSProvider)
  .put(protect, authorize('Super Admin', 'Admin'), updateMFSProvider)
  .delete(protect, authorize('Super Admin', 'Admin'), deleteMFSProvider);

module.exports = router;
