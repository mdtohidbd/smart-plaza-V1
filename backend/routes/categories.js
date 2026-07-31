const express = require('express');
const { 
  getCategories, 
  getCategory, 
  createCategory, 
  updateCategory, 
  deleteCategory
} = require('../controllers/categoryController');
const { protect, authorize } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permission');

const router = express.Router();

router.route('/')
  .get(protect, checkPermission('products', 'read'), getCategories)
  .post(protect, checkPermission('products', 'create'), createCategory);

router.route('/:id')
  .get(protect, checkPermission('products', 'read'), getCategory)
  .put(protect, checkPermission('products', 'update'), updateCategory)
  .delete(protect, checkPermission('products', 'delete'), deleteCategory);

module.exports = router;