const TeamLeader = require('../models/teamLeader.model');
const FieldEmployee = require('../models/fieldEmployee.model');
const District = require('../models/district.model');
const { encryptPassword, decryptPassword, comparePassword } = require('../services/passwordService');
const { generateUserId, getNextSequenceNumber } = require('../services/userIdService');
const { generateToken } = require('../middleware/auth');
const { USER_ROLES } = require('../utils/constants');
const { processImage, getFileExtension } = require('../services/imageProcessingService');
const { uploadToS3 } = require('../services/awsS3Service');

/**
 * Team Leader Login
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

    const teamLeader = await TeamLeader.findOne({
      $or: [
        { email: identifier },
        { mobileNumber: identifier },
        { userId: identifier }
      ]
    });

    if (!teamLeader) {
      return res.status(404).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    if (!teamLeader.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    const isPasswordValid = comparePassword(password, teamLeader.encryptedPassword);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const token = generateToken(teamLeader);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          _id: teamLeader._id,
          userId: teamLeader.userId,
          email: teamLeader.email,
          mobileNumber: teamLeader.mobileNumber,
          firstName: teamLeader.firstName,
          lastName: teamLeader.lastName,
          role: teamLeader.role,
          profilePicture: teamLeader.profilePicture || null
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
 * Create Field Employee (by Team Leader)
 */
const createFieldEmployee = async (req, res) => {
  try {
    const { email, mobileNumber, password, firstName, lastName, districtId } = req.body;
    const createdBy = req.user.userId;

    // Validate required fields
    if (!email || !mobileNumber || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: email, mobileNumber, password, firstName, lastName'
      });
    }

    // Validate districtId is provided
    if (!districtId) {
      return res.status(400).json({
        success: false,
        message: 'districtId is required'
      });
    }

    // Validate district exists
    const districtDoc = await District.findById(districtId);
    if (!districtDoc) {
      return res.status(404).json({
        success: false,
        message: 'District not found with the provided districtId'
      });
    }

    // Check if district is active
    if (!districtDoc.isActive) {
      return res.status(400).json({
        success: false,
        message: 'District is not active'
      });
    }

    const existingUser = await FieldEmployee.findOne({
      $or: [{ email }, { mobileNumber }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Field Employee already exists with this email or mobile number'
      });
    }

    const count = await FieldEmployee.countDocuments();
    const sequenceNumber = getNextSequenceNumber(count);
    const userId = generateUserId(USER_ROLES.FIELD_EMPLOYEE, sequenceNumber);

    const encryptedPassword = encryptPassword(password);

    const teamLeader = await TeamLeader.findById(createdBy);
    if (!teamLeader) {
      return res.status(404).json({
        success: false,
        message: 'Team Leader not found'
      });
    }

    // Handle profile picture upload if provided
    let profilePictureUrl = null;
    if (req.file) {
      try {
        // Process image with Jimp
        const processedImage = await processImage(req.file.buffer);
        const fileExtension = getFileExtension(req.file.mimetype);
        const fileName = `field_employee-${Date.now()}.${fileExtension}`;

        // Upload to S3
        profilePictureUrl = await uploadToS3(processedImage, fileName, req.file.mimetype);
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: 'Error processing profile picture',
          error: error.message
        });
      }
    }

    const fieldEmployee = new FieldEmployee({
      userId,
      email,
      mobileNumber,
      password: encryptedPassword,
      encryptedPassword: encryptedPassword,
      firstName,
      lastName,
      district: districtDoc.name,
      districtRef: districtDoc._id,
      profilePicture: profilePictureUrl,
      createdBy: teamLeader._id
    });

    await fieldEmployee.save();

    res.status(201).json({
      success: true,
      message: 'Field Employee created successfully',
      data: {
        _id: fieldEmployee._id,
        userId: fieldEmployee.userId,
        email: fieldEmployee.email,
        mobileNumber: fieldEmployee.mobileNumber,
        firstName: fieldEmployee.firstName,
        lastName: fieldEmployee.lastName,
        district: fieldEmployee.district,
        districtRef: fieldEmployee.districtRef,
        role: fieldEmployee.role,
        profilePicture: fieldEmployee.profilePicture || null,
        createdBy: fieldEmployee.createdBy
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating field employee',
      error: error.message
    });
  }
};

/**
 * Get all field employees under team leader
 */
const getMyUsers = async (req, res) => {
  try {
    const tlId = req.user.userId; // This is the MongoDB _id

    const fieldEmployees = await FieldEmployee.find({ createdBy: tlId })
      .populate('districtRef', 'name description areaRange boundingBox centerPoint');

    res.json({
      success: true,
      message: 'Field employees retrieved successfully',
      data: fieldEmployees.map(user => ({
        _id: user._id,
        userId: user.userId,
        email: user.email,
        mobileNumber: user.mobileNumber,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        district: user.district || null,
        districtRef: user.districtRef || null,
        profilePicture: user.profilePicture || null,
        latitude: user.latitude || null,
        longitude: user.longitude || null,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      })),
      count: fieldEmployees.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving field employees',
      error: error.message
    });
  }
};

/**
 * Get Field Employee details by ID
 * Only returns field employees created by this team leader
 */
const getFieldEmployeeDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const tlId = req.user.userId; // This is the MongoDB _id of the team leader
    const mongoose = require('mongoose');

    // Check if id is a valid MongoDB ObjectId
    const isValidObjectId = mongoose.Types.ObjectId.isValid(id);
    const searchQuery = isValidObjectId 
      ? { $or: [{ _id: id }, { userId: id }] }
      : { userId: id };

    // Add condition to ensure field employee was created by this team leader
    const fieldEmployee = await FieldEmployee.findOne({
      ...searchQuery,
      createdBy: tlId
    })
      .populate('districtRef', 'name description areaRange boundingBox centerPoint')
      .populate('createdBy', 'userId firstName lastName email mobileNumber profilePicture');

    if (!fieldEmployee) {
      return res.status(404).json({
        success: false,
        message: 'Field Employee not found or you don\'t have permission to view this employee'
      });
    }

    const userData = fieldEmployee.toObject();

    // Decrypt the password
    try {
      const encryptedPwd = fieldEmployee.encryptedPassword || fieldEmployee.password;
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
      message: 'Field Employee details retrieved successfully',
      data: userData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving field employee details',
      error: error.message
    });
  }
};

module.exports = {
  login,
  createFieldEmployee,
  getMyUsers,
  getFieldEmployeeDetails
};

