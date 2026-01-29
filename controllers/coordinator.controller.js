const Coordinator = require('../models/coordinator.model');
const FieldManager = require('../models/fieldManager.model');
const DistrictCoordinator = require('../models/districtCoordinator.model');
const { encryptPassword, comparePassword } = require('../services/passwordService');
const { generateUserId, getNextSequenceNumber } = require('../services/userIdService');
const { generateToken } = require('../middleware/auth');
const { USER_ROLES } = require('../utils/constants');
const { processImage, getFileExtension } = require('../services/imageProcessingService');
const { uploadToS3 } = require('../services/awsS3Service');

/**
 * Coordinator Login
 */
const login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide identifier (email/mobile/userId) and password'
      });
    }

    const coordinator = await Coordinator.findOne({
      $or: [
        { email: identifier },
        { mobileNumber: identifier },
        { userId: identifier }
      ]
    }).populate('createdBy', 'userId firstName lastName email mobileNumber profilePicture');

    if (!coordinator) {
      return res.status(404).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    if (!coordinator.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    const isPasswordValid = comparePassword(password, coordinator.encryptedPassword);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const token = generateToken(coordinator);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          _id: coordinator._id,
          userId: coordinator.userId,
          email: coordinator.email,
          mobileNumber: coordinator.mobileNumber,
          firstName: coordinator.firstName,
          lastName: coordinator.lastName,
          role: coordinator.role,
          profilePicture: coordinator.profilePicture || null,
          district: coordinator.district,
          districtCoordinator: coordinator.createdBy // This is the District Coordinator who created this Coordinator
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
};

/**
 * Get Coordinator Profile
 */
const getProfile = async (req, res) => {
  try {
    const coordId = req.user.userId;

    const coordinator = await Coordinator.findById(coordId)
      .populate('districtRef', 'name description areaRange boundingBox centerPoint')
      .populate('createdBy', 'userId firstName lastName email mobileNumber profilePicture');

    if (!coordinator) {
      return res.status(404).json({
        success: false,
        message: 'Coordinator not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile retrieved successfully',
      data: {
        ...coordinator.toObject(),
        districtCoordinator: coordinator.createdBy
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving profile',
      error: error.message
    });
  }
};

/**
 * Update Coordinator Profile
 */
const updateProfile = async (req, res) => {
  try {
    const coordId = req.user.userId;
    const { firstName, lastName, email, mobileNumber, latitude, longitude } = req.body;

    const coordinator = await Coordinator.findById(coordId);
    if (!coordinator) {
      return res.status(404).json({
        success: false,
        message: 'Coordinator not found'
      });
    }

    // Update fields
    if (firstName) coordinator.firstName = firstName;
    if (lastName) coordinator.lastName = lastName;
    if (email) coordinator.email = email;
    if (mobileNumber) coordinator.mobileNumber = mobileNumber;
    if (latitude) coordinator.latitude = parseFloat(latitude);
    if (longitude) coordinator.longitude = parseFloat(longitude);

    // Handle profile picture upload if provided
    if (req.file) {
      try {
        const processedImage = await processImage(req.file.buffer);
        const fileExtension = getFileExtension(req.file.mimetype);
        const fileName = `coord-${Date.now()}.${fileExtension}`;
        coordinator.profilePicture = await uploadToS3(processedImage, fileName, req.file.mimetype);
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: 'Error processing profile picture',
          error: error.message
        });
      }
    }

    await coordinator.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: coordinator
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
};

/**
 * Create Field Manager (by Coordinator)
 */
const createFieldManager = async (req, res) => {
  try {
    const { email, mobileNumber, password, firstName, lastName, district } = req.body;
    const createdBy = req.user.userId;

    const existingUser = await FieldManager.findOne({
      $or: [{ email }, { mobileNumber }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Field Manager already exists with this email or mobile number'
      });
    }

    const count = await FieldManager.countDocuments();
    const sequenceNumber = getNextSequenceNumber(count);
    const userId = generateUserId(USER_ROLES.FIELD_MANAGER, sequenceNumber);

    const encryptedPassword = encryptPassword(password);

    const coordinator = await Coordinator.findById(createdBy);

    const fieldManager = new FieldManager({
      userId,
      email,
      mobileNumber,
      password: encryptedPassword,
      encryptedPassword: encryptedPassword,
      firstName,
      lastName,
      district,
      createdBy: coordinator._id
    });

    await fieldManager.save();

    res.status(201).json({
      success: true,
      message: 'Field Manager created successfully',
      data: {
        _id: fieldManager._id,
        userId: fieldManager.userId,
        email: fieldManager.email,
        mobileNumber: fieldManager.mobileNumber,
        firstName: fieldManager.firstName,
        lastName: fieldManager.lastName,
        district: fieldManager.district,
        role: fieldManager.role,
        createdBy: fieldManager.createdBy
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating field manager',
      error: error.message
    });
  }
};

/**
 * Get users related to coordinator
 * Returns the District Coordinator (parent)
 */
const getMyUsers = async (req, res) => {
  try {
    const coordId = req.user.userId;
    
    const coordinator = await Coordinator.findById(coordId)
      .populate('createdBy', 'userId firstName lastName email mobileNumber profilePicture district districtRef role');

    if (!coordinator) {
      return res.status(404).json({
        success: false,
        message: 'Coordinator not found'
      });
    }

    const districtCoordinator = coordinator.createdBy;

    res.json({
      success: true,
      message: 'Users retrieved successfully',
      data: [
        {
          _id: districtCoordinator._id,
          userId: districtCoordinator.userId,
          email: districtCoordinator.email,
          mobileNumber: districtCoordinator.mobileNumber,
          firstName: districtCoordinator.firstName,
          lastName: districtCoordinator.lastName,
          role: districtCoordinator.role,
          district: districtCoordinator.district || null,
          profilePicture: districtCoordinator.profilePicture || null
        }
      ],
      count: 1
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving users',
      error: error.message
    });
  }
};

/**
 * Get details of a specific user (Parent District Coordinator)
 */
const getUserDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const mongoose = require('mongoose');

    // Check if id is a valid MongoDB ObjectId
    const isValidObjectId = mongoose.Types.ObjectId.isValid(id);
    const searchQuery = isValidObjectId 
      ? { $or: [{ _id: id }, { userId: id }] }
      : { userId: id };

    // Coordinators can only view their parent District Coordinator
    const user = await DistrictCoordinator.findOne(searchQuery)
      .populate('districtRef', 'name description areaRange boundingBox centerPoint')
      .populate('createdBy', 'userId firstName lastName email mobileNumber');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found or you don't have permission to view this user"
      });
    }

    res.json({
      success: true,
      message: 'User details retrieved successfully',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving user details',
      error: error.message
    });
  }
};

module.exports = {
  login,
  getProfile,
  updateProfile,
  createFieldManager,
  getMyUsers,
  getUserDetails
};

