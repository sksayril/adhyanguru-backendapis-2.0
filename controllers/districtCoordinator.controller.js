const DistrictCoordinator = require('../models/districtCoordinator.model');
const Coordinator = require('../models/coordinator.model');
const TeamLeader = require('../models/teamLeader.model');
const { encryptPassword, decryptPassword, comparePassword } = require('../services/passwordService');
const { generateUserId, getNextSequenceNumber } = require('../services/userIdService');
const { generateToken } = require('../middleware/auth');
const { USER_ROLES } = require('../utils/constants');
const { processImage, getFileExtension } = require('../services/imageProcessingService');
const { uploadToS3 } = require('../services/awsS3Service');

/**
 * District Coordinator Login
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

    const districtCoordinator = await DistrictCoordinator.findOne({
      $or: [
        { email: identifier },
        { mobileNumber: identifier },
        { userId: identifier }
      ]
    }).populate('createdBy', 'userId firstName lastName email mobileNumber profilePicture');

    if (!districtCoordinator) {
      return res.status(404).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    if (!districtCoordinator.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    const isPasswordValid = comparePassword(password, districtCoordinator.encryptedPassword);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const token = generateToken(districtCoordinator);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          _id: districtCoordinator._id,
          userId: districtCoordinator.userId,
          email: districtCoordinator.email,
          mobileNumber: districtCoordinator.mobileNumber,
          firstName: districtCoordinator.firstName,
          lastName: districtCoordinator.lastName,
          role: districtCoordinator.role,
          profilePicture: districtCoordinator.profilePicture || null,
          district: districtCoordinator.district,
          admin: districtCoordinator.createdBy // This is the Admin who created this DC
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
 * Get District Coordinator Profile
 */
const getProfile = async (req, res) => {
  try {
    const dcId = req.user.userId;

    const districtCoordinator = await DistrictCoordinator.findById(dcId)
      .populate('districtRef', 'name description areaRange boundingBox centerPoint')
      .populate('createdBy', 'userId firstName lastName email mobileNumber profilePicture');

    if (!districtCoordinator) {
      return res.status(404).json({
        success: false,
        message: 'District Coordinator not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile retrieved successfully',
      data: {
        ...districtCoordinator.toObject(),
        admin: districtCoordinator.createdBy
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
 * Update District Coordinator Profile
 */
const updateProfile = async (req, res) => {
  try {
    const dcId = req.user.userId;
    const { firstName, lastName, email, mobileNumber, latitude, longitude } = req.body;

    const districtCoordinator = await DistrictCoordinator.findById(dcId);
    if (!districtCoordinator) {
      return res.status(404).json({
        success: false,
        message: 'District Coordinator not found'
      });
    }

    // Update fields
    if (firstName) districtCoordinator.firstName = firstName;
    if (lastName) districtCoordinator.lastName = lastName;
    if (email) districtCoordinator.email = email;
    if (mobileNumber) districtCoordinator.mobileNumber = mobileNumber;
    if (latitude) districtCoordinator.latitude = parseFloat(latitude);
    if (longitude) districtCoordinator.longitude = parseFloat(longitude);

    // Handle profile picture upload if provided
    if (req.file) {
      try {
        const processedImage = await processImage(req.file.buffer);
        const fileExtension = getFileExtension(req.file.mimetype);
        const fileName = `dc-${Date.now()}.${fileExtension}`;
        districtCoordinator.profilePicture = await uploadToS3(processedImage, fileName, req.file.mimetype);
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: 'Error processing profile picture',
          error: error.message
        });
      }
    }

    await districtCoordinator.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: districtCoordinator
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
 * Create Team Leader (by District Coordinator)
 */
const createTeamLeader = async (req, res) => {
  try {
    const { 
      email, 
      mobileNumber, 
      password, 
      firstName, 
      lastName, 
      district,
      areaRange,
      boundingBox,
      latitude,
      longitude
    } = req.body;
    const createdBy = req.user.userId;

    const existingUser = await TeamLeader.findOne({
      $or: [{ email }, { mobileNumber }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Team Leader already exists with this email or mobile number'
      });
    }

    const count = await TeamLeader.countDocuments();
    const sequenceNumber = getNextSequenceNumber(count);
    const userId = generateUserId(USER_ROLES.TEAM_LEADER, sequenceNumber);

    const encryptedPassword = encryptPassword(password);

    const dc = await DistrictCoordinator.findById(createdBy);
    if (!dc) {
      return res.status(404).json({
        success: false,
        message: 'District Coordinator not found'
      });
    }

    // Parse areaRange and boundingBox if they are strings (from multipart/form-data)
    let parsedAreaRange = areaRange;
    let parsedBoundingBox = boundingBox;

    if (typeof areaRange === 'string') {
      try {
        parsedAreaRange = JSON.parse(areaRange);
      } catch (e) {
        // Keep as is if not valid JSON
      }
    }

    if (typeof boundingBox === 'string') {
      try {
        parsedBoundingBox = JSON.parse(boundingBox);
      } catch (e) {
        // Keep as is if not valid JSON
      }
    }

    const teamLeader = new TeamLeader({
      userId,
      email,
      mobileNumber,
      password: encryptedPassword,
      encryptedPassword: encryptedPassword,
      firstName,
      lastName,
      district: district || dc.district,
      districtRef: dc.districtRef || null,
      areaRange: parsedAreaRange || null,
      boundingBox: parsedBoundingBox || null,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      createdBy: dc._id,
      createdByModel: 'DistrictCoordinator'
    });

    await teamLeader.save();

    // Populate createdBy for response
    await teamLeader.populate('createdBy', 'userId firstName lastName email mobileNumber profilePicture');
    await teamLeader.populate('districtRef', 'name description areaRange boundingBox centerPoint');

    res.status(201).json({
      success: true,
      message: 'Team Leader created successfully',
      data: {
        _id: teamLeader._id,
        userId: teamLeader.userId,
        email: teamLeader.email,
        mobileNumber: teamLeader.mobileNumber,
        firstName: teamLeader.firstName,
        lastName: teamLeader.lastName,
        district: teamLeader.district,
        districtRef: teamLeader.districtRef,
        areaRange: teamLeader.areaRange,
        boundingBox: teamLeader.boundingBox,
        latitude: teamLeader.latitude,
        longitude: teamLeader.longitude,
        role: teamLeader.role,
        createdBy: teamLeader.createdBy,
        createdByModel: teamLeader.createdByModel,
        createdAt: teamLeader.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating team leader',
      error: error.message
    });
  }
};

/**
 * Get all Team Leaders created by this District Coordinator
 */
const getTeamLeaders = async (req, res) => {
  try {
    const dcId = req.user.userId;
    const teamLeaders = await TeamLeader.find({ 
      createdBy: dcId, 
      createdByModel: 'DistrictCoordinator' 
    })
      .populate('districtRef', 'name description areaRange boundingBox centerPoint')
      .populate('createdBy', 'userId firstName lastName email mobileNumber profilePicture')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      message: 'Team Leaders retrieved successfully',
      data: teamLeaders,
      count: teamLeaders.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving team leaders',
      error: error.message
    });
  }
};

/**
 * Get Team Leader details with decrypted password
 * Only returns team leaders created by this district coordinator
 */
const getTeamLeaderDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const dcId = req.user.userId; // This is the MongoDB _id of the district coordinator
    const mongoose = require('mongoose');

    // Check if id is a valid MongoDB ObjectId
    const isValidObjectId = mongoose.Types.ObjectId.isValid(id);
    const searchQuery = isValidObjectId 
      ? { $or: [{ _id: id }, { userId: id }] }
      : { userId: id };

    // Add condition to ensure team leader was created by this district coordinator
    const teamLeader = await TeamLeader.findOne({
      ...searchQuery,
      createdBy: dcId,
      createdByModel: 'DistrictCoordinator'
    })
      .populate('districtRef', 'name description areaRange boundingBox centerPoint')
      .populate('createdBy', 'userId firstName lastName email mobileNumber profilePicture');

    if (!teamLeader) {
      return res.status(404).json({
        success: false,
        message: 'Team Leader not found or you don\'t have permission to view this team leader'
      });
    }

    const userData = teamLeader.toObject();

    // Decrypt the password
    try {
      const encryptedPwd = teamLeader.encryptedPassword || teamLeader.password;
      if (encryptedPwd) {
        const decryptedPassword = decryptPassword(encryptedPwd);
        userData.password = decryptedPassword;
      }
    } catch (error) {
      console.error('Password decryption error:', error);
      userData.password = 'Unable to decrypt password';
    }

    res.json({
      success: true,
      message: 'Team Leader details retrieved successfully',
      data: userData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving team leader details',
      error: error.message
    });
  }
};

/**
 * Create Coordinator (by District Coordinator)
 */
const createCoordinator = async (req, res) => {
  try {
    const { email, mobileNumber, password, firstName, lastName, district } = req.body;
    const createdBy = req.user.userId;

    const existingUser = await Coordinator.findOne({
      $or: [{ email }, { mobileNumber }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Coordinator already exists with this email or mobile number'
      });
    }

    const count = await Coordinator.countDocuments();
    const sequenceNumber = getNextSequenceNumber(count);
    const userId = generateUserId(USER_ROLES.COORDINATOR, sequenceNumber);

    const encryptedPassword = encryptPassword(password);

    const districtCoordinator = await DistrictCoordinator.findById(createdBy);

    const coordinator = new Coordinator({
      userId,
      email,
      mobileNumber,
      password: encryptedPassword,
      encryptedPassword: encryptedPassword,
      firstName,
      lastName,
      district,
      createdBy: districtCoordinator._id
    });

    await coordinator.save();

    res.status(201).json({
      success: true,
      message: 'Coordinator created successfully',
      data: {
        _id: coordinator._id,
        userId: coordinator.userId,
        email: coordinator.email,
        mobileNumber: coordinator.mobileNumber,
        firstName: coordinator.firstName,
        lastName: coordinator.lastName,
        district: coordinator.district,
        role: coordinator.role,
        createdBy: coordinator.createdBy
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating coordinator',
      error: error.message
    });
  }
};

/**
 * Get users under district coordinator
 * Returns only Coordinators
 */
const getMyUsers = async (req, res) => {
  try {
    const dcId = req.user.userId;
    
    const coordinators = await Coordinator.find({ createdBy: dcId });

    res.json({
      success: true,
      message: 'Users retrieved successfully',
      data: coordinators.map(user => ({
        _id: user._id,
        userId: user.userId,
        email: user.email,
        mobileNumber: user.mobileNumber,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        district: user.district || null,
        profilePicture: user.profilePicture || null
      })),
      count: coordinators.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving users',
      error: error.message
    });
  }
};

module.exports = {
  login,
  getProfile,
  updateProfile,
  createCoordinator,
  createTeamLeader,
  getTeamLeaders,
  getTeamLeaderDetails,
  getMyUsers
};

