const mongoose = require('mongoose');

const PLAN_DURATIONS = {
  ONE_MONTH: '1_MONTH',
  THREE_MONTHS: '3_MONTHS',
  SIX_MONTHS: '6_MONTHS',
  ONE_YEAR: '1_YEAR'
};

const planSchema = new mongoose.Schema({
  subCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubCategory',
    required: true
  },
  duration: {
    type: String,
    required: true,
    enum: Object.values(PLAN_DURATIONS),
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    trim: true,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
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

// Compound index to ensure unique plan duration per subcategory
planSchema.index({ subCategory: 1, duration: 1 }, { unique: true });
planSchema.index({ subCategory: 1 });
planSchema.index({ duration: 1 });

planSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Plan', planSchema);
module.exports.PLAN_DURATIONS = PLAN_DURATIONS;

