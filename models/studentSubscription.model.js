const mongoose = require('mongoose');

const studentSubscriptionSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  plan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plan',
    required: true
  },
  subCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubCategory',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  duration: {
    type: String,
    required: true,
    enum: ['1_MONTH', '3_MONTHS', '6_MONTHS', '1_YEAR']
  },
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  paymentStatus: {
    type: String,
    enum: ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'],
    default: 'PENDING'
  },
  razorpayOrderId: {
    type: String,
    default: null
  },
  razorpayPaymentId: {
    type: String,
    default: null
  },
  razorpaySignature: {
    type: String,
    default: null
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
studentSubscriptionSchema.index({ student: 1, subCategory: 1 });
studentSubscriptionSchema.index({ student: 1, isActive: 1 });
studentSubscriptionSchema.index({ razorpayOrderId: 1 });
studentSubscriptionSchema.index({ paymentStatus: 1 });

// Method to check if subscription is valid
studentSubscriptionSchema.methods.isValid = function() {
  const now = new Date();
  return this.isActive && 
         this.paymentStatus === 'COMPLETED' && 
         this.endDate > now;
};

studentSubscriptionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('StudentSubscription', studentSubscriptionSchema);

