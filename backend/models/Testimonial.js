const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: [true, 'Rating is required']
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  imageUrl: {
    type: String,
    trim: true
  },
  designation: {
    type: String,
    trim: true
  },
  company: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  product: {
    type: String,
    trim: true
  },
  productRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  purchasedDate: {
    type: Date
  },
  verified: {
    type: Boolean,
    default: false
  },
  recommend: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for faster queries
testimonialSchema.index({ status: 1, createdAt: -1 });
testimonialSchema.index({ rating: 1 });

module.exports = mongoose.model('Testimonial', testimonialSchema);
