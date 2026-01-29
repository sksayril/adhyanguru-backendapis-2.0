const SuperAdmin = require('../models/superAdmin.model');
const { encryptPassword, decryptPassword, comparePassword } = require('../services/passwordService');
const { generateUserId, getNextSequenceNumber } = require('../services/userIdService');
const { generateToken } = require('../middleware/auth');
const { USER_ROLES, USER_HIERARCHY } = require('../utils/constants');
const { getAllModels } = require('../utils/userModelMapper');
const { createUser } = require('../services/userCreationService');
const { canCreateUserType } = require('../middleware/auth');
const { processImage, getFileExtension } = require('../services/imageProcessingService');
const { uploadToS3, deleteFromS3 } = require('../services/awsS3Service');

/**
 * Super Admin Signup
 */
const signup = async (req, res) => {
  try {
    const { email, mobileNumber, password, firstName, lastName, latitude, longitude } = req.body;

    // Check if user already exists
    const existingUser = await SuperAdmin.findOne({
      $or: [{ email }, { mobileNumber }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email or mobile number'
      });
    }

    // Generate user ID
    const count = await SuperAdmin.countDocuments();
    const sequenceNumber = getNextSequenceNumber(count);
    const userId = generateUserId(USER_ROLES.SUPER_ADMIN, sequenceNumber);

    // Encrypt password
    const encryptedPassword = encryptPassword(password);

    // Handle profile picture upload if provided
    let profilePictureUrl = null;
    if (req.file) {
      try {
        // Process image with Jimp
        const processedImage = await processImage(req.file.buffer);
        const fileExtension = getFileExtension(req.file.mimetype);
        const fileName = `superadmin-${userId}.${fileExtension}`;

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

    // Create super admin
    const superAdmin = new SuperAdmin({
      userId,
      email,
      mobileNumber,
      password: encryptedPassword, // Store encrypted password
      encryptedPassword: encryptedPassword, // Also store as encryptedPassword field
      firstName,
      lastName,
      profilePicture: profilePictureUrl,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      createdAt: new Date() // Explicitly set creation time
    });

    await superAdmin.save();

    res.status(201).json({
      success: true,
      message: 'Super Admin created successfully',
      data: {
        _id: superAdmin._id,
        userId: superAdmin.userId,
        email: superAdmin.email,
        mobileNumber: superAdmin.mobileNumber,
        firstName: superAdmin.firstName,
        lastName: superAdmin.lastName,
        role: superAdmin.role,
        profilePicture: superAdmin.profilePicture,
        latitude: superAdmin.latitude,
        longitude: superAdmin.longitude,
        createdAt: superAdmin.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating super admin',
      error: error.message
    });
  }
};

/**
 * Super Admin Login
 * Can login with email, mobileNumber, or userId
 */
const login = async (req, res) => {
  try {
    const { identifier, password } = req.body; // identifier can be email, mobileNumber, or userId

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide identifier (email/mobile/userId) and password'
      });
    }

    // Find user by email, mobileNumber, or userId
    const superAdmin = await SuperAdmin.findOne({
      $or: [
        { email: identifier },
        { mobileNumber: identifier },
        { userId: identifier }
      ]
    });

    if (!superAdmin) {
      return res.status(404).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    if (!superAdmin.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Compare password
    const isPasswordValid = comparePassword(password, superAdmin.encryptedPassword);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(superAdmin);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          _id: superAdmin._id,
          userId: superAdmin.userId,
          email: superAdmin.email,
          mobileNumber: superAdmin.mobileNumber,
          firstName: superAdmin.firstName,
          lastName: superAdmin.lastName,
          role: superAdmin.role,
          profilePicture: superAdmin.profilePicture || null,
          latitude: superAdmin.latitude || null,
          longitude: superAdmin.longitude || null
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
 * Logout
 * Note: Since JWT tokens are stateless, logout is handled client-side by removing the token.
 * This endpoint provides a confirmation response.
 */
const logout = async (req, res) => {
  try {
    // JWT tokens are stateless, so we just return success
    // The client should remove the token from storage
    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: error.message
    });
  }
};

/**
 * Create Admin (by Super Admin)
 */
const createAdmin = async (req, res) => {
  try {
    const { email, mobileNumber, password, firstName, lastName, latitude, longitude } = req.body;
    const createdBy = req.user.userId; // From authenticated user

    const Admin = require('../models/admin.model');

    // Check if user already exists
    const existingUser = await Admin.findOne({
      $or: [{ email }, { mobileNumber }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Admin already exists with this email or mobile number'
      });
    }

    // Generate user ID
    const count = await Admin.countDocuments();
    const sequenceNumber = getNextSequenceNumber(count);
    const userId = generateUserId(USER_ROLES.ADMIN, sequenceNumber);

    // Encrypt password
    const encryptedPassword = encryptPassword(password);

    // Get super admin who is creating
    const superAdmin = await SuperAdmin.findById(createdBy);

    // Handle profile picture upload if provided
    let profilePictureUrl = null;
    if (req.file) {
      try {
        // Process image with Jimp
        const processedImage = await processImage(req.file.buffer);
        const fileExtension = getFileExtension(req.file.mimetype);
        const fileName = `admin-${userId}.${fileExtension}`;

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

    // Create admin
    const admin = new Admin({
      userId,
      email,
      mobileNumber,
      password: encryptedPassword,
      encryptedPassword: encryptedPassword,
      firstName,
      lastName,
      profilePicture: profilePictureUrl,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      createdBy: superAdmin._id
    });

    await admin.save();

    res.status(201).json({
      success: true,
      message: 'Admin created successfully',
      data: {
        _id: admin._id,
        userId: admin.userId,
        email: admin.email,
        mobileNumber: admin.mobileNumber,
        firstName: admin.firstName,
        lastName: admin.lastName,
        role: admin.role,
        profilePicture: admin.profilePicture,
        latitude: admin.latitude,
        longitude: admin.longitude,
        createdAt: admin.createdAt,
        createdBy: admin.createdBy
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating admin',
      error: error.message
    });
  }
};

/**
 * Create any downline user (Generic function for Super Admin)
 * Super Admin can create: Admin, District Coordinator, Coordinator, Field Manager, Team Leader, Field Employee
 */
const createDownlineUser = async (req, res) => {
  try {
    const { 
      userType, 
      email, 
      mobileNumber, 
      password, 
      firstName, 
      lastName, 
      district, 
      latitude, 
      longitude,
      areaRange,
      boundingBox
    } = req.body;
    const creator = req.user;

    // Check authorization
    if (!canCreateUserType(creator.role, userType)) {
      return res.status(403).json({
        success: false,
        message: `You don't have permission to create ${userType}`
      });
    }

    // Validate user type
    const allowedTypes = [
      USER_ROLES.ADMIN,
      USER_ROLES.DISTRICT_COORDINATOR,
      USER_ROLES.COORDINATOR,
      USER_ROLES.FIELD_MANAGER,
      USER_ROLES.TEAM_LEADER,
      USER_ROLES.FIELD_EMPLOYEE
    ];

    if (!allowedTypes.includes(userType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid user type. Allowed types: ${allowedTypes.join(', ')}`
      });
    }

    // Validate required fields
    if (!email || !mobileNumber || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: email, mobileNumber, password, firstName, lastName'
      });
    }

    // District is required for roles below Admin
    if (userType !== USER_ROLES.ADMIN && !district) {
      return res.status(400).json({
        success: false,
        message: 'District is required for this user type'
      });
    }

    // Handle profile picture upload if provided
    let profilePictureUrl = null;
    if (req.file) {
      try {
        const processedImage = await processImage(req.file.buffer);
        const fileExtension = getFileExtension(req.file.mimetype);
        const fileName = `${userType.toLowerCase()}-${Date.now()}.${fileExtension}`;
        profilePictureUrl = await uploadToS3(processedImage, fileName, req.file.mimetype);
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: 'Error processing profile picture',
          error: error.message
        });
      }
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

    // Create user using the service
    const newUser = await createUser(userType, {
      email,
      mobileNumber,
      password,
      firstName,
      lastName,
      district,
      profilePicture: profilePictureUrl,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      areaRange: parsedAreaRange,
      boundingBox: parsedBoundingBox
    }, creator);

    // Return response
    const responseData = {
      _id: newUser._id,
      userId: newUser.userId,
      email: newUser.email,
      mobileNumber: newUser.mobileNumber,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      role: newUser.role,
      createdBy: newUser.createdBy,
      createdAt: newUser.createdAt
    };

    // Add profile picture if present
    if (newUser.profilePicture) {
      responseData.profilePicture = newUser.profilePicture;
    }

    // Add coordinates if present
    if (newUser.latitude !== null && newUser.latitude !== undefined) {
      responseData.latitude = newUser.latitude;
    }
    if (newUser.longitude !== null && newUser.longitude !== undefined) {
      responseData.longitude = newUser.longitude;
    }

    // Add areaRange and boundingBox if present
    if (newUser.areaRange) {
      responseData.areaRange = newUser.areaRange;
    }
    if (newUser.boundingBox) {
      responseData.boundingBox = newUser.boundingBox;
    }

    // Add district if present
    if (newUser.district) {
      responseData.district = newUser.district;
    }

    res.status(201).json({
      success: true,
      message: `${userType} created successfully`,
      data: responseData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Error creating ${req.body.userType || 'user'}`,
      error: error.message
    });
  }
};

/**
 * Get all users (Super Admin can see everyone)
 */
const getAllUsers = async (req, res) => {
  try {
    const allUsers = [];
    const models = getAllModels();

    for (const Model of models) {
      const users = await Model.find({ isActive: true }).select('-password -encryptedPassword');
      allUsers.push(...users);
    }

    res.json({
      success: true,
      message: 'All users retrieved successfully',
      data: allUsers,
      count: allUsers.length
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
 * Get user details with decrypted password
 */
const getUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;
    const { includePassword } = req.query;

    let user = null;
    const models = getAllModels();
    const mongoose = require('mongoose');

    // Check if userId is a valid MongoDB ObjectId
    const isValidObjectId = mongoose.Types.ObjectId.isValid(userId);
    const searchQuery = isValidObjectId 
      ? { $or: [{ _id: userId }, { userId: userId }] }
      : { userId: userId };

    // Find user across all models (ensure encryptedPassword is included)
    for (const Model of models) {
      // Query without select to get all fields including encryptedPassword
      user = await Model.findOne(searchQuery);
      if (user) {
        // Ensure encryptedPassword is available (fallback to password if needed)
        if (!user.encryptedPassword && user.password) {
          user.encryptedPassword = user.password;
        }
        break;
      }
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userData = {
      _id: user._id,
      userId: user.userId,
      email: user.email,
      mobileNumber: user.mobileNumber,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      profilePicture: user.profilePicture || null,
      latitude: user.latitude || null,
      longitude: user.longitude || null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    // Include decrypted password if requested
    if (includePassword === 'true') {
      try {
        // Try to get encryptedPassword, fallback to password field if needed
        const encryptedPwd = user.encryptedPassword || user.password;
        
        if (!encryptedPwd) {
          userData.password = 'No encrypted password found in database';
          userData.encryptedPassword = null;
        } else {
          // Decrypt the password
          const decryptedPassword = decryptPassword(encryptedPwd);
          
          if (decryptedPassword && decryptedPassword.trim() !== '') {
            // Successfully decrypted - return the original password
            userData.password = decryptedPassword;
            userData.encryptedPassword = encryptedPwd;
          } else {
            // Decryption returned empty string - likely encryption key mismatch
            userData.password = 'Decryption returned empty result - check ENCRYPTION_KEY in .env';
            userData.encryptedPassword = encryptedPwd;
          }
        }
      } catch (error) {
        console.error('Password decryption error:', error);
        console.error('Encrypted password value:', user.encryptedPassword || user.password);
        userData.password = `Unable to decrypt: ${error.message}`;
        userData.encryptedPassword = user.encryptedPassword || user.password || null;
      }
    }

    res.json({
      success: true,
      message: 'User details retrieved successfully',
      data: userData
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
  signup,
  login,
  logout,
  createAdmin,
  createDownlineUser,
  getAllUsers,
  getUserDetails
};

