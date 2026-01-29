const Admin = require('../models/admin.model');
const DistrictCoordinator = require('../models/districtCoordinator.model');
const Coordinator = require('../models/coordinator.model');
const District = require('../models/district.model');
const SuperAdmin = require('../models/superAdmin.model');
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
        createdBy: districtCoordinator.createdBy
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
      .populate('createdBy', 'userId firstName lastName email mobileNumber');

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
  assignAreaRangeToCoordinator
};

