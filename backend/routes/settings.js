const express = require('express');
const { 
  getSettings,
  updateSettings,
  getModules,
  updateModules
} = require('../controllers/settingController');

const { protect, authorize } = require('../middleware/auth');


const router = express.Router();

router.route('/modules')
  .get(protect, getModules)
  .put(protect, authorize('Super Admin', 'Admin'), updateModules);

router.route('/')
  .get(protect, getSettings)
  .put(protect, authorize('Super Admin', 'Admin'), updateSettings);



module.exports = router;