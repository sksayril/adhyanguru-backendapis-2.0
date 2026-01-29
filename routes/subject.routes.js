const express = require('express');
const router = express.Router();
const subjectController = require('../controllers/subject.controller');
const { authenticate } = require('../middleware/auth');
const { handleThumbnailUpload, handleMultipleUpload } = require('../middleware/upload');

// Protected routes (Super Admin only) - All routes require authentication
router.use(authenticate);

// Subject routes
router.post('/subject', handleThumbnailUpload, subjectController.createSubject);
router.get('/subject', subjectController.getAllSubjects);
router.get('/subject/:id', subjectController.getSubjectById);
router.put('/subject/:id', handleThumbnailUpload, subjectController.updateSubject);
router.delete('/subject/:id', subjectController.deleteSubject);

// Chapter routes
router.post('/chapter', handleMultipleUpload, subjectController.createChapter);
router.get('/chapter/subject/:subjectId', subjectController.getChaptersBySubject);
router.get('/chapter/:id', subjectController.getChapterById);
router.put('/chapter/:id', handleMultipleUpload, subjectController.updateChapter);
router.delete('/chapter/:id', subjectController.deleteChapter);

module.exports = router;

