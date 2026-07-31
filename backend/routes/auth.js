const express = require('express');
const { registerUser, loginUser, getProfile, updateProfile, getDemoAccounts } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.route('/register').post(registerUser);
router.route('/login').post(loginUser);
router.route('/demo-accounts').get(getDemoAccounts);
router.route('/profile').get(protect, getProfile).put(protect, updateProfile);

module.exports = router;