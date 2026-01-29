const mongoose = require('mongoose');

const studentCourseChapterResultSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  courseChapter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CourseChapter',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  results: {
    type: [mongoose.Schema.Types.Mixed],
    default: []
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

// Indexes for efficient queries
studentCourseChapterResultSchema.index({ student: 1, courseChapter: 1 }, { unique: true });
studentCourseChapterResultSchema.index({ student: 1, course: 1 });

studentCourseChapterResultSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('StudentCourseChapterResult', studentCourseChapterResultSchema);

