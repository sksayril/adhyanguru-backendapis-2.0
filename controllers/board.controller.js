const Board = require('../models/board.model');
const SuperAdmin = require('../models/superAdmin.model');

/**
 * Create Board (Super Admin only)
 */
const createBoard = async (req, res) => {
  try {
    const { name, description, code } = req.body;
    const createdBy = req.user.userId;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Board name is required'
      });
    }

    // Check if board already exists
    const existingBoard = await Board.findOne({
      $or: [
        { name: name.trim() },
        ...(code ? [{ code: code.trim() }] : [])
      ]
    });

    if (existingBoard) {
      return res.status(400).json({
        success: false,
        message: 'Board with this name or code already exists'
      });
    }

    // Get super admin who is creating
    const superAdmin = await SuperAdmin.findById(createdBy);
    if (!superAdmin) {
      return res.status(404).json({
        success: false,
        message: 'Super Admin not found'
      });
    }

    // Create board
    const board = new Board({
      name: name.trim(),
      description: description ? description.trim() : null,
      code: code ? code.trim() : null,
      createdBy: superAdmin._id
    });

    await board.save();

    res.status(201).json({
      success: true,
      message: 'Board created successfully',
      data: {
        _id: board._id,
        name: board.name,
        description: board.description,
        code: board.code,
        isActive: board.isActive,
        createdAt: board.createdAt,
        updatedAt: board.updatedAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating board',
      error: error.message
    });
  }
};

/**
 * Get All Boards (Super Admin - Protected)
 */
const getAllBoards = async (req, res) => {
  try {
    const { isActive } = req.query;
    const query = {};
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const boards = await Board.find(query)
      .populate('createdBy', 'userId firstName lastName')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      message: 'Boards retrieved successfully',
      data: boards,
      count: boards.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving boards',
      error: error.message
    });
  }
};

/**
 * Get Board by ID (Super Admin - Protected)
 */
const getBoardById = async (req, res) => {
  try {
    const { id } = req.params;

    const board = await Board.findById(id)
      .populate('createdBy', 'userId firstName lastName');

    if (!board) {
      return res.status(404).json({
        success: false,
        message: 'Board not found'
      });
    }

    res.json({
      success: true,
      message: 'Board retrieved successfully',
      data: board
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving board',
      error: error.message
    });
  }
};

/**
 * Update Board (Super Admin only)
 */
const updateBoard = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, code, isActive } = req.body;

    const board = await Board.findById(id);
    if (!board) {
      return res.status(404).json({
        success: false,
        message: 'Board not found'
      });
    }

    // Check if name is being changed and if new name already exists
    if (name && name.trim() !== board.name) {
      const existingBoard = await Board.findOne({
        name: name.trim(),
        _id: { $ne: id }
      });
      if (existingBoard) {
        return res.status(400).json({
          success: false,
          message: 'Board with this name already exists'
        });
      }
      board.name = name.trim();
    }

    // Check if code is being changed and if new code already exists
    if (code !== undefined && code !== null && code.trim() !== board.code) {
      if (code.trim() !== '') {
        const existingBoard = await Board.findOne({
          code: code.trim(),
          _id: { $ne: id }
        });
        if (existingBoard) {
          return res.status(400).json({
            success: false,
            message: 'Board with this code already exists'
          });
        }
        board.code = code.trim();
      } else {
        board.code = null;
      }
    }

    if (description !== undefined) {
      board.description = description ? description.trim() : null;
    }

    if (isActive !== undefined) {
      board.isActive = isActive === 'true' || isActive === true;
    }

    await board.save();

    res.json({
      success: true,
      message: 'Board updated successfully',
      data: board
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating board',
      error: error.message
    });
  }
};

/**
 * Delete Board (Super Admin only)
 */
const deleteBoard = async (req, res) => {
  try {
    const { id } = req.params;

    const board = await Board.findById(id);
    if (!board) {
      return res.status(404).json({
        success: false,
        message: 'Board not found'
      });
    }

    // Check if board is used by any subjects
    const Subject = require('../models/subject.model');
    const subjectsCount = await Subject.countDocuments({ board: id });
    if (subjectsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete board. It is assigned to ${subjectsCount} subject(s). Please remove board assignment from subjects first.`
      });
    }

    await Board.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Board deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting board',
      error: error.message
    });
  }
};

module.exports = {
  createBoard,
  getAllBoards,
  getBoardById,
  updateBoard,
  deleteBoard
};

