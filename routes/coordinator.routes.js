const express = require('express');
const router = express.Router();
const coordinatorController = require('../controllers/coordinator.controller');
const { authenticate, authorizeCreate } = require('../middleware/auth');
const { USER_ROLES } = require('../utils/constants');
const { handleUpload } = require('../middleware/upload');

// Public routes
router.post('/login', coordinatorController.login);

// Protected routes
router.use(authenticate); // All routes below require authentication

// Profile routes
router.get('/profile', coordinatorController.getProfile);
router.put('/profile', handleUpload, coordinatorController.updateProfile);

// Create field manager (only coordinator can create)
router.post('/create-field-manager', authorizeCreate(USER_ROLES.FIELD_MANAGER), coordinatorController.createFieldManager);

// Get all users under coordinator hierarchy
router.get('/my-users', coordinatorController.getMyUsers);

// Get specific user details
router.get('/user/:id', coordinatorController.getUserDetails);

// Dashboard endpoint
router.get('/dashboard', coordinatorController.getDashboard);

// Get admin contact information for support
router.get('/admin-contact', coordinatorController.getAdminContact);

// Wallet endpoints
router.get('/wallet', coordinatorController.getWalletBalance);
router.get('/wallet/transactions', coordinatorController.getWalletTransactions);

module.exports = router;

