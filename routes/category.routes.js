const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');
const { authenticate } = require('../middleware/auth');
const { handleImageUpload } = require('../middleware/upload');

// Protected routes (Super Admin only) - All routes require authentication
router.use(authenticate);

// Main Category routes
router.post('/main-category', handleImageUpload, categoryController.createMainCategory);
router.get('/main-category', categoryController.getAllMainCategories);
router.get('/main-category/:id', categoryController.getMainCategoryById);
router.put('/main-category/:id', handleImageUpload, categoryController.updateMainCategory);
router.delete('/main-category/:id', categoryController.deleteMainCategory);

// Sub Category routes
router.post('/sub-category', handleImageUpload, categoryController.createSubCategory);
router.get('/sub-category', categoryController.getAllSubCategories);
router.get('/sub-category/:id', categoryController.getSubCategoryById);
router.put('/sub-category/:id', handleImageUpload, categoryController.updateSubCategory);
router.delete('/sub-category/:id', categoryController.deleteSubCategory);

module.exports = router;

