const express = require('express');
const router = express.Router();
const { registerOnlineCustomer, loginOnlineCustomer } = require('../controllers/ecommerceAuthController');

router.post('/register', registerOnlineCustomer);
router.post('/login', loginOnlineCustomer);

module.exports = router;
