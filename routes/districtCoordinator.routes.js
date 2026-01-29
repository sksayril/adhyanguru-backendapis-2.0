const express = require('express');
const router = express.Router();
const districtCoordinatorController = require('../controllers/districtCoordinator.controller');
const { authenticate, authorizeCreate } = require('../middleware/auth');
const { USER_ROLES } = require('../utils/constants');
const { handleUpload } = require('../middleware/upload');

// Public routes
router.post('/login', districtCoordinatorController.login);

// Protected routes
router.use(authenticate); // All routes below require authentication

// Profile routes
router.get('/profile', districtCoordinatorController.getProfile);
router.put('/profile', handleUpload, districtCoordinatorController.updateProfile);

// Create coordinator (only district coordinator can create)
router.post('/create-coordinator', handleUpload, authorizeCreate(USER_ROLES.COORDINATOR), districtCoordinatorController.createCoordinator);

// Create team leader (district coordinator can also create)
router.post('/create-team-leader', handleUpload, authorizeCreate(USER_ROLES.TEAM_LEADER), districtCoordinatorController.createTeamLeader);

// Team Leader Management
router.get('/team-leaders', districtCoordinatorController.getTeamLeaders);
router.get('/team-leader/:id', districtCoordinatorController.getTeamLeaderDetails);

// Get all users under district coordinator hierarchy
router.get('/my-users', districtCoordinatorController.getMyUsers);

module.exports = router;

