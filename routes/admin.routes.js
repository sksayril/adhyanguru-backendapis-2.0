const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authenticate, authorizeCreate } = require('../middleware/auth');
const { USER_ROLES } = require('../utils/constants');
const { handleUpload } = require('../middleware/upload');

// Public routes
router.post('/signup', handleUpload, adminController.signup);
router.post('/login', adminController.login);

// Protected routes
router.use(authenticate); // All routes below require authentication

// Create district coordinator (only admin can create)
router.post('/create-district-coordinator', handleUpload, authorizeCreate(USER_ROLES.DISTRICT_COORDINATOR), adminController.createDistrictCoordinator);
router.get('/district-coordinators', adminController.getDistrictCoordinators);
router.get('/district-coordinator/:id', adminController.getDistrictCoordinatorDetails);
router.get('/coordinators', adminController.getCoordinators);
router.get('/coordinator/:id', adminController.getCoordinatorDetails);

// Create any downline user (Admin can create all downline users)
router.post('/create-user', handleUpload, adminController.createDownlineUser);

// Get all users under admin hierarchy
router.get('/my-users', adminController.getMyUsers);

// District Management (Admin and Super Admin)
router.post('/district', adminController.createDistrict);
router.get('/districts', adminController.getDistricts);
router.put('/district/:districtId', adminController.updateDistrict);
router.post('/district/assign', adminController.assignDistrictToCoordinator);
router.post('/coordinator/area-range', adminController.assignAreaRangeToCoordinator);

module.exports = router;

