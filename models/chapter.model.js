const mongoose = require('mongoose');

const chapterSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: null
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  order: {
    type: Number,
    required: true,
    default: 0
  },
  // Content types
  content: {
    text: {
      type: String, // Markdown content
      default: null
    },
    pdf: {
      url: {
        type: String,
        default: null
      },
      fileName: {
        type: String,
        default: null
      }
    },
    video: {
      url: {
        type: String,
        default: null
      },
      fileName: {
        type: String,
        default: null
      },
      duration: {
        type: Number, // Duration in seconds
        default: null
      }
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

// Index for efficient queries
chapterSchema.index({ subject: 1, order: 1 });
chapterSchema.index({ subject: 1 });

chapterSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Chapter', chapterSchema);
