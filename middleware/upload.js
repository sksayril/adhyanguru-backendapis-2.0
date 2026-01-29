const multer = require('multer');
const { validateImage } = require('../services/imageProcessingService');

// Configure multer for memory storage (we'll upload directly to S3)
const storage = multer.memoryStorage();

// File filter to only accept images
const fileFilter = (req, file, cb) => {
  // Create a mock file object for validation
  const mockFile = {
    mimetype: file.mimetype,
    size: 0 // Size will be checked after upload
  };

  if (validateImage(mockFile)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed (max 5MB)'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Middleware for single file upload - accepts both 'profilePicture' and 'image' field names
const uploadSingleProfilePicture = upload.single('profilePicture');
const uploadSingleImage = upload.single('image');

// Middleware wrapper to handle errors - for profile pictures
const handleUpload = (req, res, next) => {
  uploadSingleProfilePicture(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload failed'
      });
    }

    // Additional size check after upload
    if (req.file && req.file.size > 5 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: 'File size exceeds 5MB limit'
      });
    }

    next();
  });
};

// Middleware wrapper for category images
const handleImageUpload = (req, res, next) => {
  uploadSingleImage(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload failed'
      });
    }

    // Additional size check after upload
    if (req.file && req.file.size > 5 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: 'File size exceeds 5MB limit'
      });
    }

    next();
  });
};

// Middleware for course thumbnail (image)
const uploadThumbnail = upload.single('thumbnail');
const handleThumbnailUpload = (req, res, next) => {
  uploadThumbnail(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload failed'
      });
    }

    if (req.file && req.file.size > 5 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: 'File size exceeds 5MB limit'
      });
    }

    next();
  });
};

// Middleware for PDF uploads (larger file size limit)
const uploadPDF = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF files are allowed.'), false);
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit for PDFs
  }
}).single('pdf');

const handlePDFUpload = (req, res, next) => {
  uploadPDF(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'PDF upload failed'
      });
    }

    if (req.file && req.file.size > 50 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: 'PDF size exceeds 50MB limit'
      });
    }

    next();
  });
};

// Middleware for video uploads (larger file size limit)
const uploadVideo = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only MP4, MPEG, MOV, AVI, and WebM videos are allowed.'), false);
    }
  },
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB limit for videos
  }
}).single('video');

const handleVideoUpload = (req, res, next) => {
  uploadVideo(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'Video upload failed'
      });
    }

    if (req.file && req.file.size > 500 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: 'Video size exceeds 500MB limit'
      });
    }

    next();
  });
};

// Middleware for multiple file uploads (PDF and Video for chapters)
const uploadPDFVideo = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Allow PDF files
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
      return;
    }
    // Allow video files
    const allowedVideoTypes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
    if (allowedVideoTypes.includes(file.mimetype)) {
      cb(null, true);
      return;
    }
    cb(new Error('Invalid file type. Only PDF and video files are allowed.'), false);
  },
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB limit (for videos)
  }
}).fields([
  { name: 'pdf', maxCount: 1 },
  { name: 'video', maxCount: 1 }
]);

const handleMultipleUpload = (req, res, next) => {
  uploadPDFVideo(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload failed'
      });
    }

    // Additional size checks
    if (req.files) {
      if (req.files.pdf && req.files.pdf[0] && req.files.pdf[0].size > 50 * 1024 * 1024) {
        return res.status(400).json({
          success: false,
          message: 'PDF file size exceeds 50MB limit'
        });
      }
      if (req.files.video && req.files.video[0] && req.files.video[0].size > 500 * 1024 * 1024) {
        return res.status(400).json({
          success: false,
          message: 'Video file size exceeds 500MB limit'
        });
      }
    }

    next();
  });
};

module.exports = {
  handleUpload, // For profile pictures (field name: 'profilePicture')
  handleImageUpload, // For category images (field name: 'image')
  handleThumbnailUpload, // For subject thumbnails (field name: 'thumbnail')
  handleMultipleUpload, // For chapter files (field names: 'pdf', 'video')
  handlePDFUpload, // For single PDF files (field name: 'pdf')
  handleVideoUpload, // For single video files (field name: 'video')
  upload
};

