const Student = require('../models/student.model');
const MainCategory = require('../models/mainCategory.model');
const SubCategory = require('../models/subCategory.model');
const Subject = require('../models/subject.model');
const Chapter = require('../models/chapter.model');
const StudentChapterProgress = require('../models/studentChapterProgress.model');
const StudentSubscription = require('../models/studentSubscription.model');
const Plan = require('../models/plan.model');
const Course = require('../models/course.model');
const CourseChapter = require('../models/courseChapter.model');
const StudentCoursePurchase = require('../models/studentCoursePurchase.model');
const StudentCourseChapterProgress = require('../models/studentCourseChapterProgress.model');
const StudentChapterResult = require('../models/studentChapterResult.model');
const StudentCourseChapterResult = require('../models/studentCourseChapterResult.model');
const { encryptPassword, comparePassword } = require('../services/passwordService');
const { generateUserId, getNextSequenceNumber } = require('../services/userIdService');
const { generateToken } = require('../middleware/auth');
const { USER_ROLES } = require('../utils/constants');
const { processImage, getFileExtension } = require('../services/imageProcessingService');
const { uploadToS3 } = require('../services/awsS3Service');
const { createOrder, verifyPayment, getPaymentDetails, getOrderDetails } = require('../services/razorpayService');

/**
 * Student Signup
 */
const signup = async (req, res) => {
  try {
    const { 
      firstName, 
      lastName, 
      email, 
      mobileNumber, 
      password, 
      categories, // Array of {mainCategoryId, subCategoryId} - can be JSON string or array
      latitude,
      longitude,
      address,
      pincode,
      fieldEmployeeCode
    } = req.body;

    // Validation
    if (!firstName || !lastName || !mobileNumber || !password) {
      return res.status(400).json({
        success: false,
        message: 'First name, last name, mobile number, and password are required'
      });
    }

    // Parse categories if it's a JSON string (from form data)
    let categoriesArray = categories;
    if (typeof categories === 'string') {
      try {
        categoriesArray = JSON.parse(categories);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid categories format. Must be a valid JSON array.'
        });
      }
    }

    // Validate categories array
    if (!categoriesArray || !Array.isArray(categoriesArray) || categoriesArray.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one category (main category and sub category) is required'
      });
    }

    // Validate and verify all categories
    const validatedCategories = [];
    for (const cat of categoriesArray) {
      if (!cat.mainCategoryId || !cat.subCategoryId) {
        return res.status(400).json({
          success: false,
          message: 'Each category must have both mainCategoryId and subCategoryId'
        });
      }

      // Verify main category exists
      const mainCategory = await MainCategory.findById(cat.mainCategoryId);
      if (!mainCategory) {
        return res.status(404).json({
          success: false,
          message: `Main category with ID ${cat.mainCategoryId} not found`
        });
      }

      // Verify sub category exists and belongs to main category
      const subCategory = await SubCategory.findOne({
        _id: cat.subCategoryId,
        mainCategory: cat.mainCategoryId
      });
      if (!subCategory) {
        return res.status(404).json({
          success: false,
          message: `Sub category with ID ${cat.subCategoryId} not found or does not belong to main category ${cat.mainCategoryId}`
        });
      }

      // Check for duplicates
      const isDuplicate = validatedCategories.some(
        vc => vc.mainCategory.toString() === cat.mainCategoryId && 
              vc.subCategory.toString() === cat.subCategoryId
      );
      if (isDuplicate) {
        return res.status(400).json({
          success: false,
          message: `Duplicate category combination: main category ${cat.mainCategoryId} and sub category ${cat.subCategoryId}`
        });
      }

      validatedCategories.push({
        mainCategory: cat.mainCategoryId,
        subCategory: cat.subCategoryId
      });
    }

    // Check if student already exists
    const existingStudent = await Student.findOne({
      $or: [
        { mobileNumber },
        ...(email ? [{ email }] : [])
      ]
    });

    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: 'Student already exists with this mobile number or email'
      });
    }

    // Generate user ID
    const count = await Student.countDocuments();
    const sequenceNumber = getNextSequenceNumber(count);
    const userId = generateUserId(USER_ROLES.STUDENT, sequenceNumber);

    // Encrypt password
    const encryptedPassword = encryptPassword(password);

    // Handle profile picture upload if provided
    let profilePictureUrl = null;
    if (req.file) {
      try {
        // Process image with Jimp
        const processedImage = await processImage(req.file.buffer);
        const fileExtension = getFileExtension(req.file.mimetype);
        const fileName = `student-${Date.now()}-${firstName.trim().replace(/\s+/g, '-')}.${fileExtension}`;

        // Upload to S3
        profilePictureUrl = await uploadToS3(processedImage, fileName, req.file.mimetype);
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: 'Error processing profile picture',
          error: error.message
        });
      }
    }

    // Create student
    const student = new Student({
      userId,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email ? email.trim().toLowerCase() : null,
      mobileNumber: mobileNumber.trim(),
      password: encryptedPassword,
      encryptedPassword: encryptedPassword,
      profilePicture: profilePictureUrl,
      mainCategories: validatedCategories,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      address: address ? address.trim() : null,
      pincode: pincode ? pincode.trim() : null,
      fieldEmployeeCode: fieldEmployeeCode ? fieldEmployeeCode.trim() : null
    });

    await student.save();
    
    // Reload the document to ensure proper population
    const populatedStudent = await Student.findById(student._id)
      .populate('mainCategories.mainCategory', 'name description image')
      .populate('mainCategories.subCategory', 'name description image');

    // Generate JWT token
    const token = generateToken({
      _id: populatedStudent._id,
      userId: populatedStudent.userId,
      role: populatedStudent.role,
      email: populatedStudent.email || populatedStudent.mobileNumber
    });

    res.status(201).json({
      success: true,
      message: 'Student registered successfully',
      data: {
        token,
        user: {
          _id: populatedStudent._id,
          userId: populatedStudent.userId,
          firstName: populatedStudent.firstName,
          lastName: populatedStudent.lastName,
          email: populatedStudent.email,
          mobileNumber: populatedStudent.mobileNumber,
          profilePicture: populatedStudent.profilePicture,
          mainCategories: populatedStudent.mainCategories,
          latitude: populatedStudent.latitude,
          longitude: populatedStudent.longitude,
          address: populatedStudent.address,
          pincode: populatedStudent.pincode,
          fieldEmployeeCode: populatedStudent.fieldEmployeeCode,
          role: populatedStudent.role,
          createdAt: populatedStudent.createdAt
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error registering student',
      error: error.message
    });
  }
};

/**
 * Student Login
 * Can login with mobile number or email and password
 */
const login = async (req, res) => {
  try {
    const { identifier, password } = req.body; // identifier can be mobile number or email

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number/email and password are required'
      });
    }

    // Find student by mobile number or email
    const student = await Student.findOne({
      $or: [
        { mobileNumber: identifier },
        { email: identifier.toLowerCase() }
      ]
    })
      .populate('mainCategories.mainCategory', 'name description image')
      .populate('mainCategories.subCategory', 'name description image');

    if (!student) {
      return res.status(401).json({
        success: false,
        message: 'Invalid mobile number/email or password'
      });
    }

    // Check if student is active
    if (!student.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.'
      });
    }

    // Compare password
    const isPasswordValid = comparePassword(password, student.encryptedPassword);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid mobile number/email or password'
      });
    }

    // Generate JWT token
    const token = generateToken({
      _id: student._id,
      userId: student.userId,
      role: student.role,
      email: student.email || student.mobileNumber
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          _id: student._id,
          userId: student.userId,
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.email,
          mobileNumber: student.mobileNumber,
          profilePicture: student.profilePicture,
          mainCategories: student.mainCategories,
          latitude: student.latitude,
          longitude: student.longitude,
          address: student.address,
          pincode: student.pincode,
          fieldEmployeeCode: student.fieldEmployeeCode,
          role: student.role,
          createdAt: student.createdAt
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error during login',
      error: error.message
    });
  }
};

/**
 * Update Student Profile
 * Allows students to update their profile and add more categories
 */
const updateProfile = async (req, res) => {
  try {
    // Verify the user is a student
    if (!req.user || req.user.role !== USER_ROLES.STUDENT) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Student role required.'
      });
    }

    const studentId = req.user.userId; // From authenticated user (MongoDB _id)

    if (!studentId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User ID not found.'
      });
    }

    const {
      firstName,
      lastName,
      email,
      latitude,
      longitude,
      address,
      pincode,
      fieldEmployeeCode,
      categories // Array of {mainCategoryId, subCategoryId} to add - can be JSON string or array
    } = req.body;

    // Parse categories if it's a JSON string (from form data)
    let categoriesArray = categories;
    if (categories && typeof categories === 'string') {
      try {
        categoriesArray = JSON.parse(categories);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid categories format. Must be a valid JSON array.'
        });
      }
    }

    // Find student
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Update basic fields
    if (firstName) {
      student.firstName = firstName.trim();
    }

    if (lastName) {
      student.lastName = lastName.trim();
    }

    if (email !== undefined) {
      if (email === null || email === '') {
        student.email = null;
      } else {
        // Check if email is already taken by another student
        const existingStudent = await Student.findOne({
          email: email.trim().toLowerCase(),
          _id: { $ne: studentId }
        });
        if (existingStudent) {
          return res.status(400).json({
            success: false,
            message: 'Email is already taken by another student'
          });
        }
        student.email = email.trim().toLowerCase();
      }
    }

    if (latitude !== undefined) {
      student.latitude = latitude ? parseFloat(latitude) : null;
    }

    if (longitude !== undefined) {
      student.longitude = longitude ? parseFloat(longitude) : null;
    }

    if (address !== undefined) {
      student.address = address ? address.trim() : null;
    }

    if (pincode !== undefined) {
      student.pincode = pincode ? pincode.trim() : null;
    }

    if (fieldEmployeeCode !== undefined) {
      student.fieldEmployeeCode = fieldEmployeeCode ? fieldEmployeeCode.trim() : null;
    }

    // Handle profile picture update if provided
    if (req.file) {
      try {
        // Delete old profile picture from S3 if exists
        if (student.profilePicture) {
          try {
            const { deleteFromS3 } = require('../services/awsS3Service');
            await deleteFromS3(student.profilePicture);
          } catch (error) {
            console.error('Error deleting old profile picture:', error);
          }
        }

        // Process and upload new profile picture
        const processedImage = await processImage(req.file.buffer);
        const fileExtension = getFileExtension(req.file.mimetype);
        const fileName = `student-${Date.now()}-${student.firstName.replace(/\s+/g, '-')}.${fileExtension}`;

        student.profilePicture = await uploadToS3(processedImage, fileName, req.file.mimetype);
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: 'Error processing profile picture',
          error: error.message
        });
      }
    }

    // Handle adding new categories
    if (categoriesArray && Array.isArray(categoriesArray) && categoriesArray.length > 0) {
      for (const cat of categoriesArray) {
        if (!cat.mainCategoryId || !cat.subCategoryId) {
          return res.status(400).json({
            success: false,
            message: 'Each category must have both mainCategoryId and subCategoryId'
          });
        }

        // Verify main category exists
        const mainCategory = await MainCategory.findById(cat.mainCategoryId);
        if (!mainCategory) {
          return res.status(404).json({
            success: false,
            message: `Main category with ID ${cat.mainCategoryId} not found`
          });
        }

        // Verify sub category exists and belongs to main category
        const subCategory = await SubCategory.findOne({
          _id: cat.subCategoryId,
          mainCategory: cat.mainCategoryId
        });
        if (!subCategory) {
          return res.status(404).json({
            success: false,
            message: `Sub category with ID ${cat.subCategoryId} not found or does not belong to main category ${cat.mainCategoryId}`
          });
        }

        // Check if this category combination already exists
        const categoryExists = student.mainCategories.some(
          mc => mc.mainCategory.toString() === cat.mainCategoryId && 
                mc.subCategory.toString() === cat.subCategoryId
        );

        if (!categoryExists) {
          student.mainCategories.push({
            mainCategory: cat.mainCategoryId,
            subCategory: cat.subCategoryId
          });
        }
      }
    }

    await student.save();
    await student.populate('mainCategories.mainCategory', 'name description image');
    await student.populate('mainCategories.subCategory', 'name description image');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        _id: student._id,
        userId: student.userId,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        mobileNumber: student.mobileNumber,
        profilePicture: student.profilePicture,
        mainCategories: student.mainCategories,
        latitude: student.latitude,
        longitude: student.longitude,
        address: student.address,
        pincode: student.pincode,
        fieldEmployeeCode: student.fieldEmployeeCode,
        role: student.role,
        createdAt: student.createdAt,
        updatedAt: student.updatedAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
};

/**
 * Student Logout
 */
const logout = async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: error.message
    });
  }
};

/**
 * Get Student Profile
 * Returns student data (protected - requires authentication)
 */
const getStudentProfile = async (req, res) => {
  try {
    // Verify the user is a student
    if (!req.user || req.user.role !== USER_ROLES.STUDENT) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Student role required.'
      });
    }

    const studentId = req.user.userId; // From authenticated user (MongoDB _id)

    if (!studentId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User ID not found.'
      });
    }

    // Find student with populated categories
    const student = await Student.findById(studentId)
      .populate('mainCategories.mainCategory', 'name description image')
      .populate('mainCategories.subCategory', 'name description image');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found with the provided token'
      });
    }

    res.json({
      success: true,
      message: 'Student profile retrieved successfully',
      data: {
        _id: student._id,
        userId: student.userId,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        mobileNumber: student.mobileNumber,
        profilePicture: student.profilePicture,
        mainCategories: student.mainCategories,
        latitude: student.latitude,
        longitude: student.longitude,
        address: student.address,
        pincode: student.pincode,
        fieldEmployeeCode: student.fieldEmployeeCode,
        role: student.role,
        createdAt: student.createdAt,
        updatedAt: student.updatedAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving student profile',
      error: error.message
    });
  }
};

/**
 * Get Student's Subjects by Board
 * Returns subjects grouped by board for the student's selected categories (no chapters)
 */
const getMyBoardsSubjects = async (req, res) => {
  try {
    // Verify the user is a student
    if (!req.user || req.user.role !== USER_ROLES.STUDENT) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Student role required.'
      });
    }

    const studentId = req.user.userId; // From authenticated user (MongoDB _id)

    if (!studentId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User ID not found.'
      });
    }

    // Find student with populated categories
    const student = await Student.findById(studentId)
      .populate('mainCategories.mainCategory', 'name description image')
      .populate('mainCategories.subCategory', 'name description image');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found with the provided token'
      });
    }

    // Get all unique subcategory IDs from student's categories
    const subCategoryIds = student.mainCategories.map(cat => cat.subCategory._id);

    if (subCategoryIds.length === 0) {
      return res.json({
        success: true,
        message: 'No categories found for student',
        data: {
          boards: [],
          totalBoards: 0,
          totalSubjects: 0
        }
      });
    }

    // Find all subjects that belong to these subcategories
    const subjects = await Subject.find({
      subCategory: { $in: subCategoryIds },
      isActive: true
    })
      .populate('mainCategory', 'name description image')
      .populate('subCategory', 'name description image')
      .populate('board', 'name description code')
      .sort({ createdAt: -1 });

    // Get active subscriptions for student's subcategories
    const now = new Date();
    const activeSubscriptions = await StudentSubscription.find({
      student: studentId,
      subCategory: { $in: subCategoryIds },
      isActive: true,
      paymentStatus: 'COMPLETED',
      endDate: { $gt: now }
    });

    // Create a map of subcategory to subscription status
    const subscriptionMap = {};
    activeSubscriptions.forEach(sub => {
      subscriptionMap[sub.subCategory.toString()] = true;
    });

    // Group subjects by board
    const boardsMap = {};
    const subjectsWithoutBoard = [];

    subjects.forEach(subject => {
      if (subject.board) {
        const boardId = subject.board._id.toString();
        if (!boardsMap[boardId]) {
          boardsMap[boardId] = {
            board: {
              _id: subject.board._id,
              name: subject.board.name,
              description: subject.board.description,
              code: subject.board.code
            },
            subjects: []
          };
        }
        // Check if student has active subscription for this subcategory
        const hasActiveSubscription = subscriptionMap[subject.subCategory._id.toString()] === true;
        
        // Add subject without chapters
        boardsMap[boardId].subjects.push({
          _id: subject._id,
          title: subject.title,
          description: subject.description,
          thumbnail: subject.thumbnail,
          mainCategory: subject.mainCategory,
          subCategory: subject.subCategory,
          board: {
            _id: subject.board._id,
            name: subject.board.name,
            description: subject.board.description,
            code: subject.board.code
          },
          isActive: subject.isActive,
          hasActiveSubscription: hasActiveSubscription,
          createdAt: subject.createdAt,
          updatedAt: subject.updatedAt
        });
      } else {
        // Check if student has active subscription for this subcategory
        const hasActiveSubscription = subscriptionMap[subject.subCategory._id.toString()] === true;
        
        // Subjects without board
        subjectsWithoutBoard.push({
          _id: subject._id,
          title: subject.title,
          description: subject.description,
          thumbnail: subject.thumbnail,
          mainCategory: subject.mainCategory,
          subCategory: subject.subCategory,
          board: null,
          isActive: subject.isActive,
          hasActiveSubscription: hasActiveSubscription,
          createdAt: subject.createdAt,
          updatedAt: subject.updatedAt
        });
      }
    });

    // Convert map to array
    const boards = Object.values(boardsMap);

    // If there are subjects without board, add them as a separate entry
    if (subjectsWithoutBoard.length > 0) {
      boards.push({
        board: null,
        subjects: subjectsWithoutBoard
      });
    }

    res.json({
      success: true,
      message: 'Student subjects retrieved successfully',
      data: {
        boards: boards,
        totalBoards: boards.length,
        totalSubjects: subjects.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving student subjects',
      error: error.message
    });
  }
};

/**
 * Get Chapters for a Subject
 * Returns chapters for a particular subject with completion status
 */
const getSubjectChapters = async (req, res) => {
  try {
    // Verify the user is a student
    if (!req.user || req.user.role !== USER_ROLES.STUDENT) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Student role required.'
      });
    }

    const studentId = req.user.userId; // From authenticated user (MongoDB _id)
    const { subjectId, boardId, subCategoryId } = req.query;

    if (!subjectId) {
      return res.status(400).json({
        success: false,
        message: 'Subject ID is required'
      });
    }

    // Find student
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Verify subject exists and belongs to student's categories
    const subject = await Subject.findById(subjectId)
      .populate('mainCategory', 'name description image')
      .populate('subCategory', 'name description image')
      .populate('board', 'name description code');

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    // Verify subject belongs to student's selected subcategories
    const studentSubCategoryIds = student.mainCategories.map(cat => cat.subCategory.toString());
    if (!studentSubCategoryIds.includes(subject.subCategory._id.toString())) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this subject. Please select the required category.'
      });
    }

    // Optional: Verify boardId matches if provided
    if (boardId && subject.board && subject.board._id.toString() !== boardId) {
      return res.status(400).json({
        success: false,
        message: 'Board ID does not match the subject\'s board'
      });
    }

    // Optional: Verify subCategoryId matches if provided
    if (subCategoryId && subject.subCategory._id.toString() !== subCategoryId) {
      return res.status(400).json({
        success: false,
        message: 'Sub Category ID does not match the subject\'s sub category'
      });
    }

    // Get all chapters for this subject
    const chapters = await Chapter.find({
      subject: subjectId,
      isActive: true
    })
      .populate('subject', 'title description thumbnail')
      .sort({ order: 1 }); // Sort by order field

    // Get completion status for all chapters
    const chapterIds = chapters.map(ch => ch._id);
    const progressRecords = await StudentChapterProgress.find({
      student: studentId,
      chapter: { $in: chapterIds }
    });

    // Create a map of chapter completion status
    const completionMap = {};
    progressRecords.forEach(progress => {
      completionMap[progress.chapter.toString()] = {
        isCompleted: progress.isCompleted,
        completedAt: progress.completedAt
      };
    });

    // Attach completion status to each chapter
    const chaptersWithProgress = chapters.map(chapter => {
      const progress = completionMap[chapter._id.toString()] || {
        isCompleted: false,
        completedAt: null
      };

      return {
        _id: chapter._id,
        title: chapter.title,
        description: chapter.description,
        subject: chapter.subject,
        order: chapter.order,
        content: {
          text: chapter.content.text,
          pdf: chapter.content.pdf,
          video: chapter.content.video
        },
        isActive: chapter.isActive,
        createdAt: chapter.createdAt,
        updatedAt: chapter.updatedAt,
        progress: {
          isCompleted: progress.isCompleted,
          completedAt: progress.completedAt
        }
      };
    });

    res.json({
      success: true,
      message: 'Chapters retrieved successfully',
      data: {
        subject: {
          _id: subject._id,
          title: subject.title,
          description: subject.description,
          thumbnail: subject.thumbnail,
          mainCategory: subject.mainCategory,
          subCategory: subject.subCategory,
          board: subject.board,
          isActive: subject.isActive
        },
        chapters: chaptersWithProgress,
        totalChapters: chaptersWithProgress.length,
        completedChapters: chaptersWithProgress.filter(ch => ch.progress.isCompleted).length
      }
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
 * Mark Chapter as Completed
 * Marks a chapter as completed for the student
 */
const markChapterCompleted = async (req, res) => {
  try {
    // Verify the user is a student
    if (!req.user || req.user.role !== USER_ROLES.STUDENT) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Student role required.'
      });
    }

    const studentId = req.user.userId; // From authenticated user (MongoDB _id)
    const { chapterId } = req.body;

    if (!chapterId) {
      return res.status(400).json({
        success: false,
        message: 'Chapter ID is required'
      });
    }

    // Find student
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Verify chapter exists
    const chapter = await Chapter.findById(chapterId)
      .populate('subject', 'title subCategory');

    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Chapter not found'
      });
    }

    // Verify chapter belongs to student's selected categories
    const studentSubCategoryIds = student.mainCategories.map(cat => cat.subCategory.toString());
    const subject = await Subject.findById(chapter.subject._id)
      .populate('subCategory', '_id');

    if (!studentSubCategoryIds.includes(subject.subCategory._id.toString())) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this chapter. Please select the required category.'
      });
    }

    // Find or create progress record
    let progress = await StudentChapterProgress.findOne({
      student: studentId,
      chapter: chapterId
    });

    if (progress) {
      // Update existing progress
      progress.isCompleted = true;
      if (!progress.completedAt) {
        progress.completedAt = Date.now();
      }
      await progress.save();
    } else {
      // Create new progress record
      progress = new StudentChapterProgress({
        student: studentId,
        chapter: chapterId,
        subject: chapter.subject._id,
        isCompleted: true,
        completedAt: Date.now()
      });
      await progress.save();
    }

    res.json({
      success: true,
      message: 'Chapter marked as completed',
      data: {
        _id: progress._id,
        student: studentId,
        chapter: {
          _id: chapter._id,
          title: chapter.title,
          order: chapter.order
        },
        subject: {
          _id: chapter.subject._id,
          title: chapter.subject.title
        },
        isCompleted: progress.isCompleted,
        completedAt: progress.completedAt,
        createdAt: progress.createdAt,
        updatedAt: progress.updatedAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error marking chapter as completed',
      error: error.message
    });
  }
};

/**
 * Get My Learning Progress
 * Returns all completed chapters for the student
 */
const getMyLearning = async (req, res) => {
  try {
    // Verify the user is a student
    if (!req.user || req.user.role !== USER_ROLES.STUDENT) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Student role required.'
      });
    }

    const studentId = req.user.userId; // From authenticated user (MongoDB _id)

    // Find student
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Get all progress records for this student
    const progressRecords = await StudentChapterProgress.find({
      student: studentId,
      isCompleted: true
    })
      .populate({
        path: 'chapter',
        populate: {
          path: 'subject',
          populate: [
            { path: 'mainCategory', select: 'name description image' },
            { path: 'subCategory', select: 'name description image' },
            { path: 'board', select: 'name description code' }
          ]
        }
      })
      .sort({ completedAt: -1 }); // Sort by completion date, newest first

    // Organize by subject
    const learningBySubject = {};
    progressRecords.forEach(progress => {
      if (progress.chapter && progress.chapter.subject) {
        const subjectId = progress.chapter.subject._id.toString();
        if (!learningBySubject[subjectId]) {
          learningBySubject[subjectId] = {
            subject: {
              _id: progress.chapter.subject._id,
              title: progress.chapter.subject.title,
              description: progress.chapter.subject.description,
              thumbnail: progress.chapter.subject.thumbnail,
              mainCategory: progress.chapter.subject.mainCategory,
              subCategory: progress.chapter.subject.subCategory,
              board: progress.chapter.subject.board
            },
            chapters: []
          };
        }

        learningBySubject[subjectId].chapters.push({
          _id: progress.chapter._id,
          title: progress.chapter.title,
          description: progress.chapter.description,
          order: progress.chapter.order,
          content: {
            text: progress.chapter.content.text,
            pdf: progress.chapter.content.pdf,
            video: progress.chapter.content.video
          },
          completedAt: progress.completedAt,
          progressId: progress._id
        });
      }
    });

    // Convert to array and sort chapters by order within each subject
    const learningArray = Object.values(learningBySubject).map(item => ({
      ...item,
      chapters: item.chapters.sort((a, b) => a.order - b.order)
    }));

    res.json({
      success: true,
      message: 'Learning progress retrieved successfully',
      data: {
        learning: learningArray,
        totalSubjects: learningArray.length,
        totalCompletedChapters: progressRecords.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving learning progress',
      error: error.message
    });
  }
};

/**
 * Get Student Progress
 * Returns overall progress statistics for the student
 */
const getStudentProgress = async (req, res) => {
  try {
    if (!req.user || req.user.role !== USER_ROLES.STUDENT) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Student role required.'
      });
    }

    const studentId = req.user.userId;
    const student = await Student.findById(studentId)
      .populate('mainCategories.mainCategory', 'name description image')
      .populate('mainCategories.subCategory', 'name description image');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Get all subjects for student's categories
    const subCategoryIds = student.mainCategories.map(cat => cat.subCategory._id);
    const subjects = await Subject.find({
      subCategory: { $in: subCategoryIds },
      isActive: true
    });

    // Get all chapters for these subjects
    const subjectIds = subjects.map(s => s._id);
    const chapters = await Chapter.find({
      subject: { $in: subjectIds },
      isActive: true
    });

    // Get progress records
    const chapterIds = chapters.map(ch => ch._id);
    const progressRecords = await StudentChapterProgress.find({
      student: studentId,
      chapter: { $in: chapterIds }
    });

    const completedChapters = progressRecords.filter(p => p.isCompleted).length;
    const totalChapters = chapters.length;
    const progressPercentage = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;

    // Progress by subcategory
    const progressBySubCategory = {};
    for (const cat of student.mainCategories) {
      const subCatId = cat.subCategory._id;
      const subCatSubjects = subjects.filter(s => s.subCategory.toString() === subCatId.toString());
      const subCatSubjectIds = subCatSubjects.map(s => s._id);
      const subCatChapters = chapters.filter(ch => subCatSubjectIds.includes(ch.subject.toString()));
      const subCatChapterIds = subCatChapters.map(ch => ch._id);
      const subCatProgress = progressRecords.filter(p => 
        subCatChapterIds.includes(p.chapter.toString()) && p.isCompleted
      ).length;

      progressBySubCategory[subCatId.toString()] = {
        subCategory: {
          _id: cat.subCategory._id,
          name: cat.subCategory.name,
          description: cat.subCategory.description,
          image: cat.subCategory.image
        },
        totalChapters: subCatChapters.length,
        completedChapters: subCatProgress,
        progressPercentage: subCatChapters.length > 0 
          ? Math.round((subCatProgress / subCatChapters.length) * 100) 
          : 0
      };
    }

    res.json({
      success: true,
      message: 'Student progress retrieved successfully',
      data: {
        overall: {
          totalChapters,
          completedChapters,
          progressPercentage
        },
        bySubCategory: Object.values(progressBySubCategory),
        totalSubjects: subjects.length,
        totalSubCategories: student.mainCategories.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving student progress',
      error: error.message
    });
  }
};

/**
 * Get Student Dashboard
 * Returns comprehensive dashboard data including progress, subscriptions, and learning stats
 */
const getStudentDashboard = async (req, res) => {
  try {
    if (!req.user || req.user.role !== USER_ROLES.STUDENT) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Student role required.'
      });
    }

    const studentId = req.user.userId;
    const student = await Student.findById(studentId)
      .populate('mainCategories.mainCategory', 'name description image')
      .populate('mainCategories.subCategory', 'name description image');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Get subscriptions
    const subscriptions = await StudentSubscription.find({
      student: studentId
    })
      .populate('plan', 'duration amount description')
      .populate('subCategory', 'name description image')
      .sort({ createdAt: -1 });

    // Check active subscriptions by subcategory
    const activeSubscriptionsBySubCategory = {};
    const now = new Date();
    subscriptions.forEach(sub => {
      if (sub.isValid()) {
        activeSubscriptionsBySubCategory[sub.subCategory._id.toString()] = {
          subscription: {
            _id: sub._id,
            plan: sub.plan,
            amount: sub.amount,
            duration: sub.duration,
            startDate: sub.startDate,
            endDate: sub.endDate
          },
          isActive: true
        };
      }
    });

    // Get subjects and chapters
    const subCategoryIds = student.mainCategories.map(cat => cat.subCategory._id);
    const subjects = await Subject.find({
      subCategory: { $in: subCategoryIds },
      isActive: true
    })
      .populate('mainCategory', 'name description image')
      .populate('subCategory', 'name description image')
      .populate('board', 'name description code');

    const subjectIds = subjects.map(s => s._id);
    const chapters = await Chapter.find({
      subject: { $in: subjectIds },
      isActive: true
    });

    const chapterIds = chapters.map(ch => ch._id);
    const progressRecords = await StudentChapterProgress.find({
      student: studentId,
      chapter: { $in: chapterIds }
    });

    const completedChapters = progressRecords.filter(p => p.isCompleted).length;
    const totalChapters = chapters.length;
    const progressPercentage = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;

    // Recent activity (last 5 completed chapters)
    const recentActivity = await StudentChapterProgress.find({
      student: studentId,
      isCompleted: true
    })
      .populate({
        path: 'chapter',
        populate: {
          path: 'subject',
          select: 'title thumbnail'
        }
      })
      .sort({ completedAt: -1 })
      .limit(5);

    // Categories with subscription status
    const categoriesWithSubscription = student.mainCategories.map(cat => {
      const subCatId = cat.subCategory._id.toString();
      const hasActiveSubscription = activeSubscriptionsBySubCategory[subCatId] !== undefined;
      
      return {
        mainCategory: cat.mainCategory,
        subCategory: cat.subCategory,
        hasActiveSubscription,
        subscription: hasActiveSubscription ? activeSubscriptionsBySubCategory[subCatId].subscription : null
      };
    });

    res.json({
      success: true,
      message: 'Student dashboard retrieved successfully',
      data: {
        student: {
          _id: student._id,
          userId: student.userId,
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.email,
          mobileNumber: student.mobileNumber,
          profilePicture: student.profilePicture
        },
        progress: {
          totalChapters,
          completedChapters,
          progressPercentage,
          totalSubjects: subjects.length
        },
        subscriptions: {
          total: subscriptions.length,
          active: subscriptions.filter(s => s.isValid()).length,
          list: subscriptions.map(sub => ({
            _id: sub._id,
            plan: sub.plan,
            subCategory: sub.subCategory,
            amount: sub.amount,
            duration: sub.duration,
            startDate: sub.startDate,
            endDate: sub.endDate,
            isActive: sub.isValid(),
            paymentStatus: sub.paymentStatus
          }))
        },
        categories: categoriesWithSubscription,
        recentActivity: recentActivity.map(activity => ({
          chapter: {
            _id: activity.chapter._id,
            title: activity.chapter.title,
            subject: activity.chapter.subject
          },
          completedAt: activity.completedAt
        })),
        stats: {
          totalCategories: student.mainCategories.length,
          totalSubscriptions: subscriptions.length,
          activeSubscriptions: subscriptions.filter(s => s.isValid()).length
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving student dashboard',
      error: error.message
    });
  }
};

/**
 * Get Available Plans for SubCategory
 */
const getPlansForSubCategory = async (req, res) => {
  try {
    if (!req.user || req.user.role !== USER_ROLES.STUDENT) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Student role required.'
      });
    }

    const { subCategoryId } = req.query;

    if (!subCategoryId) {
      return res.status(400).json({
        success: false,
        message: 'Sub Category ID is required'
      });
    }

    const plans = await Plan.find({
      subCategory: subCategoryId,
      isActive: true
    })
      .populate('subCategory', 'name description image')
      .sort({ amount: 1 });

    res.json({
      success: true,
      message: 'Plans retrieved successfully',
      data: {
        plans: plans.map(plan => ({
          _id: plan._id,
          subCategory: plan.subCategory,
          duration: plan.duration,
          amount: plan.amount,
          description: plan.description
        })),
        totalPlans: plans.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving plans',
      error: error.message
    });
  }
};

/**
 * Create Subscription Order
 */
const createSubscriptionOrder = async (req, res) => {
  try {
    if (!req.user || req.user.role !== USER_ROLES.STUDENT) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Student role required.'
      });
    }

    const studentId = req.user.userId;
    const { planId } = req.body;

    if (!planId) {
      return res.status(400).json({
        success: false,
        message: 'Plan ID is required'
      });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const plan = await Plan.findById(planId)
      .populate('subCategory', 'name description image');

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    const hasSubCategory = student.mainCategories.some(
      cat => cat.subCategory.toString() === plan.subCategory._id.toString()
    );

    if (!hasSubCategory) {
      return res.status(400).json({
        success: false,
        message: 'You need to select this subcategory first'
      });
    }

    const existingSubscription = await StudentSubscription.findOne({
      student: studentId,
      subCategory: plan.subCategory._id,
      isActive: true,
      paymentStatus: 'COMPLETED'
    });

    if (existingSubscription && existingSubscription.isValid()) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active subscription for this subcategory'
      });
    }

    const startDate = new Date();
    let endDate = new Date();
    const durationMap = {
      '1_MONTH': 1,
      '3_MONTHS': 3,
      '6_MONTHS': 6,
      '1_YEAR': 12
    };
    endDate.setMonth(endDate.getMonth() + (durationMap[plan.duration] || 1));

    // Generate receipt (max 40 characters for Razorpay)
    const studentIdShort = studentId.toString().slice(-6); // Last 6 chars of student ID
    const planIdShort = planId.toString().slice(-6); // Last 6 chars of plan ID
    const timestamp = Date.now().toString().slice(-8); // Last 8 digits of timestamp
    const receipt = `SUB${studentIdShort}${planIdShort}${timestamp}`.slice(0, 40); // Ensure max 40 chars
    const razorpayOrder = await createOrder(plan.amount, 'INR', receipt);

    const subscription = new StudentSubscription({
      student: studentId,
      plan: planId,
      subCategory: plan.subCategory._id,
      amount: plan.amount,
      duration: plan.duration,
      startDate,
      endDate,
      razorpayOrderId: razorpayOrder.id,
      paymentStatus: 'PENDING',
      isActive: false
    });

    await subscription.save();

    res.json({
      success: true,
      message: 'Subscription order created successfully',
      data: {
        subscription: {
          _id: subscription._id,
          plan: {
            _id: plan._id,
            subCategory: plan.subCategory,
            duration: plan.duration,
            amount: plan.amount,
            description: plan.description
          },
          amount: subscription.amount,
          startDate: subscription.startDate,
          endDate: subscription.endDate
        },
        razorpayOrder: {
          id: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          receipt: razorpayOrder.receipt,
          status: razorpayOrder.status
        },
        keyId: process.env.RAZORPAY_KEY_ID
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating subscription order',
      error: error.message
    });
  }
};

/**
 * Verify and Complete Payment
 */
const verifyPaymentAndActivate = async (req, res) => {
  try {
    if (!req.user || req.user.role !== USER_ROLES.STUDENT) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Student role required.'
      });
    }

    const studentId = req.user.userId;
    const { subscriptionId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!subscriptionId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({
        success: false,
        message: 'Subscription ID, payment ID, and signature are required'
      });
    }

    const subscription = await StudentSubscription.findById(subscriptionId)
      .populate('plan', 'duration amount')
      .populate('subCategory', 'name description');

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    if (subscription.student.toString() !== studentId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This subscription does not belong to you.'
      });
    }

    const isSignatureValid = verifyPayment(
      subscription.razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    );

    if (!isSignatureValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }

    const paymentDetails = await getPaymentDetails(razorpayPaymentId);

    if (paymentDetails.status !== 'captured') {
      return res.status(400).json({
        success: false,
        message: 'Payment not captured'
      });
    }

    subscription.razorpayPaymentId = razorpayPaymentId;
    subscription.razorpaySignature = razorpaySignature;
    subscription.paymentStatus = 'COMPLETED';
    subscription.isActive = true;
    await subscription.save();

    res.json({
      success: true,
      message: 'Payment verified and subscription activated successfully',
      data: {
        subscription: {
          _id: subscription._id,
          plan: subscription.plan,
          subCategory: subscription.subCategory,
          amount: subscription.amount,
          duration: subscription.duration,
          startDate: subscription.startDate,
          endDate: subscription.endDate,
          isActive: subscription.isActive,
          paymentStatus: subscription.paymentStatus
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error verifying payment',
      error: error.message
    });
  }
};

/**
 * Get Student Subscriptions
 */
const getStudentSubscriptions = async (req, res) => {
  try {
    if (!req.user || req.user.role !== USER_ROLES.STUDENT) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Student role required.'
      });
    }

    const studentId = req.user.userId;

    const subscriptions = await StudentSubscription.find({
      student: studentId
    })
      .populate('plan', 'duration amount description')
      .populate('subCategory', 'name description image')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      message: 'Subscriptions retrieved successfully',
      data: {
        subscriptions: subscriptions.map(sub => ({
          _id: sub._id,
          plan: sub.plan,
          subCategory: sub.subCategory,
          amount: sub.amount,
          duration: sub.duration,
          startDate: sub.startDate,
          endDate: sub.endDate,
          isActive: sub.isValid(),
          paymentStatus: sub.paymentStatus,
          createdAt: sub.createdAt
        })),
        total: subscriptions.length,
        active: subscriptions.filter(s => s.isValid()).length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving subscriptions',
      error: error.message
    });
  }
};

/**
 * Get All Public Courses
 * Returns all active public courses (no authentication required)
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
 * Get Course Details
 * Returns course details with chapters (public, but shows purchase status if authenticated)
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

/**
 * Create Course Purchase Order
 * Creates a Razorpay order for course purchase
 */
const createCoursePurchaseOrder = async (req, res) => {
  try {
    if (!req.user || req.user.role !== USER_ROLES.STUDENT) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Student role required.'
      });
    }

    const studentId = req.user.userId;
    const { courseId } = req.body;

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: 'Course ID is required'
      });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    if (!course.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Course is not available'
      });
    }

    // Check if student already has a purchase record for this course (any status)
    const existingPurchase = await StudentCoursePurchase.findOne({
      student: studentId,
      course: courseId
    });

    // If purchase exists and is completed, return error
    if (existingPurchase && existingPurchase.paymentStatus === 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: 'You have already purchased this course'
      });
    }

    // Create Razorpay order
    const courseIdShort = courseId.toString().slice(-6);
    const studentIdShort = studentId.toString().slice(-6);
    const timestamp = Date.now().toString().slice(-8);
    const receipt = `CRS${studentIdShort}${courseIdShort}${timestamp}`.slice(0, 40);
    const razorpayOrder = await createOrder(course.price, 'INR', receipt);

    let purchase;

    // If purchase exists with PENDING/FAILED status, update it with new order
    if (existingPurchase) {
      existingPurchase.amount = course.price;
      existingPurchase.razorpayOrderId = razorpayOrder.id;
      existingPurchase.paymentStatus = 'PENDING';
      existingPurchase.razorpayPaymentId = null;
      existingPurchase.razorpaySignature = null;
      existingPurchase.updatedAt = Date.now();
      purchase = await existingPurchase.save();
    } else {
      // Create new purchase record
      purchase = new StudentCoursePurchase({
        student: studentId,
        course: courseId,
        amount: course.price,
        razorpayOrderId: razorpayOrder.id,
        paymentStatus: 'PENDING'
      });

      await purchase.save();
    }

    res.json({
      success: true,
      message: 'Course purchase order created successfully',
      data: {
        purchase: {
          _id: purchase._id,
          course: {
            _id: course._id,
            title: course.title,
            thumbnail: course.thumbnail,
            price: course.price
          },
          amount: purchase.amount
        },
        razorpayOrder: {
          id: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          receipt: razorpayOrder.receipt,
          status: razorpayOrder.status
        },
        keyId: process.env.RAZORPAY_KEY_ID
      }
    });
  } catch (error) {
    // Handle duplicate key error specifically
    if (error.code === 11000 || error.message.includes('duplicate key')) {
      // Try to find and return existing purchase
      try {
        const existingPurchase = await StudentCoursePurchase.findOne({
          student: req.user?.userId,
          course: req.body?.courseId
        });

        if (existingPurchase) {
          if (existingPurchase.paymentStatus === 'COMPLETED') {
            return res.status(400).json({
              success: false,
              message: 'You have already purchased this course'
            });
          }

          // If pending/failed, try to get Razorpay order details or create new order
          let razorpayOrder = null;
          if (existingPurchase.razorpayOrderId) {
            try {
              const orderDetails = await getOrderDetails(existingPurchase.razorpayOrderId);
              razorpayOrder = {
                id: orderDetails.id || existingPurchase.razorpayOrderId,
                amount: orderDetails.amount || existingPurchase.amount * 100,
                currency: orderDetails.currency || 'INR',
                receipt: orderDetails.receipt || '',
                status: orderDetails.status || 'created'
              };
            } catch (razorpayError) {
              // If we can't get order details, create a new order
              const courseIdShort = req.body?.courseId?.toString().slice(-6);
              const studentIdShort = req.user?.userId?.toString().slice(-6);
              const timestamp = Date.now().toString().slice(-8);
              const receipt = `CRS${studentIdShort}${courseIdShort}${timestamp}`.slice(0, 40);
              const course = await Course.findById(req.body?.courseId);
              if (course) {
                razorpayOrder = await createOrder(course.price, 'INR', receipt);
                existingPurchase.razorpayOrderId = razorpayOrder.id;
                existingPurchase.amount = course.price;
                existingPurchase.paymentStatus = 'PENDING';
                await existingPurchase.save();
              }
            }
          } else {
            // No order ID exists, create a new one
            const courseIdShort = req.body?.courseId?.toString().slice(-6);
            const studentIdShort = req.user?.userId?.toString().slice(-6);
            const timestamp = Date.now().toString().slice(-8);
            const receipt = `CRS${studentIdShort}${courseIdShort}${timestamp}`.slice(0, 40);
            const course = await Course.findById(req.body?.courseId);
            if (course) {
              razorpayOrder = await createOrder(course.price, 'INR', receipt);
              existingPurchase.razorpayOrderId = razorpayOrder.id;
              existingPurchase.amount = course.price;
              existingPurchase.paymentStatus = 'PENDING';
              await existingPurchase.save();
            }
          }

          if (razorpayOrder) {
            // Populate course details for response
            const course = await Course.findById(existingPurchase.course);
            return res.json({
              success: true,
              message: 'Course purchase order retrieved successfully',
              data: {
                purchase: {
                  _id: existingPurchase._id,
                  course: course ? {
                    _id: course._id,
                    title: course.title,
                    thumbnail: course.thumbnail,
                    price: course.price
                  } : {
                    _id: existingPurchase.course,
                    price: existingPurchase.amount
                  },
                  amount: existingPurchase.amount
                },
                razorpayOrder: {
                  id: razorpayOrder.id,
                  amount: razorpayOrder.amount,
                  currency: razorpayOrder.currency || 'INR',
                  receipt: razorpayOrder.receipt || '',
                  status: razorpayOrder.status || 'created'
                },
                keyId: process.env.RAZORPAY_KEY_ID
              }
            });
          }
        }
      } catch (fallbackError) {
        // If fallback also fails, return generic error
      }

      return res.status(400).json({
        success: false,
        message: 'A purchase order for this course already exists. Please check your pending orders or try again later.'
      });
    }

    // Handle other errors
    res.status(500).json({
      success: false,
      message: 'Error creating course purchase order',
      error: error.message
    });
  }
};

/**
 * Verify Course Purchase Payment
 * Verifies Razorpay payment and activates course access
 */
const verifyCoursePurchase = async (req, res) => {
  try {
    if (!req.user || req.user.role !== USER_ROLES.STUDENT) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Student role required.'
      });
    }

    const studentId = req.user.userId;
    const { purchaseId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!purchaseId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({
        success: false,
        message: 'Purchase ID, payment ID, and signature are required'
      });
    }

    const purchase = await StudentCoursePurchase.findById(purchaseId)
      .populate('course', 'title thumbnail price');

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Purchase not found'
      });
    }

    if (purchase.student.toString() !== studentId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This purchase does not belong to you.'
      });
    }

    const isSignatureValid = verifyPayment(
      purchase.razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    );

    if (!isSignatureValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }

    const paymentDetails = await getPaymentDetails(razorpayPaymentId);

    if (paymentDetails.status !== 'captured') {
      return res.status(400).json({
        success: false,
        message: 'Payment not captured'
      });
    }

    purchase.razorpayPaymentId = razorpayPaymentId;
    purchase.razorpaySignature = razorpaySignature;
    purchase.paymentStatus = 'COMPLETED';
    await purchase.save();

    res.json({
      success: true,
      message: 'Payment verified and course access activated successfully',
      data: {
        purchase: {
          _id: purchase._id,
          course: purchase.course,
          amount: purchase.amount,
          paymentStatus: purchase.paymentStatus,
          purchasedAt: purchase.purchasedAt
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error verifying course purchase',
      error: error.message
    });
  }
};

/**
 * Check Course Purchase Status
 * Returns whether the student has purchased a specific course
 */
const checkCoursePurchaseStatus = async (req, res) => {
  try {
    if (!req.user || req.user.role !== USER_ROLES.STUDENT) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Student role required.'
      });
    }

    const studentId = req.user.userId;
    const { courseId } = req.params;

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: 'Course ID is required'
      });
    }

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if student has purchased this course
    const purchase = await StudentCoursePurchase.findOne({
      student: studentId,
      course: courseId,
      paymentStatus: 'COMPLETED'
    });

    const isPurchased = purchase !== null;

    res.json({
      success: true,
      message: 'Course purchase status retrieved successfully',
      data: {
        courseId: courseId,
        isPurchased: isPurchased
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking course purchase status',
      error: error.message
    });
  }
};

/**
 * Get My Purchased Courses
 * Returns all courses purchased by the student with completion progress
 */
const getMyPurchasedCourses = async (req, res) => {
  try {
    if (!req.user || req.user.role !== USER_ROLES.STUDENT) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Student role required.'
      });
    }

    const studentId = req.user.userId;

    const purchases = await StudentCoursePurchase.find({
      student: studentId,
      paymentStatus: 'COMPLETED'
    })
      .populate('course', 'title description thumbnail price')
      .sort({ purchasedAt: -1 });

    // Get completion progress for each course
    const coursesWithProgress = await Promise.all(
      purchases.map(async (purchase) => {
        const courseId = purchase.course._id;
        
        // Get total chapters for this course
        const totalChapters = await CourseChapter.countDocuments({
          course: courseId,
          isActive: true
        });

        // Get completed chapters for this student
        const completedChapters = await StudentCourseChapterProgress.countDocuments({
          student: studentId,
          course: courseId,
          isCompleted: true
        });

        // Calculate progress percentage
        const progressPercentage = totalChapters > 0 
          ? Math.round((completedChapters / totalChapters) * 100) 
          : 0;

        return {
          _id: purchase.course._id,
          title: purchase.course.title,
          description: purchase.course.description,
          thumbnail: purchase.course.thumbnail,
          price: purchase.course.price,
          purchasedAt: purchase.purchasedAt,
          purchaseId: purchase._id,
          progress: {
            totalChapters,
            completedChapters,
            progressPercentage
          }
        };
      })
    );

    res.json({
      success: true,
      message: 'Purchased courses retrieved successfully',
      data: {
        courses: coursesWithProgress,
        totalCourses: coursesWithProgress.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving purchased courses',
      error: error.message
    });
  }
};

/**
 * Get Course Chapters (for purchased courses)
 * Returns chapters with full content for purchased courses
 */
const getCourseChapters = async (req, res) => {
  try {
    if (!req.user || req.user.role !== USER_ROLES.STUDENT) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Student role required.'
      });
    }

    const studentId = req.user.userId;
    const { courseId } = req.query;

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: 'Course ID is required'
      });
    }

    // Verify student has purchased this course
    const purchase = await StudentCoursePurchase.findOne({
      student: studentId,
      course: courseId,
      paymentStatus: 'COMPLETED'
    });

    if (!purchase) {
      return res.status(403).json({
        success: false,
        message: 'You need to purchase this course to access chapters'
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    const chapters = await CourseChapter.find({
      course: courseId,
      isActive: true
    })
      .populate('course', 'title description thumbnail')
      .sort({ order: 1 });

    // Get completion status for all chapters
    const chapterIds = chapters.map(ch => ch._id);
    const completedChapters = await StudentCourseChapterProgress.find({
      student: studentId,
      courseChapter: { $in: chapterIds },
      isCompleted: true
    }).select('courseChapter completedAt');

    const completedChapterIds = new Set(
      completedChapters.map(progress => progress.courseChapter.toString())
    );

    const completedChaptersMap = new Map();
    completedChapters.forEach(progress => {
      completedChaptersMap.set(
        progress.courseChapter.toString(),
        progress.completedAt
      );
    });

    res.json({
      success: true,
      message: 'Course chapters retrieved successfully',
      data: {
        course: {
          _id: course._id,
          title: course.title,
          description: course.description,
          thumbnail: course.thumbnail,
          price: course.price
        },
        chapters: chapters.map(chapter => ({
          _id: chapter._id,
          title: chapter.title,
          description: chapter.description,
          course: chapter.course,
          order: chapter.order,
          content: {
            text: chapter.content.text,
            pdf: chapter.content.pdf,
            video: chapter.content.video
          },
          isActive: chapter.isActive,
          createdAt: chapter.createdAt,
          updatedAt: chapter.updatedAt,
          progress: {
            isCompleted: completedChapterIds.has(chapter._id.toString()),
            completedAt: completedChaptersMap.get(chapter._id.toString()) || null
          }
        })),
        totalChapters: chapters.length,
        completedChapters: completedChapterIds.size
      }
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
 * Mark Course Chapter as Completed
 * Mark a course chapter as completed/read for the student
 */
const markCourseChapterCompleted = async (req, res) => {
  try {
    if (!req.user || req.user.role !== USER_ROLES.STUDENT) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Student role required.'
      });
    }

    const studentId = req.user.userId;
    const { chapterId } = req.body;

    if (!chapterId) {
      return res.status(400).json({
        success: false,
        message: 'Chapter ID is required'
      });
    }

    // Verify chapter exists
    const chapter = await CourseChapter.findById(chapterId);
    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Course chapter not found'
      });
    }

    // Verify student has purchased the course
    const purchase = await StudentCoursePurchase.findOne({
      student: studentId,
      course: chapter.course,
      paymentStatus: 'COMPLETED'
    });

    if (!purchase) {
      return res.status(403).json({
        success: false,
        message: 'You need to purchase this course to mark chapters as completed'
      });
    }

    // Create or update progress record
    const progress = await StudentCourseChapterProgress.findOneAndUpdate(
      {
        student: studentId,
        courseChapter: chapterId
      },
      {
        student: studentId,
        courseChapter: chapterId,
        course: chapter.course,
        isCompleted: true,
        completedAt: Date.now()
      },
      {
        upsert: true,
        new: true
      }
    ).populate('courseChapter', 'title order')
     .populate('course', 'title');

    res.json({
      success: true,
      message: 'Course chapter marked as completed',
      data: {
        _id: progress._id,
        student: studentId,
        courseChapter: {
          _id: progress.courseChapter._id,
          title: progress.courseChapter.title,
          order: progress.courseChapter.order
        },
        course: {
          _id: progress.course._id,
          title: progress.course.title
        },
        isCompleted: progress.isCompleted,
        completedAt: progress.completedAt,
        createdAt: progress.createdAt,
        updatedAt: progress.updatedAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error marking course chapter as completed',
      error: error.message
    });
  }
};

/**
 * Save Chapter Result
 * Save dynamic data/results for a student chapter
 */
const saveChapterResult = async (req, res) => {
  try {
    if (!req.user || req.user.role !== USER_ROLES.STUDENT) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Student role required.'
      });
    }

    const studentId = req.user.userId;
    const { chapterId, results } = req.body;

    if (!chapterId) {
      return res.status(400).json({
        success: false,
        message: 'Chapter ID is required'
      });
    }

    // Validate ObjectId format
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(chapterId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid chapter ID format'
      });
    }

    if (!results || !Array.isArray(results)) {
      return res.status(400).json({
        success: false,
        message: 'Results must be an array'
      });
    }

    // Verify student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check if it's a subject chapter or course chapter
    let chapter = await Chapter.findById(chapterId);
    let courseChapter = null;
    let isCourseChapter = false;

    if (!chapter) {
      // Check if it's a course chapter
      courseChapter = await CourseChapter.findById(chapterId);
      if (courseChapter) {
        isCourseChapter = true;
      } else {
        return res.status(404).json({
          success: false,
          message: `Chapter not found with ID: ${chapterId}. Please verify the chapter exists.`
        });
      }
    }

    if (isCourseChapter) {
      // Handle course chapter
      // Verify student has purchased the course
      const purchase = await StudentCoursePurchase.findOne({
        student: studentId,
        course: courseChapter.course,
        paymentStatus: 'COMPLETED'
      });

      if (!purchase) {
        return res.status(403).json({
          success: false,
          message: 'You need to purchase this course to save chapter results'
        });
      }

      // Populate course separately
      await courseChapter.populate('course', '_id title');

      if (!courseChapter.course) {
        return res.status(404).json({
          success: false,
          message: 'Course not found for this chapter'
        });
      }

      // Create or update course chapter result record
      const chapterResult = await StudentCourseChapterResult.findOneAndUpdate(
        {
          student: studentId,
          courseChapter: chapterId
        },
        {
          student: studentId,
          courseChapter: chapterId,
          course: courseChapter.course._id,
          results: results,
          updatedAt: Date.now()
        },
        {
          upsert: true,
          new: true
        }
      ).populate('courseChapter', 'title order')
       .populate('course', 'title');

      return res.json({
        success: true,
        message: 'Chapter result saved successfully',
        data: {
          _id: chapterResult._id,
          student: {
            _id: student._id,
            userId: student.userId,
            firstName: student.firstName,
            lastName: student.lastName
          },
          chapter: {
            _id: chapterResult.courseChapter._id,
            title: chapterResult.courseChapter.title,
            order: chapterResult.courseChapter.order
          },
          course: {
            _id: chapterResult.course._id,
            title: chapterResult.course.title
          },
          results: chapterResult.results,
          createdAt: chapterResult.createdAt,
          updatedAt: chapterResult.updatedAt
        }
      });
    } else {
      // Handle subject chapter
      // Populate subject separately to avoid issues
      await chapter.populate('subject', '_id title');
      
      if (!chapter.subject) {
        return res.status(404).json({
          success: false,
          message: 'Subject not found for this chapter'
        });
      }

      // Create or update result record
      const chapterResult = await StudentChapterResult.findOneAndUpdate(
        {
          student: studentId,
          chapter: chapterId
        },
        {
          student: studentId,
          chapter: chapterId,
          subject: chapter.subject._id,
          results: results,
          updatedAt: Date.now()
        },
        {
          upsert: true,
          new: true
        }
      ).populate('chapter', 'title order')
       .populate('subject', 'title');

      return res.json({
        success: true,
        message: 'Chapter result saved successfully',
        data: {
          _id: chapterResult._id,
          student: {
            _id: student._id,
            userId: student.userId,
            firstName: student.firstName,
            lastName: student.lastName
          },
          chapter: {
            _id: chapterResult.chapter._id,
            title: chapterResult.chapter.title,
            order: chapterResult.chapter.order
          },
          subject: {
            _id: chapterResult.subject._id,
            title: chapterResult.subject.title
          },
          results: chapterResult.results,
          createdAt: chapterResult.createdAt,
          updatedAt: chapterResult.updatedAt
        }
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error saving chapter result',
      error: error.message
    });
  }
};

/**
 * Get Chapter Result
 * Get saved results/data for a student chapter
 */
const getChapterResult = async (req, res) => {
  try {
    if (!req.user || req.user.role !== USER_ROLES.STUDENT) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Student role required.'
      });
    }

    const studentId = req.user.userId;
    const { chapterId } = req.query;

    if (!chapterId) {
      return res.status(400).json({
        success: false,
        message: 'Chapter ID is required'
      });
    }

    // Validate ObjectId format
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(chapterId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid chapter ID format'
      });
    }

    // Verify student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check if it's a subject chapter or course chapter
    let chapter = await Chapter.findById(chapterId);
    let courseChapter = null;
    let isCourseChapter = false;

    if (!chapter) {
      // Check if it's a course chapter
      courseChapter = await CourseChapter.findById(chapterId);
      if (courseChapter) {
        isCourseChapter = true;
      } else {
        return res.status(404).json({
          success: false,
          message: `Chapter not found with ID: ${chapterId}. Please verify the chapter exists.`
        });
      }
    }

    if (isCourseChapter) {
      // Handle course chapter
      // Get course ID (handle both ObjectId and populated object)
      const courseId = courseChapter.course && courseChapter.course._id 
        ? courseChapter.course._id 
        : courseChapter.course;
      
      if (!courseId) {
        return res.status(404).json({
          success: false,
          message: 'Course not found for this chapter'
        });
      }

      // Verify course exists
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({
          success: false,
          message: 'Course not found for this chapter'
        });
      }

      // Populate course for response
      await courseChapter.populate('course', '_id title');

      // Verify student has purchased the course
      const purchase = await StudentCoursePurchase.findOne({
        student: studentId,
        course: courseId,
        paymentStatus: 'COMPLETED'
      });

      if (!purchase) {
        return res.status(403).json({
          success: false,
          message: 'You need to purchase this course to access chapter results'
        });
      }

      // Get course chapter result record
      const chapterResult = await StudentCourseChapterResult.findOne({
        student: studentId,
        courseChapter: chapterId
      }).populate('courseChapter', 'title order')
       .populate('course', 'title');

      // If no result exists yet, return empty result structure
      if (!chapterResult) {
        return res.json({
          success: true,
          message: 'Chapter result retrieved successfully (no results saved yet)',
          data: {
            student: {
              _id: student._id,
              userId: student.userId,
              firstName: student.firstName,
              lastName: student.lastName
            },
            chapter: {
              _id: courseChapter._id,
              title: courseChapter.title,
              order: courseChapter.order
            },
            course: {
              _id: course._id,
              title: course.title
            },
            results: [],
            createdAt: null,
            updatedAt: null
          }
        });
      }

      return res.json({
        success: true,
        message: 'Chapter result retrieved successfully',
        data: {
          _id: chapterResult._id,
          student: {
            _id: student._id,
            userId: student.userId,
            firstName: student.firstName,
            lastName: student.lastName
          },
          chapter: {
            _id: chapterResult.courseChapter._id,
            title: chapterResult.courseChapter.title,
            order: chapterResult.courseChapter.order
          },
          course: {
            _id: chapterResult.course._id,
            title: chapterResult.course.title
          },
          results: chapterResult.results,
          createdAt: chapterResult.createdAt,
          updatedAt: chapterResult.updatedAt
        }
      });
    } else {
      // Handle subject chapter
      // Populate subject to ensure we can access it
      await chapter.populate('subject', '_id title');
      
      // Get result record
      const chapterResult = await StudentChapterResult.findOne({
        student: studentId,
        chapter: chapterId
      }).populate('chapter', 'title order')
       .populate('subject', 'title');

      // If no result exists yet, return empty result structure
      if (!chapterResult) {
        return res.json({
          success: true,
          message: 'Chapter result retrieved successfully (no results saved yet)',
          data: {
            student: {
              _id: student._id,
              userId: student.userId,
              firstName: student.firstName,
              lastName: student.lastName
            },
            chapter: {
              _id: chapter._id,
              title: chapter.title,
              order: chapter.order
            },
            subject: {
              _id: chapter.subject._id,
              title: chapter.subject.title
            },
            results: [],
            createdAt: null,
            updatedAt: null
          }
        });
      }

      return res.json({
        success: true,
        message: 'Chapter result retrieved successfully',
        data: {
          _id: chapterResult._id,
          student: {
            _id: student._id,
            userId: student.userId,
            firstName: student.firstName,
            lastName: student.lastName
          },
          chapter: {
            _id: chapterResult.chapter._id,
            title: chapterResult.chapter.title,
            order: chapterResult.chapter.order
          },
          subject: {
            _id: chapterResult.subject._id,
            title: chapterResult.subject.title
          },
          results: chapterResult.results,
          createdAt: chapterResult.createdAt,
          updatedAt: chapterResult.updatedAt
        }
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving chapter result',
      error: error.message
    });
  }
};

module.exports = {
  signup,
  login,
  logout,
  updateProfile,
  getStudentProfile,
  getMyBoardsSubjects,
  getSubjectChapters,
  markChapterCompleted,
  getMyLearning,
  getStudentProgress,
  getStudentDashboard,
  getPlansForSubCategory,
  createSubscriptionOrder,
  verifyPaymentAndActivate,
  getStudentSubscriptions,
  getPublicCourses,
  getCourseDetails,
  createCoursePurchaseOrder,
  verifyCoursePurchase,
  checkCoursePurchaseStatus,
  getMyPurchasedCourses,
  getCourseChapters,
  markCourseChapterCompleted,
  saveChapterResult,
  getChapterResult
};

