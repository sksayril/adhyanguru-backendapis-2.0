const mongoose = require('mongoose');

const studentChapterProgressSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  chapter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chapter',
    required: true
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date,
    default: null
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

// Ensure one progress record per student-chapter combination
studentChapterProgressSchema.index({ student: 1, chapter: 1 }, { unique: true });

// Indexes for efficient queries
studentChapterProgressSchema.index({ student: 1, subject: 1 });
studentChapterProgressSchema.index({ student: 1, isCompleted: 1 });

studentChapterProgressSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  if (this.isCompleted && !this.completedAt) {
    this.completedAt = Date.now();
  }
  next();
});

module.exports = mongoose.model('StudentChapterProgress', studentChapterProgressSchema);

