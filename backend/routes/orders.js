const express = require('express');
const router = express.Router();
const { protect, optionalProtect } = require('../middleware/auth');
const { createEcommerceOrder } = require('../controllers/orderController');

// E-commerce order routes - Public endpoint (works with or without auth)
router.route('/')
  .post(optionalProtect, createEcommerceOrder); // Handles auth internally for guest checkout

module.exports = router;
