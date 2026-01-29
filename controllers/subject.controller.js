const Subject = require('../models/subject.model');
const Chapter = require('../models/chapter.model');
const MainCategory = require('../models/mainCategory.model');
const SubCategory = require('../models/subCategory.model');
const Board = require('../models/board.model');
const { processImage, getFileExtension } = require('../services/imageProcessingService');
const { uploadToS3, deleteFromS3 } = require('../services/awsS3Service');
const SuperAdmin = require('../models/superAdmin.model');

/**
 * Create Subject (Super Admin only)
 */
const createSubject = async (req, res) => {
  try {
    const { title, description, mainCategoryId, subCategoryId, boardId } = req.body;
    const createdBy = req.user.userId;

    if (!title || !mainCategoryId || !subCategoryId) {
      return res.status(400).json({
        success: false,
        message: 'Title, main category ID, and sub category ID are required'
      });
    }

    // Verify main category exists
    const mainCategory = await MainCategory.findById(mainCategoryId);
    if (!mainCategory) {
      return res.status(404).json({
        success: false,
        message: 'Main category not found'
      });
    }

    // Verify sub category exists and belongs to main category
    const subCategory = await SubCategory.findOne({
      _id: subCategoryId,
      mainCategory: mainCategoryId
    });
    if (!subCategory) {
      return res.status(404).json({
        success: false,
        message: 'Sub category not found or does not belong to the specified main category'
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

    // Handle thumbnail upload if provided
    let thumbnailUrl = null;
    if (req.file) {
      try {
        // Process image with Jimp
        const processedImage = await processImage(req.file.buffer);
        const fileExtension = getFileExtension(req.file.mimetype);
        const fileName = `subject-thumbnail-${Date.now()}-${title.trim().replace(/\s+/g, '-')}.${fileExtension}`;

        // Upload to S3
        thumbnailUrl = await uploadToS3(processedImage, fileName, req.file.mimetype);
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: 'Error processing thumbnail',
          error: error.message
        });
      }
    }

    // Create subject
    const subject = new Subject({
      title: title.trim(),
      description: description ? description.trim() : null,
      thumbnail: thumbnailUrl,
      mainCategory: mainCategoryId,
      subCategory: subCategoryId,
      board: boardId || null,
      createdBy: superAdmin._id
    });

    await subject.save();
    await subject.populate('mainCategory', 'name description image');
    await subject.populate('subCategory', 'name description image');
    if (subject.board) {
      await subject.populate('board', 'name description code');
    }

    res.status(201).json({
      success: true,
      message: 'Subject created successfully',
      data: {
        _id: subject._id,
        title: subject.title,
        description: subject.description,
        thumbnail: subject.thumbnail,
        mainCategory: subject.mainCategory,
        subCategory: subject.subCategory,
        board: subject.board,
        isActive: subject.isActive,
        createdAt: subject.createdAt,
        updatedAt: subject.updatedAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating subject',
      error: error.message
    });
  }
};

/**
 * Get All Subjects (Super Admin - Protected)
 */
const getAllSubjects = async (req, res) => {
  try {
    const { mainCategoryId, subCategoryId, boardId, isActive } = req.query;
    const query = {};
    
    if (mainCategoryId) {
      query.mainCategory = mainCategoryId;
    }
    
    if (subCategoryId) {
      query.subCategory = subCategoryId;
    }
    
    if (boardId) {
      query.board = boardId;
    }
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const subjects = await Subject.find(query)
      .populate('mainCategory', 'name description image')
      .populate('subCategory', 'name description image')
      .populate('board', 'name description code')
      .populate('createdBy', 'userId firstName lastName')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      message: 'Subjects retrieved successfully',
      data: subjects,
      count: subjects.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving subjects',
      error: error.message
    });
  }
};

/**
 * Get Subject by ID (Super Admin - Protected)
 */
const getSubjectById = async (req, res) => {
  try {
    const { id } = req.params;

    const subject = await Subject.findById(id)
      .populate('mainCategory', 'name description image')
      .populate('subCategory', 'name description image')
      .populate('board', 'name description code')
      .populate('createdBy', 'userId firstName lastName');

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    // Get chapters for this subject
    const chapters = await Chapter.find({ subject: id, isActive: true })
      .sort({ order: 1 })
      .select('title description order content isActive createdAt updatedAt');

    res.json({
      success: true,
      message: 'Subject retrieved successfully',
      data: {
        ...subject.toObject(),
        chapters: chapters
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving subject',
      error: error.message
    });
  }
};

/**
 * Update Subject (Super Admin only)
 */
const updateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, mainCategoryId, subCategoryId, boardId, isActive } = req.body;

    const subject = await Subject.findById(id);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    // Update fields
    if (title) {
      subject.title = title.trim();
    }

    if (description !== undefined) {
      subject.description = description ? description.trim() : null;
    }

    if (mainCategoryId) {
      const mainCategory = await MainCategory.findById(mainCategoryId);
      if (!mainCategory) {
        return res.status(404).json({
          success: false,
          message: 'Main category not found'
        });
      }
      subject.mainCategory = mainCategoryId;
    }

    if (subCategoryId) {
      const mainCatId = mainCategoryId || subject.mainCategory;
      const subCategory = await SubCategory.findOne({
        _id: subCategoryId,
        mainCategory: mainCatId
      });
      if (!subCategory) {
        return res.status(404).json({
          success: false,
          message: 'Sub category not found or does not belong to the specified main category'
        });
      }
      subject.subCategory = subCategoryId;
    }

    // Update board if provided
    if (boardId !== undefined) {
      if (boardId === null || boardId === '') {
        // Remove board assignment
        subject.board = null;
      } else {
        // Verify board exists
        const board = await Board.findById(boardId);
        if (!board) {
          return res.status(404).json({
            success: false,
            message: 'Board not found'
          });
        }
        subject.board = boardId;
      }
    }

    if (isActive !== undefined) {
      subject.isActive = isActive === 'true' || isActive === true;
    }

    // Handle thumbnail update if provided
    if (req.file) {
      try {
        // Delete old thumbnail from S3 if exists
        if (subject.thumbnail) {
          try {
            await deleteFromS3(subject.thumbnail);
          } catch (error) {
            console.error('Error deleting old thumbnail:', error);
          }
        }

        // Process and upload new thumbnail
        const processedImage = await processImage(req.file.buffer);
        const fileExtension = getFileExtension(req.file.mimetype);
        const fileName = `subject-thumbnail-${Date.now()}-${subject.title.replace(/\s+/g, '-')}.${fileExtension}`;

        subject.thumbnail = await uploadToS3(processedImage, fileName, req.file.mimetype);
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: 'Error processing thumbnail',
          error: error.message
        });
      }
    }

    await subject.save();
    await subject.populate('mainCategory', 'name description image');
    await subject.populate('subCategory', 'name description image');
    if (subject.board) {
      await subject.populate('board', 'name description code');
    }

    res.json({
      success: true,
      message: 'Subject updated successfully',
      data: subject
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating subject',
      error: error.message
    });
  }
};

/**
 * Delete Subject (Super Admin only)
 */
const deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;

    const subject = await Subject.findById(id);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    // Check if subject has chapters
    const chaptersCount = await Chapter.countDocuments({ subject: id });
    if (chaptersCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete subject. It has ${chaptersCount} chapter(s). Please delete chapters first.`
      });
    }

    // Delete thumbnail from S3 if exists
    if (subject.thumbnail) {
      try {
        await deleteFromS3(subject.thumbnail);
      } catch (error) {
        console.error('Error deleting thumbnail from S3:', error);
      }
    }

    await Subject.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Subject deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting subject',
      error: error.message
    });
  }
};

/**
 * Create Chapter (Super Admin only)
 */
const createChapter = async (req, res) => {
  try {
    const { title, description, subjectId, order, textContent } = req.body;
    const createdBy = req.user.userId;

    if (!title || !subjectId) {
      return res.status(400).json({
        success: false,
        message: 'Title and subject ID are required'
      });
    }

    // Verify subject exists
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
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

    // Get the next order number if not provided
    let chapterOrder = order ? parseInt(order) : 0;
    if (!order) {
      const lastChapter = await Chapter.findOne({ subject: subjectId })
        .sort({ order: -1 });
      chapterOrder = lastChapter ? lastChapter.order + 1 : 1;
    }

    // Handle file uploads (PDF and Video)
    let pdfUrl = null;
    let pdfFileName = null;
    let videoUrl = null;
    let videoFileName = null;

    // Check for PDF file
    if (req.files && req.files.pdf) {
      try {
        const pdfFile = req.files.pdf[0];
        const fileName = `chapter-pdf-${Date.now()}-${title.trim().replace(/\s+/g, '-')}.pdf`;
        pdfUrl = await uploadToS3(pdfFile.buffer, fileName, pdfFile.mimetype);
        pdfFileName = pdfFile.originalname;
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: 'Error uploading PDF',
          error: error.message
        });
      }
    }

    // Check for Video file
    if (req.files && req.files.video) {
      try {
        const videoFile = req.files.video[0];
        const fileName = `chapter-video-${Date.now()}-${title.trim().replace(/\s+/g, '-')}.${getFileExtension(videoFile.mimetype)}`;
        videoUrl = await uploadToS3(videoFile.buffer, fileName, videoFile.mimetype);
        videoFileName = videoFile.originalname;
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: 'Error uploading video',
          error: error.message
        });
      }
    }

    // Create chapter
    const chapter = new Chapter({
      title: title.trim(),
      description: description ? description.trim() : null,
      subject: subjectId,
      order: chapterOrder,
      content: {
        text: textContent || null, // Markdown content
        pdf: pdfUrl ? {
          url: pdfUrl,
          fileName: pdfFileName
        } : null,
        video: videoUrl ? {
          url: videoUrl,
          fileName: videoFileName
        } : null
      },
      createdBy: superAdmin._id
    });

    await chapter.save();
    await chapter.populate('subject', 'title description thumbnail');

    res.status(201).json({
      success: true,
      message: 'Chapter created successfully',
      data: chapter
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating chapter',
      error: error.message
    });
  }
};

/**
 * Get All Chapters for a Subject (Super Admin - Protected)
 */
const getChaptersBySubject = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const { isActive } = req.query;

    const query = { subject: subjectId };
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const chapters = await Chapter.find(query)
      .populate('subject', 'title description thumbnail')
      .populate('createdBy', 'userId firstName lastName')
      .sort({ order: 1 });

    res.json({
      success: true,
      message: 'Chapters retrieved successfully',
      data: chapters,
      count: chapters.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving chapters',
      error: error.message
    });
  }
};

/**
 * Get Chapter by ID (Super Admin - Protected)
 */
const getChapterById = async (req, res) => {
  try {
    const { id } = req.params;

    const chapter = await Chapter.findById(id)
      .populate('subject', 'title description thumbnail mainCategory subCategory')
      .populate('createdBy', 'userId firstName lastName');

    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Chapter not found'
      });
    }

    res.json({
      success: true,
      message: 'Chapter retrieved successfully',
      data: chapter
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving chapter',
      error: error.message
    });
  }
};

/**
 * Update Chapter (Super Admin only)
 */
const updateChapter = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, order, textContent, isActive } = req.body;

    const chapter = await Chapter.findById(id);
    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Chapter not found'
      });
    }

    // Update fields
    if (title) {
      chapter.title = title.trim();
    }

    if (description !== undefined) {
      chapter.description = description ? description.trim() : null;
    }

    if (order !== undefined) {
      chapter.order = parseInt(order);
    }

    if (textContent !== undefined) {
      chapter.content.text = textContent || null;
    }

    if (isActive !== undefined) {
      chapter.isActive = isActive === 'true' || isActive === true;
    }

    // Handle PDF update if provided
    if (req.files && req.files.pdf) {
      try {
        // Delete old PDF if exists
        if (chapter.content.pdf && chapter.content.pdf.url) {
          try {
            await deleteFromS3(chapter.content.pdf.url);
          } catch (error) {
            console.error('Error deleting old PDF:', error);
          }
        }

        const pdfFile = req.files.pdf[0];
        const fileName = `chapter-pdf-${Date.now()}-${chapter.title.replace(/\s+/g, '-')}.pdf`;
        const pdfUrl = await uploadToS3(pdfFile.buffer, fileName, pdfFile.mimetype);
        
        chapter.content.pdf = {
          url: pdfUrl,
          fileName: pdfFile.originalname
        };
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: 'Error uploading PDF',
          error: error.message
        });
      }
    }

    // Handle Video update if provided
    if (req.files && req.files.video) {
      try {
        // Delete old video if exists
        if (chapter.content.video && chapter.content.video.url) {
          try {
            await deleteFromS3(chapter.content.video.url);
          } catch (error) {
            console.error('Error deleting old video:', error);
          }
        }

        const videoFile = req.files.video[0];
        const fileName = `chapter-video-${Date.now()}-${chapter.title.replace(/\s+/g, '-')}.${getFileExtension(videoFile.mimetype)}`;
        const videoUrl = await uploadToS3(videoFile.buffer, fileName, videoFile.mimetype);
        
        chapter.content.video = {
          url: videoUrl,
          fileName: videoFile.originalname
        };
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: 'Error uploading video',
          error: error.message
        });
      }
    }

    await chapter.save();
    await chapter.populate('subject', 'title description thumbnail');

    res.json({
      success: true,
      message: 'Chapter updated successfully',
      data: chapter
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating chapter',
      error: error.message
    });
  }
};

/**
 * Delete Chapter (Super Admin only)
 */
const deleteChapter = async (req, res) => {
  try {
    const { id } = req.params;

    const chapter = await Chapter.findById(id);
    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Chapter not found'
      });
    }

    // Delete files from S3 if they exist
    if (chapter.content.pdf && chapter.content.pdf.url) {
      try {
        await deleteFromS3(chapter.content.pdf.url);
      } catch (error) {
        console.error('Error deleting PDF from S3:', error);
      }
    }

    if (chapter.content.video && chapter.content.video.url) {
      try {
        await deleteFromS3(chapter.content.video.url);
      } catch (error) {
        console.error('Error deleting video from S3:', error);
      }
    }

    await Chapter.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Chapter deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting chapter',
      error: error.message
    });
  }
};

module.exports = {
  // Subject
  createSubject,
  getAllSubjects,
  getSubjectById,
  updateSubject,
  deleteSubject,
  // Chapter
  createChapter,
  getChaptersBySubject,
  getChapterById,
  updateChapter,
  deleteChapter
};

