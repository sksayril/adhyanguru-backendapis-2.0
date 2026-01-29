const express = require('express');
const router = express.Router();
const boardController = require('../controllers/board.controller');
const { authenticate } = require('../middleware/auth');

// Protected routes (Super Admin only) - All routes require authentication
router.use(authenticate);

// Board routes
router.post('/board', boardController.createBoard);
router.get('/board', boardController.getAllBoards);
router.get('/board/:id', boardController.getBoardById);
router.put('/board/:id', boardController.updateBoard);
router.delete('/board/:id', boardController.deleteBoard);

module.exports = router;

