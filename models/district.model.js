const mongoose = require('mongoose');

const districtSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    default: null,
    trim: true
  },
  // Area range - boundaries (polygon coordinates)
  // Format: [[[lng, lat], [lng, lat], ...]] - GeoJSON Polygon format
  areaRange: {
    type: {
      type: String,
      enum: ['Polygon'],
      default: 'Polygon'
    },
    coordinates: {
      type: [[[Number]]], // Array of coordinate arrays
      required: true
    }
  },
  // Alternative: Simple bounding box (min/max lat/lng)
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
  // Assigned District Coordinator
  districtCoordinator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DistrictCoordinator',
    default: null
  },
  // Center point of the district
  centerPoint: {
    latitude: {
      type: Number,
      default: null
    },
    longitude: {
      type: Number,
      default: null
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
    enum: ['Admin', 'SuperAdmin'],
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
districtSchema.index({ areaRange: '2dsphere' });
districtSchema.index({ name: 1 });
districtSchema.index({ districtCoordinator: 1 });
districtSchema.index({ isActive: 1 });

districtSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('District', districtSchema);

