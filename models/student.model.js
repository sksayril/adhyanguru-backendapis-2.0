const mongoose = require('mongoose');
const { USER_ROLES } = require('../utils/constants');

const studentSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    trim: true
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
  email: {
    type: String,
    default: null,
    lowercase: true,
    trim: true,
    sparse: true // Allows multiple null values but enforces uniqueness for non-null values
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
  profilePicture: {
    type: String,
    default: null,
    trim: true
  },
  mainCategories: [{
    mainCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MainCategory',
      required: true
    },
    subCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubCategory',
      required: true
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  latitude: {
    type: Number,
    default: null
  },
  longitude: {
    type: Number,
    default: null
  },
  address: {
    type: String,
    default: null,
    trim: true
  },
  pincode: {
    type: String,
    default: null,
    trim: true
  },
  fieldEmployeeCode: {
    type: String,
    default: null,
    trim: true
  },
  // Referral hierarchy - tracks the chain of users who benefit from this student
  referralHierarchy: {
    referringFieldEmployee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FieldEmployee',
      default: null
    },
    teamLeader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TeamLeader',
      default: null
    },
    districtCoordinator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DistrictCoordinator',
      default: null
    },
    coordinator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Coordinator',
      default: null
    },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null
    }
  },
  role: {
    type: String,
    default: USER_ROLES.STUDENT,
    immutable: true
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

// Indexes for efficient queries
studentSchema.index({ 'mainCategories.mainCategory': 1, 'mainCategories.subCategory': 1 });
studentSchema.index({ mobileNumber: 1 });
studentSchema.index({ email: 1 }, { sparse: true });
studentSchema.index({ fieldEmployeeCode: 1 });
studentSchema.index({ 'referralHierarchy.coordinator': 1 });
studentSchema.index({ 'referralHierarchy.districtCoordinator': 1 });
studentSchema.index({ 'referralHierarchy.teamLeader': 1 });
studentSchema.index({ 'referralHierarchy.referringFieldEmployee': 1 });
studentSchema.index({ 'referralHierarchy.coordinator': 1, createdAt: 1 });
studentSchema.index({ 'referralHierarchy.districtCoordinator': 1, createdAt: 1 });

studentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Student', studentSchema);

