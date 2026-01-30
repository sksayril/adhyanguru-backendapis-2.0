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

// Task Level Management (Admin and Super Admin)
router.post('/task-level', adminController.createTaskLevel);
router.get('/task-levels', adminController.getTaskLevels);
router.put('/task-level/:taskLevelId', adminController.updateTaskLevel);

// Task Level Assignment
router.post('/coordinator/task-levels', adminController.assignTaskLevelsToCoordinator);
router.post('/district-coordinator/task-levels', adminController.assignTaskLevelsToDistrictCoordinator);
router.post('/team-leader/task-levels', adminController.assignTaskLevelsToTeamLeader);

// Registration Limits
router.post('/coordinator/registration-limits', adminController.setCoordinatorRegistrationLimits);
router.post('/task-level/registration-limit', adminController.setTaskLevelRegistrationLimit);
router.post('/coordinator/task-level/registration-limit', adminController.setTaskLevelRegistrationLimitForCoordinator);

// Distribution/Splitting
router.post('/coordinator/assign-district-coordinators', adminController.assignDistrictCoordinatorsToCoordinator);
router.post('/district-coordinator/assign-team-leaders', adminController.assignTeamLeadersToDistrictCoordinator);
router.post('/team-leader/assign-field-employees', adminController.assignFieldEmployeesToTeamLeader);

// Dashboard endpoint
router.get('/dashboard', adminController.getDashboard);

// Wallet and Registration endpoints
router.get('/coordinator/:id/wallet-registrations', adminController.getCoordinatorWalletAndRegistrations);
router.get('/district-coordinator/:id/wallet-registrations', adminController.getDistrictCoordinatorWalletAndRegistrations);

module.exports = router;

