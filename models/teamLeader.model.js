const mongoose = require('mongoose');
const { USER_ROLES } = require('../utils/constants');

const teamLeaderSchema = new mongoose.Schema({
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
    required: true,
    trim: true
  },
  // Reference to District model
  districtRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'District',
    default: null
  },
  // Area range for this team leader
  areaRange: {
    type: {
      type: String,
      enum: ['Polygon']
    },
    coordinates: {
      type: [[[Number]]]
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
    default: USER_ROLES.TEAM_LEADER,
    immutable: true
  },
  // Task levels assigned to this team leader
  taskLevels: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TaskLevel',
    default: []
  }],
  // District Coordinator who assigned this team leader (for splitting)
  assignedByDistrictCoordinator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DistrictCoordinator',
    default: null
  },
  // Field Employees assigned to this team leader (split/distribution)
  assignedFieldEmployees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FieldEmployee',
    default: []
  }],
  // Wallet balance for commissions
  wallet: {
    balance: {
      type: Number,
      default: 0,
      min: 0
    },
    totalEarned: {
      type: Number,
      default: 0,
      min: 0
    },
    totalWithdrawn: {
      type: Number,
      default: 0,
      min: 0
    }
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
    enum: ['FieldManager', 'DistrictCoordinator', 'Admin', 'SuperAdmin'],
    default: 'FieldManager'
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
teamLeaderSchema.index({ areaRange: '2dsphere' });
teamLeaderSchema.index({ districtRef: 1 });

teamLeaderSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('TeamLeader', teamLeaderSchema);

