const mongoose = require('mongoose');

const thumbnailSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  image: {
    type: String,
    required: true,
    trim: true // URL to S3
  },
  description: {
    type: String,
    default: null,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0,
    min: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SuperAdmin',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for efficient queries
thumbnailSchema.index({ title: 1 });
thumbnailSchema.index({ isActive: 1 });
thumbnailSchema.index({ order: 1 });
thumbnailSchema.index({ createdAt: -1 });

thumbnailSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Thumbnail', thumbnailSchema);
