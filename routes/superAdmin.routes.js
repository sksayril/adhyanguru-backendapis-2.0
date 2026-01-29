const express = require('express');
const router = express.Router();
const superAdminController = require('../controllers/superAdmin.controller');
const adminController = require('../controllers/admin.controller');
const { authenticate, authorizeCreate } = require('../middleware/auth');
const { USER_ROLES } = require('../utils/constants');
const { handleUpload } = require('../middleware/upload');

// Public routes
router.post('/signup', handleUpload, superAdminController.signup);
router.post('/login', superAdminController.login);
router.post('/logout', superAdminController.logout);

// Protected routes
router.use(authenticate); // All routes below require authentication

// Create admin (only super admin can create)
router.post('/create-admin', handleUpload, authorizeCreate(USER_ROLES.ADMIN), superAdminController.createAdmin);

// Create any downline user (Super Admin can create all downline users)
router.post('/create-user', handleUpload, superAdminController.createDownlineUser);

// Get all users (super admin can see everyone)
router.get('/all-users', superAdminController.getAllUsers);

// Get user details with optional decrypted password
router.get('/user/:userId', superAdminController.getUserDetails);

// District Management (Super Admin can also manage districts)
router.post('/district', adminController.createDistrict);
router.get('/districts', adminController.getDistricts);
router.get('/district-coordinators', adminController.getDistrictCoordinators);
router.get('/district-coordinator/:id', adminController.getDistrictCoordinatorDetails);
router.get('/coordinators', adminController.getCoordinators);
router.get('/coordinator/:id', adminController.getCoordinatorDetails);
router.put('/district/:districtId', adminController.updateDistrict);
router.post('/district/assign', adminController.assignDistrictToCoordinator);
router.post('/coordinator/area-range', adminController.assignAreaRangeToCoordinator);

module.exports = router;

