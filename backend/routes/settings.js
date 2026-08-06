const express = require('express');
const { 
  getSettings,
  updateSettings,
  getModules,
  updateModules
} = require('../controllers/settingController');

const { protect, optionalProtect, authorize } = require('../middleware/auth');

const router = express.Router();

router.route('/modules')
  .get(optionalProtect, getModules)
  .put(protect, authorize('Super Admin', 'Admin'), updateModules);

router.route('/')
  .get(optionalProtect, getSettings)
  .put(protect, authorize('Super Admin', 'Admin'), updateSettings);



module.exports = router;