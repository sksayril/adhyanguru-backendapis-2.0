const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');

// Public routes (no authentication required)
router.get('/main-categories', categoryController.getPublicMainCategories);
router.get('/sub-categories', categoryController.getPublicSubCategories);

module.exports = router;

