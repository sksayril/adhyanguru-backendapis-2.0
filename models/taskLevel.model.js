const mongoose = require('mongoose');

const taskLevelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  description: {
    type: String,
    trim: true,
    default: null
  },
  level: {
    type: Number,
    required: true,
    unique: true,
    min: 1
  },
  // Registration limit for this task level (how many users can register)
  registrationLimit: {
    type: Number,
    default: 0, // 0 means unlimited
    min: 0
  },
  // Global count of users registered for this task level (across all coordinators)
  globalRegistrationCount: {
    type: Number,
    default: 0,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'createdByModel',
    required: true
  },
  createdByModel: {
    type: String,
    enum: ['Admin', 'SuperAdmin'],
    default: 'Admin'
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

taskLevelSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for efficient queries
taskLevelSchema.index({ level: 1 });
taskLevelSchema.index({ isActive: 1 });

module.exports = mongoose.model('TaskLevel', taskLevelSchema);
