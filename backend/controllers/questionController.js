const Question = require('../models/Question');
const Product = require('../models/Product');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');

// @desc    Get all published Q&As for a specific product
// @route   GET /api/public/products/:id/questions
// @access  Public
const getProductQuestions = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: 'Invalid product ID' });
  }

  const questions = await Question.find({ product: id, isPublished: true })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Question.countDocuments({ product: id, isPublished: true });

  res.status(200).json({
    success: true,
    count: questions.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: questions
  });
});

// @desc    Submit a question (guest/public)
// @route   POST /api/public/products/:id/questions
// @access  Public
const submitQuestion = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, email, question } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: 'Invalid product ID' });
  }

  const productExists = await Product.findById(id);
  if (!productExists) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  const newQuestion = await Question.create({
    product: id,
    name,
    email,
    question,
    isPublished: false // Hidden until answered
  });

  res.status(201).json({
    success: true,
    message: 'Question submitted successfully. It will be visible after it is answered.',
    data: newQuestion
  });
});

// @desc    Get all questions (for Admin panel)
// @route   GET /api/questions
// @access  Private/Admin
const getAdminQuestions = asyncHandler(async (req, res) => {
  const { isAnswered, search } = req.query;
  const filter = {};

  if (isAnswered === 'true') {
    filter.answer = { $exists: true, $ne: '' };
  } else if (isAnswered === 'false') {
    filter.$or = [
      { answer: { $exists: false } },
      { answer: '' }
    ];
  }

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { question: { $regex: search, $options: 'i' } },
      { answer: { $regex: search, $options: 'i' } }
    ];
  }

  const questions = await Question.find(filter)
    .populate('product', 'name sku image sellingPrice')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: questions.length,
    data: questions
  });
});

// @desc    Answer / publish a question
// @route   PATCH /api/questions/:id
// @access  Private/Admin
const answerQuestion = asyncHandler(async (req, res) => {
  const { answer, isPublished } = req.body;
  const { id } = req.params;

  const question = await Question.findById(id);
  if (!question) {
    return res.status(404).json({ success: false, message: 'Question not found' });
  }

  question.answer = answer;
  question.answeredBy = req.user ? req.user._id : null;
  question.answeredAt = new Date();
  
  // If isPublished is explicitly provided, use it, otherwise default to true since it has an answer
  question.isPublished = isPublished !== undefined ? isPublished : true;

  await question.save();

  res.status(200).json({
    success: true,
    message: 'Question successfully answered and updated',
    data: question
  });
});

// @desc    Delete a question
// @route   DELETE /api/questions/:id
// @access  Private/Admin
const deleteQuestion = asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id);

  if (!question) {
    return res.status(404).json({ success: false, message: 'Question not found' });
  }

  await question.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Question successfully deleted',
    data: {}
  });
});

module.exports = {
  getProductQuestions,
  submitQuestion,
  getAdminQuestions,
  answerQuestion,
  deleteQuestion
};
