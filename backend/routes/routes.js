const express = require('express');
const {
  getRoutes,
  getRoute,
  createRoute,
  updateRoute,
  deleteRoute
} = require('../controllers/routeController');
const { protect, authorize } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permission');
const router = express.Router();

router.route('/')
  .get(protect, checkPermission('settings', 'read'), getRoutes)
  .post(protect, checkPermission('settings', 'create'), createRoute);

router.route('/:id')
  .get(protect, checkPermission('settings', 'read'), getRoute)
  .put(protect, checkPermission('settings', 'update'), updateRoute)
  .delete(protect, checkPermission('settings', 'delete'), deleteRoute);

module.exports = router;
