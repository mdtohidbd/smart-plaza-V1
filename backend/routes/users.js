const express = require('express');
const { 
  getUsers, 
  getUser,
  getUserPerformance,
  createUser, 
  updateUser, 
  deleteUser,
  updateUserPermissions,
  updateUserRole,
  approveUser
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permission');

const router = express.Router();

router.route('/')
  .get(protect, checkPermission('users', 'read'), getUsers)
  .post(protect, authorize('Super Admin', 'Admin'), createUser);

router.route('/:id')
  .get(protect, authorize('Super Admin', 'Admin'), getUser)
  .put(protect, authorize('Super Admin', 'Admin'), updateUser)
  .delete(protect, authorize('Super Admin', 'Admin'), deleteUser);

router.route('/:id/performance').get(protect, authorize('Super Admin', 'Admin'), getUserPerformance);
router.route('/:id/permissions').put(protect, authorize('Super Admin', 'Admin'), updateUserPermissions);
router.route('/:id/role').put(protect, authorize('Super Admin', 'Admin'), updateUserRole);
router.route('/:id/approve').put(protect, authorize('Super Admin', 'Admin'), approveUser);

module.exports = router;