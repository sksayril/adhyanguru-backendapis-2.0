const Course = require('../models/course.model');
const CourseChapter = require('../models/courseChapter.model');
const { processImage, getFileExtension } = require('../services/imageProcessingService');
const { uploadToS3, deleteFromS3 } = require('../services/awsS3Service');

/**
 * Create Course (Super Admin only)
 */
const createCourse = async (req, res) => {
  try {
    const { title, description, price } = req.body;
    const createdBy = req.user.userId; // Super Admin ID from token

    if (!title || !price) {
      return res.status(400).json({
        success: false,
        message: 'Title and price are required'
      });
    }

    if (isNaN(price) || parseFloat(price) < 0) {
      return res.status(400).json({
        success: false,
        message: 'Price must be a valid number greater than or equal to 0'
      });
    }

    // Check if course with same title already exists
    const existingCourse = await Course.findOne({ title: title.trim() });
    if (existingCourse) {
      return res.status(400).json({
        success: false,
        message: 'Course with this title already exists'
      });
    }

    // Handle thumbnail upload if provided
    let thumbnailUrl = null;
    if (req.file) {
      try {
        const processedImage = await processImage(req.file.buffer);
        const fileExtension = getFileExtension(req.file.mimetype);
        const fileName = `course-${Date.now()}-${title.trim().replace(/\s+/g, '-')}.${fileExtension}`;
        thumbnailUrl = await uploadToS3(processedImage, fileName, req.file.mimetype, 'course-thumbnails');
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: 'Error processing thumbnail',
          error: error.message
        });
      }
    }

    const course = new Course({
      title: title.trim(),
      description: description ? description.trim() : null,
      thumbnail: thumbnailUrl,
      price: parseFloat(price),
      createdBy
    });

    await course.save();

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: course
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating course',
      error: error.message
    });
  }
};

/**
 * Get All Courses (Super Admin - Protected)
 */
const getAllCourses = async (req, res) => {
  try {
    const { isActive } = req.query;

    const query = {};
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const courses = await Course.find(query)
      .populate('createdBy', 'userId firstName lastName')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      message: 'Courses retrieved successfully',
      data: courses,
      count: courses.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving courses',
      error: error.message
    });
  }
};

/**
 * Get Course by ID (Super Admin - Protected)
 */
const getCourseById = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await Course.findById(id)
      .populate('createdBy', 'userId firstName lastName');

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Get chapters for this course
    const chapters = await CourseChapter.find({ course: id, isActive: true })
      .sort({ order: 1 })
      .select('title description order content isActive createdAt updatedAt');

    res.json({
      success: true,
      message: 'Course retrieved successfully',
      data: {
        ...course.toObject(),
        chapters: chapters
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving course',
      error: error.message
    });
  }
};

/**
 * Update Course (Super Admin only)
 */
const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, price, isActive } = req.body;

    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    if (title) {
      // Check if another course with same title exists
      const existingCourse = await Course.findOne({ 
        title: title.trim(),
        _id: { $ne: id }
      });
      if (existingCourse) {
        return res.status(400).json({
          success: false,
          message: 'Course with this title already exists'
        });
      }
      course.title = title.trim();
    }

    if (description !== undefined) {
      course.description = description ? description.trim() : null;
    }

    if (price !== undefined) {
      if (isNaN(price) || parseFloat(price) < 0) {
        return res.status(400).json({
          success: false,
          message: 'Price must be a valid number greater than or equal to 0'
        });
      }
      course.price = parseFloat(price);
    }

    if (isActive !== undefined) {
      course.isActive = isActive === 'true' || isActive === true;
    }

    // Handle thumbnail update if provided
    if (req.file) {
      try {
        // Delete old thumbnail from S3 if exists
        if (course.thumbnail) {
          try {
            await deleteFromS3(course.thumbnail);
          } catch (error) {
            console.error('Error deleting old thumbnail:', error);
          }
        }

        const processedImage = await processImage(req.file.buffer);
        const fileExtension = getFileExtension(req.file.mimetype);
        const fileName = `course-${Date.now()}-${course.title.trim().replace(/\s+/g, '-')}.${fileExtension}`;
        course.thumbnail = await uploadToS3(processedImage, fileName, req.file.mimetype);
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: 'Error processing thumbnail',
          error: error.message
        });
      }
    }

    await course.save();

    res.json({
      success: true,
      message: 'Course updated successfully',
      data: course
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating course',
      error: error.message
    });
  }
};

/**
 * Delete Course (Super Admin only)
 */
const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if course has chapters
    const chaptersCount = await CourseChapter.countDocuments({ course: id });
    if (chaptersCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete course. Please delete all chapters first.'
      });
    }

    // Delete thumbnail from S3 if exists
    if (course.thumbnail) {
      try {
        await deleteFromS3(course.thumbnail);
      } catch (error) {
        console.error('Error deleting thumbnail:', error);
      }
    }

    await Course.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting course',
      error: error.message
    });
  }
};

/**
 * Create Course Chapter (Super Admin only)
 */
const createCourseChapter = async (req, res) => {
  try {
    const { title, description, courseId, order, text } = req.body;
    const createdBy = req.user.userId;

    if (!title || !courseId || order === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Title, course ID, and order are required'
      });
    }

    // Verify course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if order already exists for this course
    const existingChapter = await CourseChapter.findOne({
      course: courseId,
      order: parseInt(order)
    });
    if (existingChapter) {
      return res.status(400).json({
        success: false,
        message: 'Chapter with this order already exists for this course'
      });
    }

    // Handle PDF upload if provided
    let pdfUrl = null;
    if (req.files && req.files.pdf && req.files.pdf[0]) {
      try {
        const pdfFile = req.files.pdf[0];
        const fileName = `course-chapter-${Date.now()}-${title.trim().replace(/\s+/g, '-')}.pdf`;
        
        // Handle file from disk storage (handleMultipleUpload uses diskStorage)
        const fs = require('fs');
        let pdfBody;
        if (pdfFile.path) {
          // File is on disk, read it as a buffer (S3 requires buffer, not stream for small files)
          pdfBody = fs.readFileSync(pdfFile.path);
        } else if (pdfFile.buffer) {
          // File is in memory (buffer)
          pdfBody = pdfFile.buffer;
        } else {
          throw new Error('PDF file data not found');
        }
        
        if (!pdfBody || pdfBody.length === 0) {
          throw new Error('PDF file is empty');
        }
        
        pdfUrl = await uploadToS3(pdfBody, fileName, pdfFile.mimetype, 'course-pdfs');
        
        // Clean up temp file if it was on disk
        if (pdfFile.path) {
          fs.unlink(pdfFile.path, (err) => {
            if (err) console.error('Error deleting temp PDF file:', err);
          });
        }
      } catch (error) {
        // Clean up temp file on error
        if (req.files.pdf[0] && req.files.pdf[0].path) {
          const fs = require('fs');
          fs.unlink(req.files.pdf[0].path, () => {});
        }
        return res.status(500).json({
          success: false,
          message: 'Error uploading PDF',
          error: error.message
        });
      }
    }

    // Handle Video upload if provided
    let videoUrl = null;
    if (req.files && req.files.video && req.files.video[0]) {
      try {
        const videoFile = req.files.video[0];
        
        // Check if video was already uploaded to S3 by middleware
        if (videoFile.s3Url) {
          // Video already uploaded by middleware, just use the URL
          videoUrl = videoFile.s3Url;
        } else {
          // Video not uploaded yet, need to upload it
          const fileName = `course-chapter-${Date.now()}-${title.trim().replace(/\s+/g, '-')}.${getFileExtension(videoFile.mimetype)}`;
          
          // Handle file from disk storage
          const fs = require('fs');
          let videoBody;
          if (videoFile.path) {
            // For large videos, use stream; for smaller ones, use buffer
            // Check file size first
            const stats = fs.statSync(videoFile.path);
            if (stats.size > 100 * 1024 * 1024) { // > 100MB, use stream
              videoBody = fs.createReadStream(videoFile.path);
            } else {
              // Smaller file, read as buffer
              videoBody = fs.readFileSync(videoFile.path);
            }
          } else if (videoFile.buffer) {
            // File is in memory (buffer)
            videoBody = videoFile.buffer;
          } else {
            throw new Error('Video file data not found');
          }
          
          if (!videoBody) {
            throw new Error('Video file is empty');
          }
          
          videoUrl = await uploadToS3(videoBody, fileName, videoFile.mimetype, 'course-videos');
          
          // Clean up temp file if it was on disk
          if (videoFile.path) {
            fs.unlink(videoFile.path, (err) => {
              if (err) console.error('Error deleting temp video file:', err);
            });
          }
        }
      } catch (error) {
        // Clean up temp file on error
        if (req.files.video[0] && req.files.video[0].path) {
          const fs = require('fs');
          fs.unlink(req.files.video[0].path, () => {});
        }
        return res.status(500).json({
          success: false,
          message: 'Error uploading video',
          error: error.message
        });
      }
    }

    const chapter = new CourseChapter({
      title: title.trim(),
      description: description ? description.trim() : null,
      course: courseId,
      order: parseInt(order),
      content: {
        text: text || null,
        pdf: pdfUrl,
        video: videoUrl
      },
      createdBy
    });

    await chapter.save();

    res.status(201).json({
      success: true,
      message: 'Course chapter created successfully',
      data: chapter
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating course chapter',
      error: error.message
    });
  }
};

/**
 * Get All Chapters for a Course (Super Admin - Protected)
 */
const getCourseChapters = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { isActive } = req.query;

    const query = { course: courseId };
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const chapters = await CourseChapter.find(query)
      .populate('course', 'title description thumbnail')
      .populate('createdBy', 'userId firstName lastName')
      .sort({ order: 1 });

    res.json({
      success: true,
      message: 'Course chapters retrieved successfully',
      data: chapters,
      count: chapters.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving course chapters',
      error: error.message
    });
  }
};

/**
 * Get Course Chapter by ID (Super Admin - Protected)
 */
const getCourseChapterById = async (req, res) => {
  try {
    const { id } = req.params;

    const chapter = await CourseChapter.findById(id)
      .populate('course', 'title description thumbnail')
      .populate('createdBy', 'userId firstName lastName');

    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Course chapter not found'
      });
    }

    res.json({
      success: true,
      message: 'Course chapter retrieved successfully',
      data: chapter
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving course chapter',
      error: error.message
    });
  }
};

/**
 * Update Course Chapter (Super Admin only)
 */
const updateCourseChapter = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, order, text, isActive } = req.body;

    const chapter = await CourseChapter.findById(id);
    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Course chapter not found'
      });
    }

    if (title) {
      chapter.title = title.trim();
    }

    if (description !== undefined) {
      chapter.description = description ? description.trim() : null;
    }

    if (order !== undefined) {
      // Check if order already exists for this course
      const existingChapter = await CourseChapter.findOne({
        course: chapter.course,
        order: parseInt(order),
        _id: { $ne: id }
      });
      if (existingChapter) {
        return res.status(400).json({
          success: false,
          message: 'Chapter with this order already exists for this course'
        });
      }
      chapter.order = parseInt(order);
    }

    if (text !== undefined) {
      chapter.content.text = text || null;
    }

    if (isActive !== undefined) {
      chapter.isActive = isActive === 'true' || isActive === true;
    }

        // Handle PDF update if provided
    if (req.files && req.files.pdf && req.files.pdf[0]) {
      try {
        // Delete old PDF from S3 if exists (optional - don't fail if delete fails)
        if (chapter.content.pdf) {
          try {
            await deleteFromS3(chapter.content.pdf);
          } catch (error) {
            // Log but don't fail - S3 delete is optional
            console.warn('Could not delete old PDF from S3 (this is optional):', error.message);
          }
        }

        const pdfFile = req.files.pdf[0];
        const fileName = `course-chapter-${Date.now()}-${chapter.title.trim().replace(/\s+/g, '-')}.pdf`;
        
        // Handle file from disk storage (handleMultipleUpload uses diskStorage)
        const fs = require('fs');
        let pdfBody;
        if (pdfFile.path) {
          // File is on disk, read it as a buffer (S3 requires buffer, not stream for small files)
          pdfBody = fs.readFileSync(pdfFile.path);
        } else if (pdfFile.buffer) {
          // File is in memory (buffer)
          pdfBody = pdfFile.buffer;
        } else {
          throw new Error('PDF file data not found');
        }
        
        if (!pdfBody || pdfBody.length === 0) {
          throw new Error('PDF file is empty');
        }
        
        chapter.content.pdf = await uploadToS3(pdfBody, fileName, pdfFile.mimetype, 'course-pdfs');
        
        // Clean up temp file if it was on disk
        if (pdfFile.path) {
          const fs = require('fs');
          fs.unlink(pdfFile.path, (err) => {
            if (err) console.error('Error deleting temp PDF file:', err);
          });
        }
      } catch (error) {
        // Clean up temp file on error
        if (req.files.pdf[0] && req.files.pdf[0].path) {
          const fs = require('fs');
          fs.unlink(req.files.pdf[0].path, () => {});
        }
        return res.status(500).json({
          success: false,
          message: 'Error uploading PDF',
          error: error.message
        });
      }
    }

    // Handle Video update if provided
    if (req.files && req.files.video && req.files.video[0]) {
      try {
        const videoFile = req.files.video[0];
        
        // Check if video was already uploaded to S3 by middleware
        if (videoFile.s3Url) {
          // Video already uploaded by middleware, just use the URL
          // Delete old video from S3 if exists
          if (chapter.content.video) {
            try {
              await deleteFromS3(chapter.content.video);
            } catch (error) {
              console.error('Error deleting old video:', error);
            }
          }
          chapter.content.video = videoFile.s3Url;
        } else {
          // Video not uploaded yet, need to upload it
          // Delete old video from S3 if exists (optional - don't fail if delete fails)
          if (chapter.content.video) {
            try {
              await deleteFromS3(chapter.content.video);
            } catch (error) {
              // Log but don't fail - S3 delete is optional
              console.warn('Could not delete old video from S3 (this is optional):', error.message);
            }
          }

          const fileName = `course-chapter-${Date.now()}-${chapter.title.trim().replace(/\s+/g, '-')}.${getFileExtension(videoFile.mimetype)}`;
          
          // Handle file from disk storage
          const fs = require('fs');
          let videoBody;
          if (videoFile.path) {
            // For large videos, use stream; for smaller ones, use buffer
            // Check file size first
            const stats = fs.statSync(videoFile.path);
            if (stats.size > 100 * 1024 * 1024) { // > 100MB, use stream
              videoBody = fs.createReadStream(videoFile.path);
            } else {
              // Smaller file, read as buffer
              videoBody = fs.readFileSync(videoFile.path);
            }
          } else if (videoFile.buffer) {
            // File is in memory (buffer)
            videoBody = videoFile.buffer;
          } else {
            throw new Error('Video file data not found');
          }
          
          if (!videoBody) {
            throw new Error('Video file is empty');
          }
          
          chapter.content.video = await uploadToS3(videoBody, fileName, videoFile.mimetype, 'course-videos');
          
          // Clean up temp file if it was on disk
          if (videoFile.path) {
            const fs = require('fs');
            fs.unlink(videoFile.path, (err) => {
              if (err) console.error('Error deleting temp video file:', err);
            });
          }
        }
      } catch (error) {
        // Clean up temp file on error
        if (req.files.video[0] && req.files.video[0].path) {
          const fs = require('fs');
          fs.unlink(req.files.video[0].path, () => {});
        }
        return res.status(500).json({
          success: false,
          message: 'Error uploading video',
          error: error.message
        });
      }
    }

    await chapter.save();

    res.json({
      success: true,
      message: 'Course chapter updated successfully',
      data: chapter
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating course chapter',
      error: error.message
    });
  }
};

/**
 * Delete Course Chapter (Super Admin only)
 */
const deleteCourseChapter = async (req, res) => {
  try {
    const { id } = req.params;

    const chapter = await CourseChapter.findById(id);
    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Course chapter not found'
      });
    }

    // Delete PDF from S3 if exists (optional - don't fail if delete fails)
    if (chapter.content.pdf) {
      try {
        await deleteFromS3(chapter.content.pdf);
      } catch (error) {
        // S3 deletion is optional, just log warning
        console.warn('Could not delete PDF from S3 (this is optional):', error.message);
      }
    }

    // Delete video from S3 if exists (optional - don't fail if delete fails)
    if (chapter.content.video) {
      try {
        await deleteFromS3(chapter.content.video);
      } catch (error) {
        // S3 deletion is optional, just log warning
        console.warn('Could not delete video from S3 (this is optional):', error.message);
      }
    }

    await CourseChapter.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Course chapter deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting course chapter',
      error: error.message
    });
  }
};

/**
 * Get All Public Courses (Public - No authentication)
 */
const getPublicCourses = async (req, res) => {
  try {
    const courses = await Course.find({ isActive: true })
      .select('title description thumbnail price createdAt')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      message: 'Public courses retrieved successfully',
      data: {
        courses,
        totalCourses: courses.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving public courses',
      error: error.message
    });
  }
};

/**
 * Get Course Details (Public - Optional authentication)
 */
const getCourseDetails = async (req, res) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user ? req.user.userId : null; // Optional authentication

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    if (!course.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Get chapters
    const chapters = await CourseChapter.find({
      course: courseId,
      isActive: true
    })
      .select('title description order content isActive')
      .sort({ order: 1 });

    // Check if student has purchased this course
    let isPurchased = false;
    if (studentId) {
      const StudentCoursePurchase = require('../models/studentCoursePurchase.model');
      const purchase = await StudentCoursePurchase.findOne({
        student: studentId,
        course: courseId,
        paymentStatus: 'COMPLETED'
      });
      isPurchased = purchase !== null;
    }

    res.json({
      success: true,
      message: 'Course details retrieved successfully',
      data: {
        course: {
          _id: course._id,
          title: course.title,
          description: course.description,
          thumbnail: course.thumbnail,
          price: course.price,
          createdAt: course.createdAt
        },
        chapters: isPurchased 
          ? chapters // Show all content if purchased
          : chapters.map(ch => ({
              _id: ch._id,
              title: ch.title,
              description: ch.description,
              order: ch.order,
              content: {
                text: null, // Hide content if not purchased
                pdf: null,
                video: null
              },
              isActive: ch.isActive
            })),
        totalChapters: chapters.length,
        isPurchased,
        canAccessContent: isPurchased
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving course details',
      error: error.message
    });
  }
};

module.exports = {
  // Course
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  // Course Chapter
  createCourseChapter,
  getCourseChapters,
  getCourseChapterById,
  updateCourseChapter,
  deleteCourseChapter,
  // Public
  getPublicCourses,
  getCourseDetails
};

