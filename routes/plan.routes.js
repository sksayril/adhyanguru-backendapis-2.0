const express = require('express');
const router = express.Router();
const planController = require('../controllers/plan.controller');
const { authenticate } = require('../middleware/auth');

// Protected routes (Super Admin only) - All routes require authentication
router.use(authenticate);

// Plan routes
router.post('/plan', planController.createPlan);
router.post('/plan/multiple', planController.createMultiplePlans); // Create multiple plans at once
router.get('/plan', planController.getAllPlans);
router.get('/plan/sub-category/:subCategoryId', planController.getPlansBySubCategory);
router.get('/plan/:id', planController.getPlanById);
router.put('/plan/:id', planController.updatePlan);
router.delete('/plan/:id', planController.deletePlan);

module.exports = router;

