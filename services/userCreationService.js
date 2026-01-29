const { encryptPassword } = require('./passwordService');
const { generateUserId, getNextSequenceNumber } = require('./userIdService');
const { USER_ROLES } = require('../utils/constants');
const { getModelByRole } = require('../utils/userModelMapper');

/**
 * Generic function to create any user type
 * @param {string} userType - The type of user to create
 * @param {object} userData - User data (email, mobileNumber, password, firstName, lastName, district)
 * @param {object} creator - The user creating this user (from req.user)
 * @returns {object} Created user object
 */
const createUser = async (userType, userData, creator) => {
  const { email, mobileNumber, password, firstName, lastName, district, profilePicture, latitude, longitude, areaRange, boundingBox } = userData;
  
  // Get the model for this user type
  const UserModel = getModelByRole(userType);
  
  if (!UserModel) {
    throw new Error(`Invalid user type: ${userType}`);
  }

  // Check if user already exists
  const existingUser = await UserModel.findOne({
    $or: [{ email }, { mobileNumber }]
  });

  if (existingUser) {
    throw new Error(`${userType} already exists with this email or mobile number`);
  }

  // Generate user ID
  const count = await UserModel.countDocuments();
  const sequenceNumber = getNextSequenceNumber(count);
  const userId = generateUserId(userType, sequenceNumber);

  // Encrypt password
  const encryptedPassword = encryptPassword(password);

  // Get creator model based on creator role
  const CreatorModel = getModelByRole(creator.role);
  if (!CreatorModel) {
    throw new Error(`Invalid creator role: ${creator.role}`);
  }

  // Find creator in database
  const creatorUser = await CreatorModel.findById(creator.userId);
  if (!creatorUser) {
    throw new Error('Creator user not found');
  }

  // Determine the correct createdBy reference based on user type and creator role
  // For Super Admin creating any user: createdBy should reference Super Admin
  // For Admin creating any downline: createdBy should reference Admin (for District Coordinator) 
  //   or the appropriate parent in hierarchy for others
  let createdByReference = creatorUser._id;

  // If Super Admin creates a user that's not Admin, we need to handle the reference
  // If Admin creates a user that's not District Coordinator, we need to handle the reference
  // For now, we'll use the creator's _id, but the model schema will handle the correct reference type
  // The models have different ref types, so we'll let Mongoose handle it

  // Prepare user data based on user type
  const newUserData = {
    userId,
    email,
    mobileNumber,
    password: encryptedPassword,
    encryptedPassword: encryptedPassword,
    firstName,
    lastName,
    createdBy: createdByReference,
    createdAt: new Date() // Explicitly set creation time
  };

  // Add profile picture if provided
  if (profilePicture) {
    newUserData.profilePicture = profilePicture;
  }

  // Add coordinates if provided
  if (latitude !== null && latitude !== undefined) {
    newUserData.latitude = parseFloat(latitude);
  }
  if (longitude !== null && longitude !== undefined) {
    newUserData.longitude = parseFloat(longitude);
  }

  // Add district if required (for roles below Admin)
  if (userType !== USER_ROLES.SUPER_ADMIN && userType !== USER_ROLES.ADMIN) {
    if (!district) {
      throw new Error('District is required for this user type');
    }
    newUserData.district = district;
  }

  // Add areaRange and boundingBox if provided (for coordinators/district coordinators)
  if (areaRange) {
    newUserData.areaRange = areaRange;
  }
  if (boundingBox) {
    newUserData.boundingBox = boundingBox;
  }

  // Create user
  const newUser = new UserModel(newUserData);
  await newUser.save();

  return newUser;
};

/**
 * Get the appropriate creator reference field name based on user type
 * @param {string} userType - The type of user being created
 * @param {string} creatorRole - The role of the creator
 * @returns {string} The field name for createdBy reference
 */
const getCreatorReferenceField = (userType, creatorRole) => {
  // Map of user types to their expected creator reference
  const creatorMap = {
    [USER_ROLES.ADMIN]: USER_ROLES.SUPER_ADMIN,
    [USER_ROLES.DISTRICT_COORDINATOR]: USER_ROLES.ADMIN,
    [USER_ROLES.COORDINATOR]: USER_ROLES.DISTRICT_COORDINATOR,
    [USER_ROLES.FIELD_MANAGER]: USER_ROLES.COORDINATOR,
    [USER_ROLES.TEAM_LEADER]: USER_ROLES.FIELD_MANAGER,
    [USER_ROLES.FIELD_EMPLOYEE]: USER_ROLES.TEAM_LEADER
  };

  // If creator is Super Admin or Admin creating any downline, use the direct parent
  if (creatorRole === USER_ROLES.SUPER_ADMIN) {
    if (userType === USER_ROLES.ADMIN) {
      return USER_ROLES.SUPER_ADMIN;
    }
    // For other types, find the appropriate parent in hierarchy
    return creatorMap[userType];
  }

  if (creatorRole === USER_ROLES.ADMIN) {
    if (userType === USER_ROLES.DISTRICT_COORDINATOR) {
      return USER_ROLES.ADMIN;
    }
    // For other types, find the appropriate parent
    return creatorMap[userType];
  }

  // For other roles, use the standard hierarchy
  return creatorMap[userType];
};

module.exports = {
  createUser,
  getCreatorReferenceField
};

