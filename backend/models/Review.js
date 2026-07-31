const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product is required']
  },
  name: {
    type: String,
    required: [true, 'Reviewer name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Reviewer email is required'],
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // For future reference if they log in
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: [true, 'Rating is required']
  },
  comment: {
    type: String,
    required: [true, 'Comment is required'],
    trim: true,
    maxlength: [2000, 'Comment cannot exceed 2000 characters']
  },
  images: [{
    type: String // Optional review images
  }],
  isVerified: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
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

// Indexes for fast querying
reviewSchema.index({ product: 1, status: 1, createdAt: -1 });
reviewSchema.index({ rating: 1 });

// Static method to get avg rating of a product and save it in Product model
reviewSchema.statics.calcAverageRating = async function(productId) {
  const stats = await this.aggregate([
    {
      $match: { product: productId, status: 'approved' }
    },
    {
      $group: {
        _id: '$product',
        nRatings: { $sum: 1 },
        avgRating: { $avg: '$rating' }
      }
    }
  ]);

  if (stats.length > 0) {
    await mongoose.model('Product').findByIdAndUpdate(productId, {
      numOfReviews: stats[0].nRatings,
      averageRating: Math.round(stats[0].avgRating * 10) / 10 // Round to 1 decimal place
    });
  } else {
    await mongoose.model('Product').findByIdAndUpdate(productId, {
      numOfReviews: 0,
      averageRating: 0
    });
  }
};

// Call calcAverageRating after save
reviewSchema.post('save', function() {
  // this points to current review
  this.constructor.calcAverageRating(this.product);
});

// Call calcAverageRating before remove/deleteOne
reviewSchema.post('deleteOne', { document: true, query: false }, function() {
  this.constructor.calcAverageRating(this.product);
});

module.exports = mongoose.model('Review', reviewSchema);
