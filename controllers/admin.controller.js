const Admin = require('../models/admin.model');
const DistrictCoordinator = require('../models/districtCoordinator.model');
const Coordinator = require('../models/coordinator.model');
const District = require('../models/district.model');
const SuperAdmin = require('../models/superAdmin.model');
const TaskLevel = require('../models/taskLevel.model');
const TeamLeader = require('../models/teamLeader.model');
const FieldEmployee = require('../models/fieldEmployee.model');
const { encryptPassword, decryptPassword, comparePassword } = require('../services/passwordService');
const { generateUserId, getNextSequenceNumber } = require('../services/userIdService');
const { generateToken } = require('../middleware/auth');
const { USER_ROLES } = require('../utils/constants');
const { createUser } = require('../services/userCreationService');
const { canCreateUserType } = require('../middleware/auth');
const { processImage, getFileExtension } = require('../services/imageProcessingService');
const { uploadToS3 } = require('../services/awsS3Service');

/**
 * Admin Signup (should be created by Super Admin, but can have self-signup for first admin)
 */
const signup = async (req, res) => {
  try {
    const { email, mobileNumber, password, firstName, lastName, latitude, longitude } = req.body;

    const existingUser = await Admin.findOne({
      $or: [{ email }, { mobileNumber }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Admin already exists with this email or mobile number'
      });
    }

    const count = await Admin.countDocuments();
    const sequenceNumber = getNextSequenceNumber(count);
    const userId = generateUserId(USER_ROLES.ADMIN, sequenceNumber);

    const encryptedPassword = encryptPassword(password);

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
      createdBy: req.body.createdBy || null,
      createdAt: new Date() // Explicitly set creation time
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
        createdAt: admin.createdAt
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
 * Admin Login
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

    const admin = await Admin.findOne({
      $or: [
        { email: identifier },
        { mobileNumber: identifier },
        { userId: identifier }
      ]
    });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    if (!admin.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    const isPasswordValid = comparePassword(password, admin.encryptedPassword);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const token = generateToken(admin);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          _id: admin._id,
          userId: admin.userId,
          email: admin.email,
          mobileNumber: admin.mobileNumber,
          firstName: admin.firstName,
          lastName: admin.lastName,
          role: admin.role,
          profilePicture: admin.profilePicture || null,
          latitude: admin.latitude || null,
          longitude: admin.longitude || null
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
 * Create District Coordinator (by Admin)
 */
const createDistrictCoordinator = async (req, res) => {
  try {
    const { 
      email, 
      mobileNumber, 
      password, 
      firstName, 
      lastName, 
      district, 
      districtId,
      areaRange,
      boundingBox,
      latitude,
      longitude,
      coordinatorIds // Array or comma-separated string of Coordinator IDs
    } = req.body;
    const createdBy = req.user.userId;

    // Handle profile picture upload if provided
    let profilePictureUrl = null;
    if (req.file) {
      try {
        const processedImage = await processImage(req.file.buffer);
        const fileExtension = getFileExtension(req.file.mimetype);
        const fileName = `dc-${Date.now()}.${fileExtension}`;
        profilePictureUrl = await uploadToS3(processedImage, fileName, req.file.mimetype);
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: 'Error processing profile picture',
          error: error.message
        });
      }
    }

    const existingUser = await DistrictCoordinator.findOne({
      $or: [{ email }, { mobileNumber }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'District Coordinator already exists with this email or mobile number'
      });
    }

    // If districtId is provided, verify district exists
    let districtDoc = null;
    let finalDistrict = district;
    if (districtId) {
      districtDoc = await District.findById(districtId);
      if (!districtDoc) {
        return res.status(404).json({
          success: false,
          message: 'District not found with the provided districtId'
        });
      }
      // Use district name from the district document
      if (!district) {
        finalDistrict = districtDoc.name;
      }
    } else if (!district) {
      return res.status(400).json({
        success: false,
        message: 'Either district name or districtId is required'
      });
    }

    const count = await DistrictCoordinator.countDocuments();
    const sequenceNumber = getNextSequenceNumber(count);
    const userId = generateUserId(USER_ROLES.DISTRICT_COORDINATOR, sequenceNumber);

    const encryptedPassword = encryptPassword(password);

    const admin = await Admin.findById(createdBy);

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

    const districtCoordinator = new DistrictCoordinator({
      userId,
      email,
      mobileNumber,
      password: encryptedPassword,
      encryptedPassword: encryptedPassword,
      firstName,
      lastName,
      profilePicture: profilePictureUrl,
      district: finalDistrict,
      districtRef: districtId || null,
      // Use provided location data or inherit from district if available
      latitude: latitude ? parseFloat(latitude) : (districtDoc?.centerPoint?.latitude || null),
      longitude: longitude ? parseFloat(longitude) : (districtDoc?.centerPoint?.longitude || null),
      areaRange: parsedAreaRange || districtDoc?.areaRange || undefined,
      boundingBox: parsedBoundingBox || districtDoc?.boundingBox || undefined,
      createdBy: admin._id
    });

    await districtCoordinator.save();

    // If coordinatorIds were provided, assign these coordinators to the new DC
    if (coordinatorIds) {
      let ids = [];
      if (Array.isArray(coordinatorIds)) {
        ids = coordinatorIds;
      } else if (typeof coordinatorIds === 'string') {
        ids = coordinatorIds.split(',').map(id => id.trim());
      }

      if (ids.length > 0) {
        await Coordinator.updateMany(
          { _id: { $in: ids } },
          { 
            $set: { 
              createdBy: districtCoordinator._id,
              district: finalDistrict,
              districtRef: districtId || null
            } 
          }
        );
      }
    }

    // If districtId was provided, update the district to assign this coordinator
    if (districtId && districtDoc) {
      districtDoc.districtCoordinator = districtCoordinator._id;
      await districtDoc.save();
    }

    // Populate district reference if exists
    if (districtCoordinator.districtRef) {
      await districtCoordinator.populate('districtRef', 'name description areaRange boundingBox centerPoint');
    }

    res.status(201).json({
      success: true,
      message: 'District Coordinator created successfully',
      data: {
        _id: districtCoordinator._id,
        userId: districtCoordinator.userId,
        email: districtCoordinator.email,
        mobileNumber: districtCoordinator.mobileNumber,
        firstName: districtCoordinator.firstName,
        lastName: districtCoordinator.lastName,
        profilePicture: districtCoordinator.profilePicture,
        district: districtCoordinator.district,
        districtRef: districtCoordinator.districtRef,
        latitude: districtCoordinator.latitude,
        longitude: districtCoordinator.longitude,
        areaRange: districtCoordinator.areaRange,
        boundingBox: districtCoordinator.boundingBox,
        role: districtCoordinator.role,
        createdBy: districtCoordinator.createdBy,
        taskLevels: districtCoordinator.taskLevels || [],
        assignedTeamLeaders: districtCoordinator.assignedTeamLeaders || []
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating district coordinator',
      error: error.message
    });
  }
};

/**
 * Create any downline user (Generic function for Admin)
 * Admin can create: District Coordinator, Coordinator, Field Manager, Team Leader, Field Employee
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
      districtId,
      areaRange,
      boundingBox,
      latitude,
      longitude
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

    // For District Coordinator: districtId is preferred, but district name is also acceptable
    // For other roles: district is required
    let finalDistrict = district;
    if (userType === USER_ROLES.DISTRICT_COORDINATOR) {
      if (!districtId && !district) {
        return res.status(400).json({
          success: false,
          message: 'Either district name or districtId is required for District Coordinator'
        });
      }
      
      // If districtId is provided, verify district exists
      if (districtId) {
        const districtDoc = await District.findById(districtId);
        if (!districtDoc) {
          return res.status(404).json({
            success: false,
            message: 'District not found with the provided districtId'
          });
        }
        // Use district name from the district document if not provided
        if (!district) {
          finalDistrict = districtDoc.name;
        }
      }
    } else {
      // District is required for other user types
      if (!district) {
        return res.status(400).json({
          success: false,
          message: 'District is required for this user type'
        });
      }
    }

    // Handle profile picture upload if provided
    let profilePictureUrl = null;
    if (req.file) {
      try {
        // Process image with Jimp
        const processedImage = await processImage(req.file.buffer);
        const fileExtension = getFileExtension(req.file.mimetype);
        const fileName = `${userType.toLowerCase()}-${Date.now()}.${fileExtension}`;

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
      district: finalDistrict,
      profilePicture: profilePictureUrl,
      areaRange: parsedAreaRange,
      boundingBox: parsedBoundingBox,
      latitude,
      longitude
    }, creator);

    // If districtId is provided for District Coordinator, assign the district
    if (userType === USER_ROLES.DISTRICT_COORDINATOR && districtId) {
      const districtDoc = await District.findById(districtId);
      if (districtDoc) {
        // Update district coordinator with district reference
        newUser.districtRef = districtId;
        await newUser.save();
        
        // Update district to assign this coordinator
        districtDoc.districtCoordinator = newUser._id;
        await districtDoc.save();
      }
      
      // Populate district reference
      await newUser.populate('districtRef', 'name description areaRange boundingBox centerPoint');
    }

    // Return response
    const responseData = {
      _id: newUser._id,
      userId: newUser.userId,
      email: newUser.email,
      mobileNumber: newUser.mobileNumber,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      role: newUser.role,
      district: newUser.district,
      createdBy: newUser.createdBy,
      createdAt: newUser.createdAt
    };

    // Add districtRef if exists (for District Coordinator)
    if (newUser.districtRef) {
      responseData.districtRef = newUser.districtRef;
    }

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
 * Get all users under admin hierarchy
 */
const getMyUsers = async (req, res) => {
  try {
    const adminId = req.user.userId;
    const { getModelByRole } = require('../utils/userModelMapper');
    
    const users = [];
    
    // Get district coordinators created by this admin
    const districtCoordinators = await DistrictCoordinator.find({ createdBy: adminId });
    users.push(...districtCoordinators);

    // Get all users under each district coordinator
    const Coordinator = require('../models/coordinator.model');
    const FieldManager = require('../models/fieldManager.model');
    const TeamLeader = require('../models/teamLeader.model');
    const FieldEmployee = require('../models/fieldEmployee.model');

    for (const dc of districtCoordinators) {
      const coordinators = await Coordinator.find({ createdBy: dc._id });
      users.push(...coordinators);

      for (const coord of coordinators) {
        const fieldManagers = await FieldManager.find({ createdBy: coord._id });
        users.push(...fieldManagers);

        for (const fm of fieldManagers) {
          const teamLeaders = await TeamLeader.find({ createdBy: fm._id });
          users.push(...teamLeaders);

          for (const tl of teamLeaders) {
            const fieldEmployees = await FieldEmployee.find({ createdBy: tl._id });
            users.push(...fieldEmployees);
          }
        }
      }
    }

    res.json({
      success: true,
      message: 'Users retrieved successfully',
      data: users.map(user => ({
        _id: user._id,
        userId: user.userId,
        email: user.email,
        mobileNumber: user.mobileNumber,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        district: user.district || null
      })),
      count: users.length
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
 * Create District
 * Admin or Super Admin can create districts with area ranges
 */
const createDistrict = async (req, res) => {
  try {
    const { 
      name, 
      description, 
      areaRange, // GeoJSON Polygon coordinates: [[[lng, lat], [lng, lat], ...]]
      boundingBox, // { minLatitude, maxLatitude, minLongitude, maxLongitude }
      centerPoint // { latitude, longitude }
    } = req.body;

    const creator = req.user;

    // Validate creator is Admin or Super Admin
    if (creator.role !== USER_ROLES.ADMIN && creator.role !== USER_ROLES.SUPER_ADMIN) {
      return res.status(403).json({
        success: false,
        message: 'Only Admin or Super Admin can create districts'
      });
    }

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'District name is required'
      });
    }

    // Check if district already exists
    const existingDistrict = await District.findOne({ name: name.trim() });
    if (existingDistrict) {
      return res.status(400).json({
        success: false,
        message: 'District with this name already exists'
      });
    }

    // Validate area range format if provided
    if (areaRange && areaRange.coordinates) {
      if (!Array.isArray(areaRange.coordinates) || areaRange.coordinates.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid area range coordinates format. Expected array of coordinate arrays.'
        });
      }
    }

    // Determine createdBy model
    const createdByModel = creator.role === USER_ROLES.SUPER_ADMIN ? 'SuperAdmin' : 'Admin';
    const creatorModel = creator.role === USER_ROLES.SUPER_ADMIN ? SuperAdmin : Admin;
    const creatorDoc = await creatorModel.findById(creator.userId);

    if (!creatorDoc) {
      return res.status(404).json({
        success: false,
        message: 'Creator not found'
      });
    }

    // Create district (without district coordinator - will be assigned when coordinator is created)
    const district = new District({
      name: name.trim(),
      description: description ? description.trim() : null,
      areaRange: areaRange || null,
      boundingBox: boundingBox || null,
      centerPoint: centerPoint || null,
      districtCoordinator: null, // District coordinator will be assigned when coordinator is created
      createdBy: creatorDoc._id,
      createdByModel: createdByModel
    });

    await district.save();

    res.status(201).json({
      success: true,
      message: 'District created successfully',
      data: {
        _id: district._id,
        name: district.name,
        description: district.description,
        areaRange: district.areaRange,
        boundingBox: district.boundingBox,
        centerPoint: district.centerPoint,
        districtCoordinator: null, // Will be assigned when district coordinator is created
        isActive: district.isActive,
        createdAt: district.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating district',
      error: error.message
    });
  }
};

/**
 * Get All Districts
 */
const getDistricts = async (req, res) => {
  try {
    const { isActive } = req.query;
    const query = {};
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const districts = await District.find(query)
      .populate('districtCoordinator', 'userId firstName lastName email mobileNumber')
      .sort({ name: 1 });

    res.json({
      success: true,
      message: 'Districts retrieved successfully',
      data: districts,
      count: districts.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving districts',
      error: error.message
    });
  }
};

/**
 * Update District
 */
const updateDistrict = async (req, res) => {
  try {
    const { districtId } = req.params;
    const { 
      name, 
      description, 
      areaRange, 
      boundingBox, 
      centerPoint,
      isActive 
    } = req.body;

    const district = await District.findById(districtId);
    if (!district) {
      return res.status(404).json({
        success: false,
        message: 'District not found'
      });
    }

    // Update fields
    if (name !== undefined) {
      // Check if new name conflicts with existing district
      const existingDistrict = await District.findOne({ 
        name: name.trim(), 
        _id: { $ne: districtId } 
      });
      if (existingDistrict) {
        return res.status(400).json({
          success: false,
          message: 'District with this name already exists'
        });
      }
      district.name = name.trim();
    }

    if (description !== undefined) {
      district.description = description ? description.trim() : null;
    }

    if (areaRange !== undefined) {
      district.areaRange = areaRange;
    }

    if (boundingBox !== undefined) {
      district.boundingBox = boundingBox;
    }

    if (centerPoint !== undefined) {
      district.centerPoint = centerPoint;
    }

    if (isActive !== undefined) {
      district.isActive = isActive;
    }

    await district.save();
    await district.populate('districtCoordinator', 'userId firstName lastName email mobileNumber');

    res.json({
      success: true,
      message: 'District updated successfully',
      data: {
        _id: district._id,
        name: district.name,
        description: district.description,
        areaRange: district.areaRange,
        boundingBox: district.boundingBox,
        centerPoint: district.centerPoint,
        districtCoordinator: district.districtCoordinator,
        isActive: district.isActive,
        updatedAt: district.updatedAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating district',
      error: error.message
    });
  }
};

/**
 * Assign District to District Coordinator
 */
const assignDistrictToCoordinator = async (req, res) => {
  try {
    const { districtId, districtCoordinatorId } = req.body;

    if (!districtId || !districtCoordinatorId) {
      return res.status(400).json({
        success: false,
        message: 'District ID and District Coordinator ID are required'
      });
    }

    const district = await District.findById(districtId);
    if (!district) {
      return res.status(404).json({
        success: false,
        message: 'District not found'
      });
    }

    const districtCoordinator = await DistrictCoordinator.findById(districtCoordinatorId);
    if (!districtCoordinator) {
      return res.status(404).json({
        success: false,
        message: 'District Coordinator not found'
      });
    }

    // Update district
    district.districtCoordinator = districtCoordinatorId;
    await district.save();

    // Update district coordinator
    districtCoordinator.districtRef = districtId;
    if (!districtCoordinator.district) {
      districtCoordinator.district = district.name; // Keep backward compatibility
    }
    await districtCoordinator.save();

    await district.populate('districtCoordinator', 'userId firstName lastName email mobileNumber');

    res.json({
      success: true,
      message: 'District assigned to District Coordinator successfully',
      data: {
        district: {
          _id: district._id,
          name: district.name,
          districtCoordinator: district.districtCoordinator
        },
        districtCoordinator: {
          _id: districtCoordinator._id,
          userId: districtCoordinator.userId,
          firstName: districtCoordinator.firstName,
          lastName: districtCoordinator.lastName,
          districtRef: districtCoordinator.districtRef
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error assigning district to coordinator',
      error: error.message
    });
  }
};

/**
 * Assign Area Range to Coordinator
 */
const assignAreaRangeToCoordinator = async (req, res) => {
  try {
    const { coordinatorId, areaRange, boundingBox, districtId } = req.body;

    if (!coordinatorId) {
      return res.status(400).json({
        success: false,
        message: 'Coordinator ID is required'
      });
    }

    const coordinator = await Coordinator.findById(coordinatorId);
    if (!coordinator) {
      return res.status(404).json({
        success: false,
        message: 'Coordinator not found'
      });
    }

    // Update area range
    if (areaRange !== undefined) {
      coordinator.areaRange = areaRange;
    }

    if (boundingBox !== undefined) {
      coordinator.boundingBox = boundingBox;
    }

    // Update district reference if provided
    if (districtId) {
      const district = await District.findById(districtId);
      if (!district) {
        return res.status(404).json({
          success: false,
          message: 'District not found'
        });
      }
      coordinator.districtRef = districtId;
      if (!coordinator.district) {
        coordinator.district = district.name; // Keep backward compatibility
      }
    }

    await coordinator.save();

    res.json({
      success: true,
      message: 'Area range assigned to Coordinator successfully',
      data: {
        _id: coordinator._id,
        userId: coordinator.userId,
        firstName: coordinator.firstName,
        lastName: coordinator.lastName,
        areaRange: coordinator.areaRange,
        boundingBox: coordinator.boundingBox,
        districtRef: coordinator.districtRef,
        district: coordinator.district
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error assigning area range to coordinator',
      error: error.message
    });
  }
};

/**
 * Get all District Coordinators
 */
const getDistrictCoordinators = async (req, res) => {
  try {
    const { isActive } = req.query;
    const query = {};

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const districtCoordinators = await DistrictCoordinator.find(query)
      .populate('districtRef', 'name description areaRange boundingBox centerPoint')
      .populate('createdBy', 'userId firstName lastName email mobileNumber')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      message: 'District Coordinators retrieved successfully',
      data: districtCoordinators,
      count: districtCoordinators.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving district coordinators',
      error: error.message
    });
  }
};

/**
 * Get District Coordinator details with decrypted password
 */
const getDistrictCoordinatorDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const mongoose = require('mongoose');

    // Check if id is a valid MongoDB ObjectId
    const isValidObjectId = mongoose.Types.ObjectId.isValid(id);
    const searchQuery = isValidObjectId 
      ? { $or: [{ _id: id }, { userId: id }] }
      : { userId: id };

    const districtCoordinator = await DistrictCoordinator.findOne(searchQuery)
      .populate('districtRef', 'name description areaRange boundingBox centerPoint')
      .populate('createdBy', 'userId firstName lastName email mobileNumber');

    if (!districtCoordinator) {
      return res.status(404).json({
        success: false,
        message: 'District Coordinator not found'
      });
    }

    const userData = districtCoordinator.toObject();

    // Fetch coordinators under this district coordinator
    const coordinators = await Coordinator.find({ createdBy: districtCoordinator._id })
      .select('userId firstName lastName email mobileNumber isActive');
    userData.coordinators = coordinators;

    // Populate task levels and assigned team leaders
    await districtCoordinator.populate('taskLevels', 'name description level registrationLimit globalRegistrationCount');
    await districtCoordinator.populate('assignedTeamLeaders', 'userId firstName lastName email mobileNumber');
    await districtCoordinator.populate('assignedByCoordinator', 'userId firstName lastName email mobileNumber');
    userData.taskLevels = districtCoordinator.taskLevels;
    userData.assignedTeamLeaders = districtCoordinator.assignedTeamLeaders;
    userData.assignedByCoordinator = districtCoordinator.assignedByCoordinator;

    // Decrypt the password
    try {
      const encryptedPwd = districtCoordinator.encryptedPassword || districtCoordinator.password;
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
      message: 'District Coordinator details retrieved successfully',
      data: userData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving district coordinator details',
      error: error.message
    });
  }
};

/**
 * Get all Coordinators
 */
const getCoordinators = async (req, res) => {
  try {
    const { isActive } = req.query;
    const query = {};

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const coordinators = await Coordinator.find(query)
      .populate('districtRef', 'name description areaRange boundingBox centerPoint')
      .populate('createdBy', 'userId firstName lastName email mobileNumber')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      message: 'Coordinators retrieved successfully',
      data: coordinators,
      count: coordinators.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving coordinators',
      error: error.message
    });
  }
};

/**
 * Get Coordinator details with decrypted password
 */
const getCoordinatorDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const mongoose = require('mongoose');

    // Check if id is a valid MongoDB ObjectId
    const isValidObjectId = mongoose.Types.ObjectId.isValid(id);
    const searchQuery = isValidObjectId 
      ? { $or: [{ _id: id }, { userId: id }] }
      : { userId: id };

    const coordinator = await Coordinator.findOne(searchQuery)
      .populate('districtRef', 'name description areaRange boundingBox centerPoint')
      .populate('createdBy', 'userId firstName lastName email mobileNumber')
      .populate('taskLevels.taskLevel', 'name description level registrationLimit globalRegistrationCount')
      .populate('taskLevels.assignedBy', 'userId firstName lastName email')
      .populate('assignedDistrictCoordinators', 'userId firstName lastName email mobileNumber profilePicture district districtRef role');

    if (!coordinator) {
      return res.status(404).json({
        success: false,
        message: 'Coordinator not found'
      });
    }

    const userData = coordinator.toObject();

    // Decrypt the password
    try {
      const encryptedPwd = coordinator.encryptedPassword || coordinator.password;
      if (encryptedPwd) {
        const decryptedPassword = decryptPassword(encryptedPwd);
        userData.password = decryptedPassword;
      }
    } catch (error) {
      console.error('Password decryption error:', error);
      userData.password = 'Unable to decrypt password';
    }

    // Add task levels and registration info
    userData.taskLevels = coordinator.taskLevels;
    userData.registrationLimits = coordinator.registrationLimits;
    userData.registrationCounts = coordinator.registrationCounts;
    userData.assignedDistrictCoordinators = coordinator.assignedDistrictCoordinators;

    res.json({
      success: true,
      message: 'Coordinator details retrieved successfully',
      data: userData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving coordinator details',
      error: error.message
    });
  }
};

/**
 * Create Task Level (by Admin)
 */
const createTaskLevel = async (req, res) => {
  try {
    const { name, description, level } = req.body;
    const creator = req.user;

    // Validate creator is Admin or Super Admin
    if (creator.role !== USER_ROLES.ADMIN && creator.role !== USER_ROLES.SUPER_ADMIN) {
      return res.status(403).json({
        success: false,
        message: 'Only Admin or Super Admin can create task levels'
      });
    }

    if (!name || !level) {
      return res.status(400).json({
        success: false,
        message: 'Task level name and level number are required'
      });
    }

    // Check if level already exists
    const existingLevel = await TaskLevel.findOne({ 
      $or: [{ name: name.trim() }, { level: parseInt(level) }] 
    });
    if (existingLevel) {
      return res.status(400).json({
        success: false,
        message: 'Task level with this name or level number already exists'
      });
    }

    // Determine createdBy model
    const createdByModel = creator.role === USER_ROLES.SUPER_ADMIN ? 'SuperAdmin' : 'Admin';
    const creatorModel = creator.role === USER_ROLES.SUPER_ADMIN ? SuperAdmin : Admin;
    const creatorDoc = await creatorModel.findById(creator.userId);

    if (!creatorDoc) {
      return res.status(404).json({
        success: false,
        message: 'Creator not found'
      });
    }

    const taskLevel = new TaskLevel({
      name: name.trim(),
      description: description ? description.trim() : null,
      level: parseInt(level),
      registrationLimit: req.body.registrationLimit ? parseInt(req.body.registrationLimit) : 0,
      createdBy: creatorDoc._id,
      createdByModel: createdByModel
    });

    await taskLevel.save();

    res.status(201).json({
      success: true,
      message: 'Task level created successfully',
      data: {
        _id: taskLevel._id,
        name: taskLevel.name,
        description: taskLevel.description,
        level: taskLevel.level,
        registrationLimit: taskLevel.registrationLimit,
        globalRegistrationCount: taskLevel.globalRegistrationCount,
        isActive: taskLevel.isActive,
        createdAt: taskLevel.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating task level',
      error: error.message
    });
  }
};

/**
 * Get All Task Levels
 */
const getTaskLevels = async (req, res) => {
  try {
    const { isActive } = req.query;
    const query = {};
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const taskLevels = await TaskLevel.find(query)
      .populate('createdBy', 'userId firstName lastName email')
      .sort({ level: 1 });

    res.json({
      success: true,
      message: 'Task levels retrieved successfully',
      data: taskLevels,
      count: taskLevels.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving task levels',
      error: error.message
    });
  }
};

/**
 * Update Task Level
 */
const updateTaskLevel = async (req, res) => {
  try {
    const { taskLevelId } = req.params;
    const { name, description, level, isActive } = req.body;

    const taskLevel = await TaskLevel.findById(taskLevelId);
    if (!taskLevel) {
      return res.status(404).json({
        success: false,
        message: 'Task level not found'
      });
    }

    // Update fields
    if (name !== undefined) {
      // Check if new name conflicts with existing task level
      const existingLevel = await TaskLevel.findOne({ 
        name: name.trim(), 
        _id: { $ne: taskLevelId } 
      });
      if (existingLevel) {
        return res.status(400).json({
          success: false,
          message: 'Task level with this name already exists'
        });
      }
      taskLevel.name = name.trim();
    }

    if (description !== undefined) {
      taskLevel.description = description ? description.trim() : null;
    }

    if (level !== undefined) {
      // Check if new level conflicts with existing task level
      const existingLevel = await TaskLevel.findOne({ 
        level: parseInt(level), 
        _id: { $ne: taskLevelId } 
      });
      if (existingLevel) {
        return res.status(400).json({
          success: false,
          message: 'Task level with this level number already exists'
        });
      }
      taskLevel.level = parseInt(level);
    }

    if (req.body.registrationLimit !== undefined) {
      if (req.body.registrationLimit < taskLevel.globalRegistrationCount) {
        return res.status(400).json({
          success: false,
          message: `Registration limit cannot be less than current global count (${taskLevel.globalRegistrationCount})`
        });
      }
      taskLevel.registrationLimit = parseInt(req.body.registrationLimit);
    }

    if (isActive !== undefined) {
      taskLevel.isActive = isActive;
    }

    await taskLevel.save();

    res.json({
      success: true,
      message: 'Task level updated successfully',
      data: {
        _id: taskLevel._id,
        name: taskLevel.name,
        description: taskLevel.description,
        level: taskLevel.level,
        isActive: taskLevel.isActive,
        updatedAt: taskLevel.updatedAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating task level',
      error: error.message
    });
  }
};

/**
 * Assign Task Levels to Coordinator
 */
const assignTaskLevelsToCoordinator = async (req, res) => {
  try {
    const { coordinatorId, taskLevels } = req.body;

    if (!coordinatorId || !taskLevels || !Array.isArray(taskLevels)) {
      return res.status(400).json({
        success: false,
        message: 'Coordinator ID and array of task levels are required. Format: [{taskLevelId, registrationLimit?}]'
      });
    }

    const coordinator = await Coordinator.findById(coordinatorId);
    if (!coordinator) {
      return res.status(404).json({
        success: false,
        message: 'Coordinator not found'
      });
    }

    const creator = req.user;
    const assignedByModel = creator.role === USER_ROLES.SUPER_ADMIN ? 'SuperAdmin' : 
                           creator.role === USER_ROLES.DISTRICT_COORDINATOR ? 'DistrictCoordinator' : 'Admin';

    // Process each task level assignment
    const taskLevelAssignments = [];
    for (const taskLevelData of taskLevels) {
      const taskLevelId = typeof taskLevelData === 'string' ? taskLevelData : taskLevelData.taskLevelId;
      const registrationLimit = typeof taskLevelData === 'object' && taskLevelData.registrationLimit !== undefined 
        ? parseInt(taskLevelData.registrationLimit) 
        : 0;

      // Validate task level exists
      const taskLevel = await TaskLevel.findById(taskLevelId);
      if (!taskLevel) {
        return res.status(400).json({
          success: false,
          message: `Task level with ID ${taskLevelId} not found`
        });
      }

      // Check if already assigned, update if exists
      const existingIndex = coordinator.taskLevels.findIndex(
        tl => tl.taskLevel && tl.taskLevel.toString() === taskLevelId
      );

      if (existingIndex >= 0) {
        // Update existing assignment
        coordinator.taskLevels[existingIndex].registrationLimit = registrationLimit;
        coordinator.taskLevels[existingIndex].assignedAt = new Date();
        coordinator.taskLevels[existingIndex].assignedBy = creator.userId;
        coordinator.taskLevels[existingIndex].assignedByModel = assignedByModel;
      } else {
        // Add new assignment
        taskLevelAssignments.push({
          taskLevel: taskLevelId,
          registrationLimit: registrationLimit,
          registrationCount: 0,
          assignedAt: new Date(),
          assignedBy: creator.userId,
          assignedByModel: assignedByModel
        });
      }
    }

    // Add new assignments
    if (taskLevelAssignments.length > 0) {
      coordinator.taskLevels.push(...taskLevelAssignments);
    }

    await coordinator.save();

    // Populate task levels for response
    await coordinator.populate('taskLevels.taskLevel', 'name description level registrationLimit globalRegistrationCount');
    await coordinator.populate('taskLevels.assignedBy', 'userId firstName lastName email');

    res.json({
      success: true,
      message: 'Task levels assigned to coordinator successfully',
      data: {
        _id: coordinator._id,
        userId: coordinator.userId,
        firstName: coordinator.firstName,
        lastName: coordinator.lastName,
        taskLevels: coordinator.taskLevels
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error assigning task levels to coordinator',
      error: error.message
    });
  }
};

/**
 * Set Registration Limits for Coordinator
 */
const setCoordinatorRegistrationLimits = async (req, res) => {
  try {
    const { coordinatorId, level1Limit, level2Limit } = req.body;

    if (!coordinatorId) {
      return res.status(400).json({
        success: false,
        message: 'Coordinator ID is required'
      });
    }

    const coordinator = await Coordinator.findById(coordinatorId);
    if (!coordinator) {
      return res.status(404).json({
        success: false,
        message: 'Coordinator not found'
      });
    }

    if (level1Limit !== undefined) {
      if (level1Limit < coordinator.registrationCounts.level1) {
        return res.status(400).json({
          success: false,
          message: `Level 1 limit cannot be less than current count (${coordinator.registrationCounts.level1})`
        });
      }
      coordinator.registrationLimits.level1 = parseInt(level1Limit);
    }

    if (level2Limit !== undefined) {
      if (level2Limit < coordinator.registrationCounts.level2) {
        return res.status(400).json({
          success: false,
          message: `Level 2 limit cannot be less than current count (${coordinator.registrationCounts.level2})`
        });
      }
      coordinator.registrationLimits.level2 = parseInt(level2Limit);
    }

    await coordinator.save();

    res.json({
      success: true,
      message: 'Registration limits updated successfully',
      data: {
        _id: coordinator._id,
        userId: coordinator.userId,
        firstName: coordinator.firstName,
        lastName: coordinator.lastName,
        registrationLimits: coordinator.registrationLimits,
        registrationCounts: coordinator.registrationCounts
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error setting registration limits',
      error: error.message
    });
  }
};

/**
 * Set Task Level Registration Limit for Coordinator
 */
const setTaskLevelRegistrationLimitForCoordinator = async (req, res) => {
  try {
    const { coordinatorId, taskLevelId, registrationLimit } = req.body;

    if (!coordinatorId || !taskLevelId || registrationLimit === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Coordinator ID, Task Level ID, and registration limit are required'
      });
    }

    const coordinator = await Coordinator.findById(coordinatorId);
    if (!coordinator) {
      return res.status(404).json({
        success: false,
        message: 'Coordinator not found'
      });
    }

    // Find the task level assignment
    const taskLevelIndex = coordinator.taskLevels.findIndex(
      tl => tl.taskLevel && tl.taskLevel.toString() === taskLevelId
    );

    if (taskLevelIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Task level not assigned to this coordinator'
      });
    }

    const taskLevelAssignment = coordinator.taskLevels[taskLevelIndex];
    const newLimit = parseInt(registrationLimit);

    // Validate limit is not less than current count
    if (newLimit < taskLevelAssignment.registrationCount) {
      return res.status(400).json({
        success: false,
        message: `Registration limit cannot be less than current count (${taskLevelAssignment.registrationCount})`
      });
    }

    taskLevelAssignment.registrationLimit = newLimit;
    await coordinator.save();

    await coordinator.populate('taskLevels.taskLevel', 'name description level registrationLimit globalRegistrationCount');

    res.json({
      success: true,
      message: 'Task level registration limit updated successfully',
      data: {
        _id: coordinator._id,
        userId: coordinator.userId,
        firstName: coordinator.firstName,
        lastName: coordinator.lastName,
        taskLevelAssignment: coordinator.taskLevels[taskLevelIndex]
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error setting task level registration limit',
      error: error.message
    });
  }
};

/**
 * Set Task Level Registration Limit (Global)
 */
const setTaskLevelRegistrationLimit = async (req, res) => {
  try {
    const { taskLevelId, registrationLimit } = req.body;

    if (!taskLevelId || registrationLimit === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Task Level ID and registration limit are required'
      });
    }

    const taskLevel = await TaskLevel.findById(taskLevelId);
    if (!taskLevel) {
      return res.status(404).json({
        success: false,
        message: 'Task level not found'
      });
    }

    const newLimit = parseInt(registrationLimit);

    // Validate limit is not less than current global count
    if (newLimit < taskLevel.globalRegistrationCount) {
      return res.status(400).json({
        success: false,
        message: `Registration limit cannot be less than current global count (${taskLevel.globalRegistrationCount})`
      });
    }

    taskLevel.registrationLimit = newLimit;
    await taskLevel.save();

    res.json({
      success: true,
      message: 'Task level registration limit updated successfully',
      data: {
        _id: taskLevel._id,
        name: taskLevel.name,
        level: taskLevel.level,
        registrationLimit: taskLevel.registrationLimit,
        globalRegistrationCount: taskLevel.globalRegistrationCount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error setting task level registration limit',
      error: error.message
    });
  }
};

/**
 * Assign District Coordinators to Coordinator (Split/Distribution)
 */
const assignDistrictCoordinatorsToCoordinator = async (req, res) => {
  try {
    const { coordinatorId, districtCoordinatorIds } = req.body;

    if (!coordinatorId || !districtCoordinatorIds || !Array.isArray(districtCoordinatorIds)) {
      return res.status(400).json({
        success: false,
        message: 'Coordinator ID and array of District Coordinator IDs are required'
      });
    }

    const coordinator = await Coordinator.findById(coordinatorId);
    if (!coordinator) {
      return res.status(404).json({
        success: false,
        message: 'Coordinator not found'
      });
    }

    // Validate all district coordinators exist
    const districtCoordinators = await DistrictCoordinator.find({ 
      _id: { $in: districtCoordinatorIds } 
    });
    if (districtCoordinators.length !== districtCoordinatorIds.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more district coordinators not found'
      });
    }

    // Update coordinator's assigned district coordinators
    coordinator.assignedDistrictCoordinators = districtCoordinatorIds;
    await coordinator.save();

    // Update district coordinators to reference this coordinator
    await DistrictCoordinator.updateMany(
      { _id: { $in: districtCoordinatorIds } },
      { $set: { assignedByCoordinator: coordinator._id } }
    );

    await coordinator.populate('assignedDistrictCoordinators', 'userId firstName lastName email');

    res.json({
      success: true,
      message: 'District coordinators assigned to coordinator successfully',
      data: {
        _id: coordinator._id,
        userId: coordinator.userId,
        firstName: coordinator.firstName,
        lastName: coordinator.lastName,
        assignedDistrictCoordinators: coordinator.assignedDistrictCoordinators
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error assigning district coordinators to coordinator',
      error: error.message
    });
  }
};

/**
 * Assign Task Levels to District Coordinator
 */
const assignTaskLevelsToDistrictCoordinator = async (req, res) => {
  try {
    const { districtCoordinatorId, taskLevelIds } = req.body;

    if (!districtCoordinatorId || !taskLevelIds || !Array.isArray(taskLevelIds)) {
      return res.status(400).json({
        success: false,
        message: 'District Coordinator ID and array of task level IDs are required'
      });
    }

    const districtCoordinator = await DistrictCoordinator.findById(districtCoordinatorId);
    if (!districtCoordinator) {
      return res.status(404).json({
        success: false,
        message: 'District Coordinator not found'
      });
    }

    // Validate all task levels exist
    const taskLevels = await TaskLevel.find({ _id: { $in: taskLevelIds } });
    if (taskLevels.length !== taskLevelIds.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more task levels not found'
      });
    }

    districtCoordinator.taskLevels = taskLevelIds;
    await districtCoordinator.save();

    await districtCoordinator.populate('taskLevels', 'name description level registrationLimit globalRegistrationCount');

    res.json({
      success: true,
      message: 'Task levels assigned to district coordinator successfully',
      data: {
        _id: districtCoordinator._id,
        userId: districtCoordinator.userId,
        firstName: districtCoordinator.firstName,
        lastName: districtCoordinator.lastName,
        taskLevels: districtCoordinator.taskLevels
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error assigning task levels to district coordinator',
      error: error.message
    });
  }
};

/**
 * Assign Team Leaders to District Coordinator (Split/Distribution)
 */
const assignTeamLeadersToDistrictCoordinator = async (req, res) => {
  try {
    const { districtCoordinatorId, teamLeaderIds } = req.body;

    if (!districtCoordinatorId || !teamLeaderIds || !Array.isArray(teamLeaderIds)) {
      return res.status(400).json({
        success: false,
        message: 'District Coordinator ID and array of Team Leader IDs are required'
      });
    }

    const districtCoordinator = await DistrictCoordinator.findById(districtCoordinatorId);
    if (!districtCoordinator) {
      return res.status(404).json({
        success: false,
        message: 'District Coordinator not found'
      });
    }

    // Validate all team leaders exist
    const teamLeaders = await TeamLeader.find({ 
      _id: { $in: teamLeaderIds } 
    });
    if (teamLeaders.length !== teamLeaderIds.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more team leaders not found'
      });
    }

    // Update district coordinator's assigned team leaders
    districtCoordinator.assignedTeamLeaders = teamLeaderIds;
    await districtCoordinator.save();

    // Update team leaders to reference this district coordinator
    await TeamLeader.updateMany(
      { _id: { $in: teamLeaderIds } },
      { $set: { assignedByDistrictCoordinator: districtCoordinator._id } }
    );

    await districtCoordinator.populate('assignedTeamLeaders', 'userId firstName lastName email');

    res.json({
      success: true,
      message: 'Team leaders assigned to district coordinator successfully',
      data: {
        _id: districtCoordinator._id,
        userId: districtCoordinator.userId,
        firstName: districtCoordinator.firstName,
        lastName: districtCoordinator.lastName,
        assignedTeamLeaders: districtCoordinator.assignedTeamLeaders
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error assigning team leaders to district coordinator',
      error: error.message
    });
  }
};

/**
 * Assign Task Levels to Team Leader
 */
const assignTaskLevelsToTeamLeader = async (req, res) => {
  try {
    const { teamLeaderId, taskLevelIds } = req.body;

    if (!teamLeaderId || !taskLevelIds || !Array.isArray(taskLevelIds)) {
      return res.status(400).json({
        success: false,
        message: 'Team Leader ID and array of task level IDs are required'
      });
    }

    const teamLeader = await TeamLeader.findById(teamLeaderId);
    if (!teamLeader) {
      return res.status(404).json({
        success: false,
        message: 'Team Leader not found'
      });
    }

    // Validate all task levels exist
    const taskLevels = await TaskLevel.find({ _id: { $in: taskLevelIds } });
    if (taskLevels.length !== taskLevelIds.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more task levels not found'
      });
    }

    teamLeader.taskLevels = taskLevelIds;
    await teamLeader.save();

    await teamLeader.populate('taskLevels', 'name description level registrationLimit globalRegistrationCount');

    res.json({
      success: true,
      message: 'Task levels assigned to team leader successfully',
      data: {
        _id: teamLeader._id,
        userId: teamLeader.userId,
        firstName: teamLeader.firstName,
        lastName: teamLeader.lastName,
        taskLevels: teamLeader.taskLevels
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error assigning task levels to team leader',
      error: error.message
    });
  }
};

/**
 * Assign Field Employees to Team Leader (Split/Distribution)
 */
const assignFieldEmployeesToTeamLeader = async (req, res) => {
  try {
    const { teamLeaderId, fieldEmployeeIds } = req.body;

    if (!teamLeaderId || !fieldEmployeeIds || !Array.isArray(fieldEmployeeIds)) {
      return res.status(400).json({
        success: false,
        message: 'Team Leader ID and array of Field Employee IDs are required'
      });
    }

    const teamLeader = await TeamLeader.findById(teamLeaderId);
    if (!teamLeader) {
      return res.status(404).json({
        success: false,
        message: 'Team Leader not found'
      });
    }

    // Validate all field employees exist
    const fieldEmployees = await FieldEmployee.find({ 
      _id: { $in: fieldEmployeeIds } 
    });
    if (fieldEmployees.length !== fieldEmployeeIds.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more field employees not found'
      });
    }

    // Update team leader's assigned field employees
    teamLeader.assignedFieldEmployees = fieldEmployeeIds;
    await teamLeader.save();

    // Update field employees to reference this team leader
    await FieldEmployee.updateMany(
      { _id: { $in: fieldEmployeeIds } },
      { $set: { assignedByTeamLeader: teamLeader._id } }
    );

    await teamLeader.populate('assignedFieldEmployees', 'userId firstName lastName email');

    res.json({
      success: true,
      message: 'Field employees assigned to team leader successfully',
      data: {
        _id: teamLeader._id,
        userId: teamLeader.userId,
        firstName: teamLeader.firstName,
        lastName: teamLeader.lastName,
        assignedFieldEmployees: teamLeader.assignedFieldEmployees
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error assigning field employees to team leader',
      error: error.message
    });
  }
};

module.exports = {
  signup,
  login,
  createDistrictCoordinator,
  createDownlineUser,
  getDistrictCoordinators,
  getDistrictCoordinatorDetails,
  getCoordinators,
  getCoordinatorDetails,
  getMyUsers,
  createDistrict,
  getDistricts,
  updateDistrict,
  assignDistrictToCoordinator,
  assignAreaRangeToCoordinator,
  createTaskLevel,
  getTaskLevels,
  updateTaskLevel,
  assignTaskLevelsToCoordinator,
  setCoordinatorRegistrationLimits,
  assignDistrictCoordinatorsToCoordinator,
  assignTaskLevelsToDistrictCoordinator,
  assignTeamLeadersToDistrictCoordinator,
  assignTaskLevelsToTeamLeader,
  assignFieldEmployeesToTeamLeader,
  setTaskLevelRegistrationLimitForCoordinator,
  setTaskLevelRegistrationLimit
};

