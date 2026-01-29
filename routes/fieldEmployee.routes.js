const express = require('express');
const router = express.Router();
const fieldEmployeeController = require('../controllers/fieldEmployee.controller');
const { authenticate } = require('../middleware/auth');

// Public routes
router.post('/login', fieldEmployeeController.login);

// Protected routes
router.use(authenticate); // All routes below require authentication

// Get own profile
router.get('/profile', fieldEmployeeController.getMyProfile);

module.exports = router;

