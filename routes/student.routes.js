const express = require('express');
const router = express.Router();
const studentController = require('../controllers/student.controller');
const { authenticate } = require('../middleware/auth');
const { handleUpload } = require('../middleware/upload');

// Public routes (no authentication required)
router.post('/signup', handleUpload, studentController.signup);
router.post('/login', studentController.login);
router.post('/logout', studentController.logout);

// Protected routes (Student authentication required)
router.use(authenticate);
router.get('/profile', studentController.getStudentProfile);
router.put('/profile', handleUpload, studentController.updateProfile);
router.get('/my-boards-subjects', studentController.getMyBoardsSubjects);
router.get('/subject/chapters', studentController.getSubjectChapters);
router.post('/chapter/complete', studentController.markChapterCompleted);
router.get('/my-learning', studentController.getMyLearning);
router.get('/progress', studentController.getStudentProgress);
router.get('/dashboard', studentController.getStudentDashboard);
router.get('/plans', studentController.getPlansForSubCategory);
router.post('/subscription/order', studentController.createSubscriptionOrder);
router.post('/subscription/verify', studentController.verifyPaymentAndActivate);
router.get('/subscriptions', studentController.getStudentSubscriptions);
router.get('/courses', studentController.getPublicCourses);
router.get('/my-courses', studentController.getMyPurchasedCourses);
router.get('/course/chapters', studentController.getCourseChapters);
router.post('/course/chapter/complete', studentController.markCourseChapterCompleted);
router.post('/course/purchase/order', studentController.createCoursePurchaseOrder);
router.post('/course/purchase/verify', studentController.verifyCoursePurchase);
router.get('/course/:courseId/purchase-status', studentController.checkCoursePurchaseStatus);
router.get('/course/:courseId', studentController.getCourseDetails);
router.post('/chapter/result', studentController.saveChapterResult);
router.get('/chapter/result', studentController.getChapterResult);

module.exports = router;

