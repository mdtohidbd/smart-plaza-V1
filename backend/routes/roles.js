const express = require('express');
const { 
  getRoles,
  getRole, 
  createRole, 
  updateRole, 
  deleteRole
} = require('../controllers/roleController');
const { protect, authorize } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permission');

const router = express.Router();

router.route('/')
  .get(protect, checkPermission('users', 'read'), getRoles)
  .post(protect, checkPermission('users', 'create'), createRole);

router.route('/:id')
  .get(protect, checkPermission('users', 'read'), getRole)
  .put(protect, checkPermission('users', 'update'), updateRole)
  .delete(protect, checkPermission('users', 'delete'), deleteRole);

module.exports = router;