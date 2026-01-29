const FieldEmployee = require('../models/fieldEmployee.model');
const { comparePassword } = require('../services/passwordService');
const { generateToken } = require('../middleware/auth');

/**
 * Field Employee Login
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

    const fieldEmployee = await FieldEmployee.findOne({
      $or: [
        { email: identifier },
        { mobileNumber: identifier },
        { userId: identifier }
      ]
    });

    if (!fieldEmployee) {
      return res.status(404).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    if (!fieldEmployee.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    const isPasswordValid = comparePassword(password, fieldEmployee.encryptedPassword);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const token = generateToken(fieldEmployee);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          _id: fieldEmployee._id,
          userId: fieldEmployee.userId,
          email: fieldEmployee.email,
          mobileNumber: fieldEmployee.mobileNumber,
          firstName: fieldEmployee.firstName,
          lastName: fieldEmployee.lastName,
          role: fieldEmployee.role,
          profilePicture: fieldEmployee.profilePicture || null
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
 * Get own profile
 */
const getMyProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const fieldEmployee = await FieldEmployee.findById(userId).select('-password -encryptedPassword');

    if (!fieldEmployee) {
      return res.status(404).json({
        success: false,
        message: 'Field employee not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile retrieved successfully',
      data: fieldEmployee
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving profile',
      error: error.message
    });
  }
};

module.exports = {
  login,
  getMyProfile
};

