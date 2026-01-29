const mongoose = require('mongoose');

const commissionSettingsSchema = new mongoose.Schema({
  // Commission percentages (0-100)
  coordinatorPercentage: {
    type: Number,
    required: true,
    default: 40,
    min: 0,
    max: 100
  },
  districtCoordinatorPercentage: {
    type: Number,
    required: true,
    default: 10,
    min: 0,
    max: 100
  },
  teamLeaderPercentage: {
    type: Number,
    required: true,
    default: 10,
    min: 0,
    max: 100
  },
  fieldEmployeePercentage: {
    type: Number,
    required: true,
    default: 10,
    min: 0,
    max: 100
  },
  // Who last updated these settings
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'updatedByModel',
    required: true
  },
  updatedByModel: {
    type: String,
    enum: ['SuperAdmin', 'Admin'],
    default: 'SuperAdmin'
  },
  isActive: {
    type: Boolean,
    default: true
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

// Ensure only one active settings document exists
commissionSettingsSchema.index({ isActive: 1 }, { unique: true, partialFilterExpression: { isActive: true } });

commissionSettingsSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('CommissionSettings', commissionSettingsSchema);
