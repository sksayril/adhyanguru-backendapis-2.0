const jwt = require('jsonwebtoken');
const { USER_ROLES, USER_HIERARCHY } = require('../utils/constants');

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key-change-this';

/**
 * Verify JWT token
 */
const authenticate = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.headers['x-access-token'];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided. Authentication required.'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

/**
 * Check if user has permission to create a specific user type
 */
const canCreateUserType = (userRole, targetUserType) => {
  const hierarchy = USER_HIERARCHY[userRole];
  if (!hierarchy) return false;
  
  return hierarchy.canCreate.includes(targetUserType);
};

/**
 * Check if user can view a specific user type
 */
const canViewUserType = (userRole, targetUserType) => {
  const hierarchy = USER_HIERARCHY[userRole];
  if (!hierarchy) return false;
  
  return hierarchy.canView.includes(targetUserType);
};

/**
 * Middleware to check if user can create specific user type
 */
const authorizeCreate = (targetUserType) => {
  return (req, res, next) => {
    const userRole = req.user.role;
    
    if (!canCreateUserType(userRole, targetUserType)) {
      return res.status(403).json({
        success: false,
        message: `You don't have permission to create ${targetUserType}`
      });
    }
    
    next();
  };
};

/**
 * Generate JWT token
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      userCustomId: user.userId,
      role: user.role,
      email: user.email
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

module.exports = {
  authenticate,
  authorizeCreate,
  canCreateUserType,
  canViewUserType,
  generateToken
};

