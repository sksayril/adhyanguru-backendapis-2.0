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
const CommissionSettings = require('../models/commissionSettings.model');
const Admin = require('../models/admin.model');
const Coordinator = require('../models/coordinator.model');
const DistrictCoordinator = require('../models/districtCoordinator.model');
const TeamLeader = require('../models/teamLeader.model');
const FieldEmployee = require('../models/fieldEmployee.model');
const Student = require('../models/student.model');
const StudentSubscription = require('../models/studentSubscription.model');
const StudentCoursePurchase = require('../models/studentCoursePurchase.model');
const WalletTransaction = require('../models/walletTransaction.model');
const SubCategory = require('../models/subCategory.model');
const Course = require('../models/course.model');
const Thumbnail = require('../models/thumbnail.model');
const mongoose = require('mongoose');
const os = require('os');

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

/**
 * Get Commission Settings
 */
const getCommissionSettings = async (req, res) => {
  try {
    if (!req.user || req.user.role !== USER_ROLES.SUPER_ADMIN) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super Admin role required.'
      });
    }

    const settings = await CommissionSettings.findOne({ isActive: true })
      .populate('updatedBy', 'userId firstName lastName')
      .sort({ updatedAt: -1 });

    if (!settings) {
      // Return default settings if none exist
      return res.json({
        success: true,
        message: 'Commission settings retrieved successfully (using defaults)',
        data: {
          coordinatorPercentage: 40,
          districtCoordinatorPercentage: 10,
          teamLeaderPercentage: 10,
          fieldEmployeePercentage: 10,
          isActive: false,
          updatedBy: null,
          updatedAt: null
        }
      });
    }

    res.json({
      success: true,
      message: 'Commission settings retrieved successfully',
      data: settings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving commission settings',
      error: error.message
    });
  }
};

/**
 * Create Commission Settings
 */
const createCommissionSettings = async (req, res) => {
  try {
    if (!req.user || req.user.role !== USER_ROLES.SUPER_ADMIN) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super Admin role required.'
      });
    }

    const {
      coordinatorPercentage,
      districtCoordinatorPercentage,
      teamLeaderPercentage,
      fieldEmployeePercentage
    } = req.body;

    // Check if active settings already exist
    const existingSettings = await CommissionSettings.findOne({ isActive: true });
    if (existingSettings) {
      return res.status(400).json({
        success: false,
        message: 'Commission settings already exist. Use PUT /commission-settings to update them.'
      });
    }

    // Validate all required fields are provided
    if (coordinatorPercentage === undefined || 
        districtCoordinatorPercentage === undefined || 
        teamLeaderPercentage === undefined || 
        fieldEmployeePercentage === undefined) {
      return res.status(400).json({
        success: false,
        message: 'All commission percentages are required: coordinatorPercentage, districtCoordinatorPercentage, teamLeaderPercentage, fieldEmployeePercentage'
      });
    }

    // Validate percentages
    const percentages = {
      coordinatorPercentage: parseFloat(coordinatorPercentage),
      districtCoordinatorPercentage: parseFloat(districtCoordinatorPercentage),
      teamLeaderPercentage: parseFloat(teamLeaderPercentage),
      fieldEmployeePercentage: parseFloat(fieldEmployeePercentage)
    };

    // Validate all percentages are between 0 and 100
    for (const [key, value] of Object.entries(percentages)) {
      if (isNaN(value) || value < 0 || value > 100) {
        return res.status(400).json({
          success: false,
          message: `${key} must be a number between 0 and 100`
        });
      }
    }

    // Get Super Admin user
    const superAdmin = await SuperAdmin.findById(req.user.userId);
    if (!superAdmin) {
      return res.status(404).json({
        success: false,
        message: 'Super Admin not found'
      });
    }

    // Create new settings
    const newSettings = new CommissionSettings({
      coordinatorPercentage: percentages.coordinatorPercentage,
      districtCoordinatorPercentage: percentages.districtCoordinatorPercentage,
      teamLeaderPercentage: percentages.teamLeaderPercentage,
      fieldEmployeePercentage: percentages.fieldEmployeePercentage,
      updatedBy: superAdmin._id,
      updatedByModel: 'SuperAdmin',
      isActive: true
    });

    await newSettings.save();

    res.status(201).json({
      success: true,
      message: 'Commission settings created successfully',
      data: newSettings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating commission settings',
      error: error.message
    });
  }
};

/**
 * Update Commission Settings
 */
const updateCommissionSettings = async (req, res) => {
  try {
    if (!req.user || req.user.role !== USER_ROLES.SUPER_ADMIN) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super Admin role required.'
      });
    }

    const {
      coordinatorPercentage,
      districtCoordinatorPercentage,
      teamLeaderPercentage,
      fieldEmployeePercentage
    } = req.body;

    // Validate percentages
    const percentages = {
      coordinatorPercentage: coordinatorPercentage !== undefined ? parseFloat(coordinatorPercentage) : undefined,
      districtCoordinatorPercentage: districtCoordinatorPercentage !== undefined ? parseFloat(districtCoordinatorPercentage) : undefined,
      teamLeaderPercentage: teamLeaderPercentage !== undefined ? parseFloat(teamLeaderPercentage) : undefined,
      fieldEmployeePercentage: fieldEmployeePercentage !== undefined ? parseFloat(fieldEmployeePercentage) : undefined
    };

    // Validate all percentages are between 0 and 100
    for (const [key, value] of Object.entries(percentages)) {
      if (value !== undefined && (isNaN(value) || value < 0 || value > 100)) {
        return res.status(400).json({
          success: false,
          message: `${key} must be a number between 0 and 100`
        });
      }
    }

    // Check if at least one percentage is provided
    if (Object.values(percentages).every(v => v === undefined)) {
      return res.status(400).json({
        success: false,
        message: 'At least one commission percentage must be provided'
      });
    }

    // Get current active settings or create new
    let settings = await CommissionSettings.findOne({ isActive: true });

    if (settings) {
      // Deactivate current settings
      settings.isActive = false;
      await settings.save();
    }

    // Get Super Admin user
    const superAdmin = await SuperAdmin.findById(req.user.userId);
    if (!superAdmin) {
      return res.status(404).json({
        success: false,
        message: 'Super Admin not found'
      });
    }

    // Create new settings with provided values or use existing values
    const newSettings = new CommissionSettings({
      coordinatorPercentage: percentages.coordinatorPercentage !== undefined 
        ? percentages.coordinatorPercentage 
        : (settings?.coordinatorPercentage || 40),
      districtCoordinatorPercentage: percentages.districtCoordinatorPercentage !== undefined 
        ? percentages.districtCoordinatorPercentage 
        : (settings?.districtCoordinatorPercentage || 10),
      teamLeaderPercentage: percentages.teamLeaderPercentage !== undefined 
        ? percentages.teamLeaderPercentage 
        : (settings?.teamLeaderPercentage || 10),
      fieldEmployeePercentage: percentages.fieldEmployeePercentage !== undefined 
        ? percentages.fieldEmployeePercentage 
        : (settings?.fieldEmployeePercentage || 10),
      updatedBy: superAdmin._id,
      updatedByModel: 'SuperAdmin',
      isActive: true
    });

    await newSettings.save();

    res.json({
      success: true,
      message: 'Commission settings updated successfully',
      data: newSettings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating commission settings',
      error: error.message
    });
  }
};

/**
 * Get Super Admin Dashboard
 * Comprehensive dashboard with all metrics, revenue, expenses, user statistics, and charts
 * Optimized using aggregation pipelines for fast response
 */
const getDashboard = async (req, res) => {
  try {
    const { period = '30' } = req.query; // Period in days (default: 30 days)
    const periodDays = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    
    // Date for inactive users (10 days ago)
    const inactiveThresholdDate = new Date();
    inactiveThresholdDate.setDate(inactiveThresholdDate.getDate() - 10);
    inactiveThresholdDate.setHours(0, 0, 0, 0);

    // Parallel queries using aggregation for performance
    const [
      totalUsers,
      userCountsByRole,
      revenueStats,
      expenseStats,
      activeUsersStats,
      inactiveUsersStats,
      userGrowthChart,
      salesChart,
      recentActivity
    ] = await Promise.all([
      // Total users count
      Promise.all([
        Student.countDocuments(),
        Admin.countDocuments(),
        Coordinator.countDocuments(),
        DistrictCoordinator.countDocuments(),
        TeamLeader.countDocuments(),
        FieldEmployee.countDocuments()
      ]).then(counts => ({
        students: counts[0],
        admins: counts[1],
        coordinators: counts[2],
        districtCoordinators: counts[3],
        teamLeaders: counts[4],
        fieldEmployees: counts[5],
        total: counts.reduce((sum, count) => sum + count, 0)
      })),

      // User counts by role
      Promise.all([
        Student.countDocuments({ isActive: true }),
        Admin.countDocuments({ isActive: true }),
        Coordinator.countDocuments({ isActive: true }),
        DistrictCoordinator.countDocuments({ isActive: true }),
        TeamLeader.countDocuments({ isActive: true }),
        FieldEmployee.countDocuments({ isActive: true })
      ]).then(counts => ({
        students: counts[0],
        admins: counts[1],
        coordinators: counts[2],
        districtCoordinators: counts[3],
        teamLeaders: counts[4],
        fieldEmployees: counts[5]
      })),

      // Revenue statistics (subscriptions + courses)
      Promise.all([
        StudentSubscription.aggregate([
          {
            $match: {
              paymentStatus: 'COMPLETED',
              createdAt: { $gte: startDate, $lte: endDate }
            }
          },
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: '$amount' },
              totalTransactions: { $sum: 1 }
            }
          }
        ]),
        StudentCoursePurchase.aggregate([
          {
            $match: {
              paymentStatus: 'COMPLETED',
              createdAt: { $gte: startDate, $lte: endDate }
            }
          },
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: '$amount' },
              totalTransactions: { $sum: 1 }
            }
          }
        ]),
        StudentSubscription.aggregate([
          {
            $match: {
              paymentStatus: 'COMPLETED',
              isActive: true
            }
          },
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: '$amount' }
            }
          }
        ]),
        StudentCoursePurchase.aggregate([
          {
            $match: {
              paymentStatus: 'COMPLETED'
            }
          },
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: '$amount' }
            }
          }
        ])
      ]).then(([subPeriod, coursePeriod, subAll, courseAll]) => ({
        period: {
          subscriptions: subPeriod[0]?.totalRevenue || 0,
          courses: coursePeriod[0]?.totalRevenue || 0,
          total: (subPeriod[0]?.totalRevenue || 0) + (coursePeriod[0]?.totalRevenue || 0),
          transactions: (subPeriod[0]?.totalTransactions || 0) + (coursePeriod[0]?.totalTransactions || 0)
        },
        allTime: {
          subscriptions: subAll[0]?.totalRevenue || 0,
          courses: courseAll[0]?.totalRevenue || 0,
          total: (subAll[0]?.totalRevenue || 0) + (courseAll[0]?.totalRevenue || 0)
        }
      })),

      // Expense statistics (commissions paid out)
      Promise.all([
        WalletTransaction.aggregate([
          {
            $match: {
              type: 'COMMISSION',
              status: 'COMPLETED',
              createdAt: { $gte: startDate, $lte: endDate }
            }
          },
          {
            $group: {
              _id: null,
              totalExpenses: { $sum: '$amount' },
              totalTransactions: { $sum: 1 }
            }
          }
        ]),
        WalletTransaction.aggregate([
          {
            $match: {
              type: 'COMMISSION',
              status: 'COMPLETED'
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' }
            }
          }
        ])
      ]).then(([periodResult, allTimeResult]) => ({
        period: {
          total: periodResult[0]?.totalExpenses || 0,
          transactions: periodResult[0]?.totalTransactions || 0
        },
        allTime: {
          total: allTimeResult[0]?.total || 0
        }
      })),

      // Active users (users with activity in last 10 days)
      Promise.all([
        StudentSubscription.distinct('student', {
          paymentStatus: 'COMPLETED',
          createdAt: { $gte: inactiveThresholdDate }
        }),
        StudentCoursePurchase.distinct('student', {
          paymentStatus: 'COMPLETED',
          createdAt: { $gte: inactiveThresholdDate }
        }),
        Student.find({
          createdAt: { $gte: inactiveThresholdDate }
        }).distinct('_id')
      ]).then(([subStudents, courseStudents, newStudents]) => {
        const activeSet = new Set([
          ...subStudents.map(id => id.toString()),
          ...courseStudents.map(id => id.toString()),
          ...newStudents.map(id => id.toString())
        ]);
        return {
          students: activeSet.size,
          total: activeSet.size
        };
      }),

      // Inactive users (no activity in last 10 days)
      Promise.all([
        StudentSubscription.distinct('student', {
          paymentStatus: 'COMPLETED',
          createdAt: { $gte: inactiveThresholdDate }
        }),
        StudentCoursePurchase.distinct('student', {
          paymentStatus: 'COMPLETED',
          createdAt: { $gte: inactiveThresholdDate }
        }),
        Student.find({
          createdAt: { $gte: inactiveThresholdDate }
        }).distinct('_id')
      ]).then(async ([activeSubStudents, activeCourseStudents, activeNewStudents]) => {
        const activeSet = new Set([
          ...activeSubStudents.map(id => id.toString()),
          ...activeCourseStudents.map(id => id.toString()),
          ...activeNewStudents.map(id => id.toString())
        ]);
        // Get all students created before threshold
        const allStudents = await Student.find({
          createdAt: { $lt: inactiveThresholdDate }
        }).distinct('_id');
        // Count students with no recent activity
        const inactiveStudents = allStudents.filter(id => !activeSet.has(id.toString()));
        return {
          students: inactiveStudents.length,
          total: inactiveStudents.length
        };
      }),

      // User growth chart (daily sign-ups)
      Student.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$createdAt'
              }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),

      // Sales chart (subcategory and course sales)
      Promise.all([
        StudentSubscription.aggregate([
          {
            $match: {
              paymentStatus: 'COMPLETED',
              createdAt: { $gte: startDate, $lte: endDate }
            }
          },
          {
            $lookup: {
              from: 'plans',
              localField: 'plan',
              foreignField: '_id',
              as: 'planInfo'
            }
          },
          { $unwind: '$planInfo' },
          {
            $lookup: {
              from: 'subcategories',
              localField: 'subCategory',
              foreignField: '_id',
              as: 'subCategoryInfo'
            }
          },
          { $unwind: '$subCategoryInfo' },
          {
            $group: {
              _id: {
                subCategory: '$subCategoryInfo.name',
                subCategoryId: '$subCategory'
              },
              totalSales: { $sum: '$amount' },
              count: { $sum: 1 }
            }
          },
          { $sort: { totalSales: -1 } },
          { $limit: 10 }
        ]),
        StudentCoursePurchase.aggregate([
          {
            $match: {
              paymentStatus: 'COMPLETED',
              createdAt: { $gte: startDate, $lte: endDate }
            }
          },
          {
            $lookup: {
              from: 'courses',
              localField: 'course',
              foreignField: '_id',
              as: 'courseInfo'
            }
          },
          { $unwind: '$courseInfo' },
          {
            $group: {
              _id: {
                course: '$courseInfo.title',
                courseId: '$course'
              },
              totalSales: { $sum: '$amount' },
              count: { $sum: 1 }
            }
          },
          { $sort: { totalSales: -1 } },
          { $limit: 10 }
        ])
      ]),

      // Recent activity
      Promise.all([
        StudentSubscription.find({
          paymentStatus: 'COMPLETED'
        })
          .sort({ createdAt: -1 })
          .limit(10)
          .populate('student', 'userId firstName lastName')
          .populate('plan', 'duration amount')
          .populate('subCategory', 'name')
          .lean(),
        StudentCoursePurchase.find({
          paymentStatus: 'COMPLETED'
        })
          .sort({ createdAt: -1 })
          .limit(10)
          .populate('student', 'userId firstName lastName')
          .populate('course', 'title price')
          .lean()
      ])
    ]);

    // Expense stats are already processed

    // Process user growth chart
    const growthMap = new Map(userGrowthChart.map(item => [item._id, item.count]));
    const growthChartData = [];
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      growthChartData.push({
        date: dateStr,
        signUps: growthMap.get(dateStr) || 0
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Process sales chart
    const [subcategorySales, courseSales] = salesChart;

    res.json({
      success: true,
      message: 'Dashboard data retrieved successfully',
      data: {
        overview: {
          totalUsers: totalUsers.total,
          userBreakdown: {
            students: totalUsers.students,
            admins: totalUsers.admins,
            coordinators: totalUsers.coordinators,
            districtCoordinators: totalUsers.districtCoordinators,
            teamLeaders: totalUsers.teamLeaders,
            fieldEmployees: totalUsers.fieldEmployees
          },
          activeUsers: {
            students: activeUsersStats.students,
            total: activeUsersStats.total
          },
          inactiveUsers: {
            students: inactiveUsersStats.students,
            total: inactiveUsersStats.total,
            note: 'Users with no activity in last 10 days'
          }
        },
        revenue: {
          period: {
            ...revenueStats.period,
            netRevenue: revenueStats.period.total - expenseStats.period.total
          },
          allTime: {
            ...revenueStats.allTime,
            netRevenue: revenueStats.allTime.total - expenseStats.allTime.total
          }
        },
        expenses: {
          period: expenseStats.period,
          allTime: expenseStats.allTime,
          note: 'Total commissions paid out to coordinators, district coordinators, team leaders, and field employees'
        },
        userCounts: userCountsByRole,
        growthChart: {
          period: `${periodDays} days`,
          data: growthChartData
        },
        salesChart: {
          period: `${periodDays} days`,
          topSubcategories: subcategorySales.map(item => ({
            subCategory: item._id.subCategory,
            subCategoryId: item._id.subCategoryId,
            totalSales: item.totalSales,
            transactions: item.count
          })),
          topCourses: courseSales.map(item => ({
            course: item._id.course,
            courseId: item._id.courseId,
            totalSales: item.totalSales,
            transactions: item.count
          }))
        },
        recentActivity: {
          subscriptions: recentActivity[0].map(sub => ({
            student: {
              userId: sub.student?.userId || '',
              name: sub.student ? `${sub.student.firstName} ${sub.student.lastName}` : ''
            },
            plan: {
              duration: sub.plan?.duration || '',
              amount: sub.plan?.amount || 0
            },
            subCategory: sub.subCategory?.name || '',
            amount: sub.amount || 0,
            createdAt: sub.createdAt
          })),
          coursePurchases: recentActivity[1].map(course => ({
            student: {
              userId: course.student?.userId || '',
              name: course.student ? `${course.student.firstName} ${course.student.lastName}` : ''
            },
            course: {
              title: course.course?.title || '',
              price: course.course?.price || 0
            },
            amount: course.amount || 0,
            createdAt: course.createdAt
          }))
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving dashboard data',
      error: error.message
    });
  }
};

/**
 * Get Server Health Check
 * Comprehensive health check for server, database, and system metrics
 */
const getHealthCheck = async (req, res) => {
  try {
    const startTime = Date.now();
    
    // System information
    const systemInfo = {
      platform: os.platform(),
      arch: os.arch(),
      hostname: os.hostname(),
      nodeVersion: process.version,
      uptime: process.uptime(),
      uptimeFormatted: formatUptime(process.uptime())
    };

    // Memory usage
    const memoryUsage = process.memoryUsage();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const memoryInfo = {
      process: {
        rss: formatBytes(memoryUsage.rss),
        heapTotal: formatBytes(memoryUsage.heapTotal),
        heapUsed: formatBytes(memoryUsage.heapUsed),
        external: formatBytes(memoryUsage.external),
        arrayBuffers: formatBytes(memoryUsage.arrayBuffers)
      },
      system: {
        total: formatBytes(totalMemory),
        free: formatBytes(freeMemory),
        used: formatBytes(totalMemory - freeMemory),
        usagePercent: ((totalMemory - freeMemory) / totalMemory * 100).toFixed(2)
      }
    };

    // CPU information
    const cpuInfo = {
      cores: os.cpus().length,
      model: os.cpus()[0]?.model || 'Unknown',
      loadAverage: os.loadavg()
    };

    // Database health check
    const dbStartTime = Date.now();
    let dbStatus = {
      connected: false,
      state: 'disconnected',
      responseTime: 0,
      error: null
    };

    try {
      const dbState = mongoose.connection.readyState;
      const states = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
      };
      
      dbStatus.state = states[dbState] || 'unknown';
      dbStatus.connected = dbState === 1;

      if (dbState === 1) {
        // Test database query
        await mongoose.connection.db.admin().ping();
        dbStatus.responseTime = Date.now() - dbStartTime;
      } else {
        dbStatus.error = `Database is ${dbStatus.state}`;
      }
    } catch (error) {
      dbStatus.error = error.message;
      dbStatus.responseTime = Date.now() - dbStartTime;
    }

    // Database statistics
    let dbStats = null;
    if (dbStatus.connected) {
      try {
        const stats = await mongoose.connection.db.stats();
        dbStats = {
          collections: stats.collections,
          dataSize: formatBytes(stats.dataSize),
          storageSize: formatBytes(stats.storageSize),
          indexes: stats.indexes,
          indexSize: formatBytes(stats.indexSize),
          objects: stats.objects
        };
      } catch (error) {
        dbStats = { error: error.message };
      }
    }

    // API response time
    const apiResponseTime = Date.now() - startTime;

    // Overall health status
    const healthStatus = {
      status: 'healthy',
      issues: []
    };

    if (!dbStatus.connected) {
      healthStatus.status = 'unhealthy';
      healthStatus.issues.push('Database is not connected');
    }

    if (parseFloat(memoryInfo.system.usagePercent) > 90) {
      healthStatus.status = 'warning';
      healthStatus.issues.push('High memory usage');
    }

    if (dbStatus.responseTime > 1000) {
      healthStatus.status = 'warning';
      healthStatus.issues.push('Slow database response');
    }

    if (healthStatus.issues.length === 0) {
      healthStatus.message = 'All systems operational';
    }

    res.json({
      success: true,
      message: 'Health check completed',
      timestamp: new Date().toISOString(),
      health: healthStatus,
      server: {
        status: 'running',
        ...systemInfo
      },
      database: {
        ...dbStatus,
        stats: dbStats
      },
      memory: memoryInfo,
      cpu: cpuInfo,
      performance: {
        apiResponseTime: `${apiResponseTime}ms`,
        databaseResponseTime: dbStatus.responseTime > 0 ? `${dbStatus.responseTime}ms` : 'N/A'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Create Thumbnail
 * Create a new thumbnail with title and image (stored in S3)
 */
const createThumbnail = async (req, res) => {
  try {
    const { title, description, order } = req.body;
    const superAdminId = req.user.userId;

    // Validate title
    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Title is required and cannot be empty'
      });
    }

    // Validate image file
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Image file is required. Please upload an image using the "image" field name.',
        hint: 'Use multipart/form-data with field name "image"'
      });
    }

    // Validate file type
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed',
        receivedType: req.file.mimetype
      });
    }

    // Check if thumbnail with same title exists
    const existingThumbnail = await Thumbnail.findOne({ title: title.trim() });
    if (existingThumbnail) {
      return res.status(400).json({
        success: false,
        message: 'Thumbnail with this title already exists'
      });
    }

    // Process and upload image to S3 (reduced quality for thumbnails: 60% quality, max 600x600)
    // All thumbnails are converted to JPEG format for consistency and smaller file size
    const processedImage = await processImage(req.file.buffer, 600, 600, 60);
    const fileName = `${Date.now()}-${title.trim().replace(/\s+/g, '-')}.jpg`;
    
    // Upload to S3 in thumbnails folder
    const imageUrl = await uploadToS3(processedImage, fileName, 'image/jpeg', 'thumbnails');

    // Create thumbnail
    const thumbnail = new Thumbnail({
      title: title.trim(),
      image: imageUrl,
      description: description || null,
      order: order ? parseInt(order) : 0,
      createdBy: superAdminId,
      isActive: true
    });

    await thumbnail.save();

    res.status(201).json({
      success: true,
      message: 'Thumbnail created successfully',
      data: thumbnail
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating thumbnail',
      error: error.message
    });
  }
};

/**
 * Get All Thumbnails (Super Admin)
 * Get all thumbnails with pagination
 */
const getAllThumbnails = async (req, res) => {
  try {
    const { page = 1, limit = 20, isActive, sortBy = 'order', sortOrder = 'asc' } = req.query;

    const query = {};
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const thumbnails = await Thumbnail.find(query)
      .populate('createdBy', 'userId firstName lastName')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Thumbnail.countDocuments(query);

    res.json({
      success: true,
      message: 'Thumbnails retrieved successfully',
      data: {
        thumbnails,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving thumbnails',
      error: error.message
    });
  }
};

/**
 * Get Thumbnail by ID (Super Admin)
 */
const getThumbnailById = async (req, res) => {
  try {
    const { id } = req.params;

    const thumbnail = await Thumbnail.findById(id)
      .populate('createdBy', 'userId firstName lastName');

    if (!thumbnail) {
      return res.status(404).json({
        success: false,
        message: 'Thumbnail not found'
      });
    }

    res.json({
      success: true,
      message: 'Thumbnail retrieved successfully',
      data: thumbnail
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving thumbnail',
      error: error.message
    });
  }
};

/**
 * Update Thumbnail
 * Update thumbnail title, description, order, or image
 */
const updateThumbnail = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, order, isActive } = req.body;

    const thumbnail = await Thumbnail.findById(id);
    if (!thumbnail) {
      return res.status(404).json({
        success: false,
        message: 'Thumbnail not found'
      });
    }

    // Check if title is being changed and if new title already exists
    if (title && title.trim() !== thumbnail.title) {
      const existingThumbnail = await Thumbnail.findOne({ title: title.trim() });
      if (existingThumbnail) {
        return res.status(400).json({
          success: false,
          message: 'Thumbnail with this title already exists'
        });
      }
      thumbnail.title = title.trim();
    }

    // Update image if new file is provided
    if (req.file) {
      // Delete old image from S3
      if (thumbnail.image) {
        try {
          await deleteFromS3(thumbnail.image);
        } catch (error) {
          console.error('Error deleting old thumbnail from S3:', error);
        }
      }

      // Process and upload new image to S3 (reduced quality for thumbnails: 60% quality, max 600x600)
      // All thumbnails are converted to JPEG format for consistency and smaller file size
      const processedImage = await processImage(req.file.buffer, 600, 600, 60);
      const fileName = `${Date.now()}-${thumbnail.title.replace(/\s+/g, '-')}.jpg`;
      
      // Upload to S3 in thumbnails folder
      thumbnail.image = await uploadToS3(processedImage, fileName, 'image/jpeg', 'thumbnails');
    }

    if (description !== undefined) {
      thumbnail.description = description || null;
    }

    if (order !== undefined) {
      thumbnail.order = parseInt(order);
    }

    if (isActive !== undefined) {
      thumbnail.isActive = isActive === 'true';
    }

    await thumbnail.save();

    res.json({
      success: true,
      message: 'Thumbnail updated successfully',
      data: thumbnail
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating thumbnail',
      error: error.message
    });
  }
};

/**
 * Delete Thumbnail
 */
const deleteThumbnail = async (req, res) => {
  try {
    const { id } = req.params;

    const thumbnail = await Thumbnail.findById(id);
    if (!thumbnail) {
      return res.status(404).json({
        success: false,
        message: 'Thumbnail not found'
      });
    }

    // Delete image from S3
    if (thumbnail.image) {
      try {
        await deleteFromS3(thumbnail.image);
      } catch (error) {
        console.error('Error deleting thumbnail from S3:', error);
      }
    }

    await Thumbnail.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Thumbnail deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting thumbnail',
      error: error.message
    });
  }
};

/**
 * Helper function to format bytes
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Helper function to format uptime
 */
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m ${secs}s`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

/**
 * Get Analytics Report
 * Comprehensive financial analytics including trial balance, income/expenses, money distribution, assets/liabilities
 * Optimized using aggregation pipelines for fast response
 */
const getAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, period = 'all' } = req.query;

    let dateFilter = {};
    let periodLabel = 'All Time';

    // Set date range based on period or custom dates
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter = { createdAt: { $gte: start, $lte: end } };
      periodLabel = `${startDate} to ${endDate}`;
    } else if (period === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      dateFilter = { createdAt: { $gte: today, $lt: tomorrow } };
      periodLabel = 'Today';
    } else if (period === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      weekAgo.setHours(0, 0, 0, 0);
      dateFilter = { createdAt: { $gte: weekAgo } };
      periodLabel = 'Last 7 Days';
    } else if (period === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      monthAgo.setHours(0, 0, 0, 0);
      dateFilter = { createdAt: { $gte: monthAgo } };
      periodLabel = 'Last 30 Days';
    } else if (period === 'year') {
      const yearAgo = new Date();
      yearAgo.setFullYear(yearAgo.getFullYear() - 1);
      yearAgo.setHours(0, 0, 0, 0);
      dateFilter = { createdAt: { $gte: yearAgo } };
      periodLabel = 'Last 12 Months';
    }

    // Parallel queries for all analytics
    const [
      revenueData,
      expenseData,
      commissionDistribution,
      walletBalances,
      transactionSummary,
      moneyDistribution
    ] = await Promise.all([
      // Revenue (Income) - Subscriptions and Course Purchases
      Promise.all([
        StudentSubscription.aggregate([
          {
            $match: {
              paymentStatus: 'COMPLETED',
              ...dateFilter
            }
          },
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: '$amount' },
              count: { $sum: 1 },
              byMonth: {
                $push: {
                  month: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
                  amount: '$amount'
                }
              }
            }
          }
        ]),
        StudentCoursePurchase.aggregate([
          {
            $match: {
              paymentStatus: 'COMPLETED',
              ...dateFilter
            }
          },
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: '$amount' },
              count: { $sum: 1 }
            }
          }
        ])
      ]).then(([subs, courses]) => ({
        subscriptions: {
          total: subs[0]?.totalRevenue || 0,
          count: subs[0]?.count || 0
        },
        courses: {
          total: courses[0]?.totalRevenue || 0,
          count: courses[0]?.count || 0
        },
        total: (subs[0]?.totalRevenue || 0) + (courses[0]?.totalRevenue || 0),
        totalTransactions: (subs[0]?.count || 0) + (courses[0]?.count || 0)
      })),

      // Expenses - Commissions Paid Out
      WalletTransaction.aggregate([
        {
          $match: {
            type: 'COMMISSION',
            status: 'COMPLETED',
            ...dateFilter
          }
        },
        {
          $group: {
            _id: null,
            totalExpenses: { $sum: '$amount' },
            count: { $sum: 1 },
            byRole: {
              $push: {
                role: '$userModel',
                amount: '$amount'
              }
            }
          }
        }
      ]).then(result => {
        if (!result[0]) {
          return {
            total: 0,
            count: 0,
            byRole: {}
          };
        }
        // Group by role
        const byRole = {};
        result[0].byRole.forEach(item => {
          if (!byRole[item.role]) {
            byRole[item.role] = 0;
          }
          byRole[item.role] += item.amount;
        });
        return {
          total: result[0].totalExpenses,
          count: result[0].count,
          byRole
        };
      }),

      // Commission Distribution by Role
      WalletTransaction.aggregate([
        {
          $match: {
            type: 'COMMISSION',
            status: 'COMPLETED',
            ...dateFilter
          }
        },
        {
          $group: {
            _id: '$userModel',
            totalCommissions: { $sum: '$amount' },
            count: { $sum: 1 },
            users: { $addToSet: '$user' }
          }
        },
        {
          $project: {
            role: '$_id',
            totalCommissions: 1,
            count: 1,
            uniqueUsers: { $size: '$users' }
          }
        }
      ]),

      // Wallet Balances (Assets - Money owed to users)
      Promise.all([
        Coordinator.aggregate([
          {
            $group: {
              _id: null,
              totalBalance: { $sum: { $ifNull: ['$wallet.balance', 0] } },
              totalEarned: { $sum: { $ifNull: ['$wallet.totalEarned', 0] } },
              totalWithdrawn: { $sum: { $ifNull: ['$wallet.totalWithdrawn', 0] } },
              count: { $sum: 1 }
            }
          }
        ]),
        DistrictCoordinator.aggregate([
          {
            $group: {
              _id: null,
              totalBalance: { $sum: { $ifNull: ['$wallet.balance', 0] } },
              totalEarned: { $sum: { $ifNull: ['$wallet.totalEarned', 0] } },
              totalWithdrawn: { $sum: { $ifNull: ['$wallet.totalWithdrawn', 0] } },
              count: { $sum: 1 }
            }
          }
        ]),
        TeamLeader.aggregate([
          {
            $group: {
              _id: null,
              totalBalance: { $sum: { $ifNull: ['$wallet.balance', 0] } },
              totalEarned: { $sum: { $ifNull: ['$wallet.totalEarned', 0] } },
              totalWithdrawn: { $sum: { $ifNull: ['$wallet.totalWithdrawn', 0] } },
              count: { $sum: 1 }
            }
          }
        ]),
        FieldEmployee.aggregate([
          {
            $group: {
              _id: null,
              totalBalance: { $sum: { $ifNull: ['$wallet.balance', 0] } },
              totalEarned: { $sum: { $ifNull: ['$wallet.totalEarned', 0] } },
              totalWithdrawn: { $sum: { $ifNull: ['$wallet.totalWithdrawn', 0] } },
              count: { $sum: 1 }
            }
          }
        ])
      ]).then(([coords, dcs, tls, fes]) => ({
        coordinators: coords[0] || { totalBalance: 0, totalEarned: 0, totalWithdrawn: 0, count: 0 },
        districtCoordinators: dcs[0] || { totalBalance: 0, totalEarned: 0, totalWithdrawn: 0, count: 0 },
        teamLeaders: tls[0] || { totalBalance: 0, totalEarned: 0, totalWithdrawn: 0, count: 0 },
        fieldEmployees: fes[0] || { totalBalance: 0, totalEarned: 0, totalWithdrawn: 0, count: 0 },
        total: {
          balance: (coords[0]?.totalBalance || 0) + (dcs[0]?.totalBalance || 0) + (tls[0]?.totalBalance || 0) + (fes[0]?.totalBalance || 0),
          earned: (coords[0]?.totalEarned || 0) + (dcs[0]?.totalEarned || 0) + (tls[0]?.totalEarned || 0) + (fes[0]?.totalEarned || 0),
          withdrawn: (coords[0]?.totalWithdrawn || 0) + (dcs[0]?.totalWithdrawn || 0) + (tls[0]?.totalWithdrawn || 0) + (fes[0]?.totalWithdrawn || 0)
        }
      })),

      // Transaction Summary
      Promise.all([
        WalletTransaction.aggregate([
          {
            $match: {
              ...dateFilter
            }
          },
          {
            $group: {
              _id: '$type',
              total: { $sum: '$amount' },
              count: { $sum: 1 }
            }
          }
        ]),
        StudentSubscription.aggregate([
          {
            $match: {
              paymentStatus: 'COMPLETED',
              ...dateFilter
            }
          },
          {
            $group: {
              _id: '$paymentStatus',
              total: { $sum: '$amount' },
              count: { $sum: 1 }
            }
          }
        ]),
        StudentCoursePurchase.aggregate([
          {
            $match: {
              paymentStatus: 'COMPLETED',
              ...dateFilter
            }
          },
          {
            $group: {
              _id: '$paymentStatus',
              total: { $sum: '$amount' },
              count: { $sum: 1 }
            }
          }
        ])
      ]).then(([wallet, subs, courses]) => ({
        walletTransactions: wallet.reduce((acc, item) => {
          acc[item._id] = { total: item.total, count: item.count };
          return acc;
        }, {}),
        subscriptions: subs.reduce((acc, item) => {
          acc[item._id] = { total: item.total, count: item.count };
          return acc;
        }, {}),
        coursePurchases: courses.reduce((acc, item) => {
          acc[item._id] = { total: item.total, count: item.count };
          return acc;
        }, {})
      })),

      // Money Distribution Breakdown
      WalletTransaction.aggregate([
        {
          $match: {
            type: 'COMMISSION',
            status: 'COMPLETED',
            ...dateFilter
          }
        },
        {
          $group: {
            _id: {
              role: '$userModel',
              month: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }
            },
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.month': 1, '_id.role': 1 } }
      ])
    ]);

    // Calculate Trial Balance
    const trialBalance = {
      debits: {
        expenses: expenseData.total,
        walletBalances: walletBalances.total.balance, // Money owed to users
        total: expenseData.total + walletBalances.total.balance
      },
      credits: {
        revenue: revenueData.total,
        total: revenueData.total
      },
      balance: revenueData.total - (expenseData.total + walletBalances.total.balance)
    };

    // Income Statement
    const incomeStatement = {
      revenue: {
        subscriptions: revenueData.subscriptions.total,
        courses: revenueData.courses.total,
        total: revenueData.total
      },
      expenses: {
        commissions: expenseData.total,
        total: expenseData.total
      },
      netIncome: revenueData.total - expenseData.total,
      grossProfit: revenueData.total,
      operatingExpenses: expenseData.total
    };

    // Balance Sheet
    const balanceSheet = {
      assets: {
        cash: revenueData.total - expenseData.total - walletBalances.total.balance, // Net cash after expenses and pending payouts
        accountsReceivable: 0, // Can be extended if needed
        total: revenueData.total - expenseData.total - walletBalances.total.balance
      },
      liabilities: {
        accountsPayable: walletBalances.total.balance, // Money owed to users (wallet balances)
        commissionsPayable: walletBalances.total.earned - walletBalances.total.withdrawn, // Unpaid commissions
        total: walletBalances.total.balance + (walletBalances.total.earned - walletBalances.total.withdrawn)
      },
      equity: {
        retainedEarnings: incomeStatement.netIncome - walletBalances.total.balance,
        total: incomeStatement.netIncome - walletBalances.total.balance
      },
      total: (revenueData.total - expenseData.total - walletBalances.total.balance) + 
             (walletBalances.total.balance + (walletBalances.total.earned - walletBalances.total.withdrawn)) +
             (incomeStatement.netIncome - walletBalances.total.balance)
    };

    res.json({
      success: true,
      message: 'Analytics report retrieved successfully',
      period: periodLabel,
      dateRange: dateFilter.createdAt || { message: 'All time' },
      data: {
        trialBalance,
        incomeStatement,
        balanceSheet,
        revenue: revenueData,
        expenses: expenseData,
        commissionDistribution: {
          byRole: commissionDistribution.reduce((acc, item) => {
            acc[item.role] = {
              totalCommissions: item.totalCommissions,
              transactions: item.count,
              uniqueUsers: item.uniqueUsers
            };
            return acc;
          }, {}),
          total: commissionDistribution.reduce((sum, item) => sum + item.totalCommissions, 0)
        },
        walletBalances,
        moneyDistribution: {
          byRole: moneyDistribution.reduce((acc, item) => {
            if (!acc[item._id.role]) {
              acc[item._id.role] = [];
            }
            acc[item._id.role].push({
              month: item._id.month,
              amount: item.total,
              transactions: item.count
            });
            return acc;
          }, {}),
          summary: moneyDistribution.reduce((acc, item) => {
            if (!acc[item._id.role]) {
              acc[item._id.role] = 0;
            }
            acc[item._id.role] += item.total;
            return acc;
          }, {})
        },
        transactionSummary
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving analytics report',
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
  getUserDetails,
  getDashboard,
  getHealthCheck,
  getAnalytics,
  createThumbnail,
  getAllThumbnails,
  getThumbnailById,
  updateThumbnail,
  deleteThumbnail,
  getCommissionSettings,
  createCommissionSettings,
  updateCommissionSettings
};

