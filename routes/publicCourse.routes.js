const express = require('express');
const router = express.Router();
const courseController = require('../controllers/course.controller');
const jwt = require('jsonwebtoken');

// Optional authentication middleware
const optionalAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1] || req.headers['x-access-token'];
  if (token) {
    try {
      const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key-change-this';
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
    } catch (error) {
      // Invalid token, but continue without authentication
      req.user = null;
    }
  }
  next();
};

// Public routes (no authentication required)
router.get('/courses', courseController.getPublicCourses);
router.get('/course/:courseId', optionalAuth, courseController.getCourseDetails);

module.exports = router;

