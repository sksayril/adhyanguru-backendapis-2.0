const mongoose = require('mongoose');

const studentCourseChapterProgressSchema = new mongoose.Schema({
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
  course: { // Added for easier querying and context
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  isCompleted: {
    type: Boolean,
    default: true // Always true when a record is created/updated
  },
  completedAt: {
    type: Date,
    default: Date.now
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

// Ensure unique progress record per student and course chapter
studentCourseChapterProgressSchema.index({ student: 1, courseChapter: 1 }, { unique: true });
studentCourseChapterProgressSchema.index({ student: 1, course: 1 });

studentCourseChapterProgressSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('StudentCourseChapterProgress', studentCourseChapterProgressSchema);

