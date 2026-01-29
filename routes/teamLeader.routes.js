const express = require('express');
const router = express.Router();
const teamLeaderController = require('../controllers/teamLeader.controller');
const { authenticate, authorizeCreate } = require('../middleware/auth');
const { USER_ROLES } = require('../utils/constants');
const { handleUpload } = require('../middleware/upload');

// Public routes
router.post('/login', teamLeaderController.login);

// Protected routes
router.use(authenticate); // All routes below require authentication

// Get own profile
router.get('/profile', teamLeaderController.getProfile);

// Create field employee (only team leader can create)
router.post('/create-field-employee', handleUpload, authorizeCreate(USER_ROLES.FIELD_EMPLOYEE), teamLeaderController.createFieldEmployee);

// Get all users under team leader hierarchy
router.get('/my-users', teamLeaderController.getMyUsers);

// Get specific field employee details by ID
router.get('/field-employee/:id', teamLeaderController.getFieldEmployeeDetails);

// Wallet endpoints
router.get('/wallet', teamLeaderController.getWalletBalance);
router.get('/wallet/transactions', teamLeaderController.getWalletTransactions);

module.exports = router;

