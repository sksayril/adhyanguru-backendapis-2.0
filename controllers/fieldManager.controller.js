const FieldManager = require('../models/fieldManager.model');
const TeamLeader = require('../models/teamLeader.model');
const { encryptPassword, comparePassword } = require('../services/passwordService');
const { generateUserId, getNextSequenceNumber } = require('../services/userIdService');
const { generateToken } = require('../middleware/auth');
const { USER_ROLES } = require('../utils/constants');

/**
 * Field Manager Login
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

    const fieldManager = await FieldManager.findOne({
      $or: [
        { email: identifier },
        { mobileNumber: identifier },
        { userId: identifier }
      ]
    });

    if (!fieldManager) {
      return res.status(404).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    if (!fieldManager.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    const isPasswordValid = comparePassword(password, fieldManager.encryptedPassword);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const token = generateToken(fieldManager);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          _id: fieldManager._id,
          userId: fieldManager.userId,
          email: fieldManager.email,
          mobileNumber: fieldManager.mobileNumber,
          firstName: fieldManager.firstName,
          lastName: fieldManager.lastName,
          role: fieldManager.role,
          profilePicture: fieldManager.profilePicture || null
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
 * Create Team Leader (by Field Manager)
 */
const createTeamLeader = async (req, res) => {
  try {
    const { email, mobileNumber, password, firstName, lastName, district } = req.body;
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

    const fieldManager = await FieldManager.findById(createdBy);

    const teamLeader = new TeamLeader({
      userId,
      email,
      mobileNumber,
      password: encryptedPassword,
      encryptedPassword: encryptedPassword,
      firstName,
      lastName,
      district,
      createdBy: fieldManager._id
    });

    await teamLeader.save();

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
        role: teamLeader.role,
        createdBy: teamLeader.createdBy
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
 * Get all users under field manager hierarchy
 */
const getMyUsers = async (req, res) => {
  try {
    const fmId = req.user.userId;
    const users = [];
    
    const FieldEmployee = require('../models/fieldEmployee.model');

    const teamLeaders = await TeamLeader.find({ createdBy: fmId });
    users.push(...teamLeaders);

    for (const tl of teamLeaders) {
      const fieldEmployees = await FieldEmployee.find({ createdBy: tl._id });
      users.push(...fieldEmployees);
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

module.exports = {
  login,
  createTeamLeader,
  getMyUsers
};

