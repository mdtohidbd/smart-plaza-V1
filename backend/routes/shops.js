const express = require('express');
const router = express.Router();
const {
  getShops,
  createShop,
  updateShop,
  deleteShop,
  switchShop
} = require('../controllers/shopController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getShops)
  .post(authorize('Super Admin', 'Admin'), createShop);

router.post('/switch', switchShop);

router.route('/:id')
  .put(authorize('Super Admin', 'Admin'), updateShop)
  .delete(authorize('Super Admin'), deleteShop);

module.exports = router;
