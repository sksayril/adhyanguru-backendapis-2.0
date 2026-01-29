const mongoose = require('mongoose');

const walletTransactionSchema = new mongoose.Schema({
  // User who received the commission
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'userModel'
  },
  userModel: {
    type: String,
    required: true,
    enum: ['Coordinator', 'DistrictCoordinator', 'TeamLeader', 'FieldEmployee']
  },
  // Transaction type
  type: {
    type: String,
    required: true,
    enum: ['COMMISSION', 'WITHDRAWAL', 'ADJUSTMENT']
  },
  // Amount (positive for credit, negative for debit)
  amount: {
    type: Number,
    required: true
  },
  // Balance after this transaction
  balanceAfter: {
    type: Number,
    required: true,
    min: 0
  },
  // Related transaction (subscription or course purchase)
  relatedTransaction: {
    type: {
      type: String,
      enum: ['SUBSCRIPTION', 'COURSE_PURCHASE']
    },
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'relatedTransaction.transactionModel'
    },
    transactionModel: {
      type: String,
      enum: ['StudentSubscription', 'StudentCoursePurchase']
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student'
    },
    amount: Number
  },
  // Commission details
  commissionDetails: {
    percentage: Number,
    baseAmount: Number
  },
  // Description
  description: {
    type: String,
    trim: true
  },
  // Status
  status: {
    type: String,
    enum: ['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'],
    default: 'COMPLETED'
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
walletTransactionSchema.index({ user: 1, userModel: 1, createdAt: -1 });
walletTransactionSchema.index({ 'relatedTransaction.transactionId': 1 });
walletTransactionSchema.index({ type: 1, status: 1 });

walletTransactionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('WalletTransaction', walletTransactionSchema);
