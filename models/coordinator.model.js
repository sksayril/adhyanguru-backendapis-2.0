const mongoose = require('mongoose');
const { USER_ROLES } = require('../utils/constants');

const coordinatorSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  mobileNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  encryptedPassword: {
    type: String,
    required: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  profilePicture: {
    type: String,
    default: null,
    trim: true
  },
  latitude: {
    type: Number,
    default: null
  },
  longitude: {
    type: Number,
    default: null
  },
  district: {
    type: String,
    required: false, // Keep for backward compatibility
    trim: true
  },
  // Reference to District model
  districtRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'District',
    default: null
  },
  // Area range for this coordinator (can be smaller than district)
  areaRange: {
    type: {
      type: String,
      enum: ['Polygon'],
      default: 'Polygon'
    },
    coordinates: {
      type: [[[Number]]],
      default: null
    }
  },
  // Alternative: Simple bounding box
  boundingBox: {
    minLatitude: {
      type: Number,
      default: null
    },
    maxLatitude: {
      type: Number,
      default: null
    },
    minLongitude: {
      type: Number,
      default: null
    },
    maxLongitude: {
      type: Number,
      default: null
    }
  },
  role: {
    type: String,
    default: USER_ROLES.COORDINATOR,
    immutable: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DistrictCoordinator',
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

// Index for geospatial queries
coordinatorSchema.index({ areaRange: '2dsphere' });
coordinatorSchema.index({ districtRef: 1 });

coordinatorSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Coordinator', coordinatorSchema);

