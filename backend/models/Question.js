const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product is required']
  },
  name: {
    type: String,
    required: [true, 'Asker name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Asker email is required'],
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // For future reference if they log in
  },
  question: {
    type: String,
    required: [true, 'Question is required'],
    trim: true,
    maxlength: [1000, 'Question cannot exceed 1000 characters']
  },
  answer: {
    type: String,
    trim: true,
    maxlength: [2000, 'Answer cannot exceed 2000 characters']
  },
  answeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  answeredAt: {
    type: Date
  },
  isPublished: {
    type: Boolean,
    default: false // Only becomes visible on storefront once answered
  }
}, {
  timestamps: true
});

// Indexes for fast querying
questionSchema.index({ product: 1, isPublished: 1, createdAt: -1 });

module.exports = mongoose.model('Question', questionSchema);
