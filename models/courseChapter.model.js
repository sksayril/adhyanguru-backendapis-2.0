const mongoose = require('mongoose');

const courseChapterSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: null,
    trim: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  order: {
    type: Number,
    required: true
  },
  content: {
    text: {
      type: String,
      default: null
    },
    pdf: {
      type: String,
      default: null,
      trim: true // URL to S3
    },
    video: {
      type: String,
      default: null,
      trim: true // URL to S3
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SuperAdmin',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure chapter order is unique within a course
courseChapterSchema.index({ course: 1, order: 1 }, { unique: true });
courseChapterSchema.index({ course: 1 });

courseChapterSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('CourseChapter', courseChapterSchema);

