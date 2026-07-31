const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: false
  },
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    unique: true,
    maxlength: [50, 'Category name cannot exceed 50 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  icon: {
    type: String,
    default: 'Computer'
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  features: [{
    title: String,
    description: String,
    image: String,
    layout: {
      type: String,
      enum: ['left', 'right'],
      default: 'left'
    }
  }],
  highlights: [String],
  highlightImages: [String]
}, {
  timestamps: true
});

module.exports = mongoose.model('Category', categorySchema);