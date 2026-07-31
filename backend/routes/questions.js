const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getAdminQuestions,
  answerQuestion,
  deleteQuestion
} = require('../controllers/questionController');

// All routes here are protected and restricted to Admin roles
router.use(protect);
router.use(authorize('Super Admin', 'Admin', 'E-Commerce Admin'));

router.route('/')
  .get(getAdminQuestions);

router.route('/:id')
  .patch(answerQuestion)
  .delete(deleteQuestion);

module.exports = router;
