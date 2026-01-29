const express = require('express');
const router = express.Router();
const fieldManagerController = require('../controllers/fieldManager.controller');
const { authenticate, authorizeCreate } = require('../middleware/auth');
const { USER_ROLES } = require('../utils/constants');

// Public routes
router.post('/login', fieldManagerController.login);

// Protected routes
router.use(authenticate); // All routes below require authentication

// Create team leader (only field manager can create)
router.post('/create-team-leader', authorizeCreate(USER_ROLES.TEAM_LEADER), fieldManagerController.createTeamLeader);

// Get all users under field manager hierarchy
router.get('/my-users', fieldManagerController.getMyUsers);

module.exports = router;

