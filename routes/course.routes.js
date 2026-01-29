const express = require('express');
const router = express.Router();
const courseController = require('../controllers/course.controller');
const { authenticate } = require('../middleware/auth');
const { handleThumbnailUpload, handleMultipleUpload } = require('../middleware/upload');

// Protected routes (Super Admin only)
router.use(authenticate);

// Course routes
router.post('/course', handleThumbnailUpload, courseController.createCourse);
router.get('/course', courseController.getAllCourses);
router.get('/course/:id', courseController.getCourseById);
router.put('/course/:id', handleThumbnailUpload, courseController.updateCourse);
router.delete('/course/:id', courseController.deleteCourse);

// Course Chapter routes
router.post('/course-chapter', handleMultipleUpload, courseController.createCourseChapter);
router.get('/course/:courseId/chapters', courseController.getCourseChapters);
router.get('/course-chapter/:id', courseController.getCourseChapterById);
router.put('/course-chapter/:id', handleMultipleUpload, courseController.updateCourseChapter);
router.delete('/course-chapter/:id', courseController.deleteCourseChapter);

module.exports = router;

