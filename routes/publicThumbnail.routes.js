const express = require('express');
const router = express.Router();
const Thumbnail = require('../models/thumbnail.model');

/**
 * Get All Thumbnails (Public - No Authentication Required)
 * Get all active thumbnails for public display
 */
router.get('/', async (req, res) => {
  try {
    const { sortBy = 'order', sortOrder = 'asc' } = req.query;

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const thumbnails = await Thumbnail.find({ isActive: true })
      .select('title image description order createdAt')
      .sort(sortOptions)
      .lean();

    res.json({
      success: true,
      message: 'Thumbnails retrieved successfully',
      data: {
        thumbnails,
        count: thumbnails.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving thumbnails',
      error: error.message
    });
  }
});

/**
 * Get Thumbnail by ID (Public - No Authentication Required)
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const thumbnail = await Thumbnail.findOne({
      _id: id,
      isActive: true
    }).select('title image description order createdAt').lean();

    if (!thumbnail) {
      return res.status(404).json({
        success: false,
        message: 'Thumbnail not found or inactive'
      });
    }

    res.json({
      success: true,
      message: 'Thumbnail retrieved successfully',
      data: thumbnail
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving thumbnail',
      error: error.message
    });
  }
});

module.exports = router;
