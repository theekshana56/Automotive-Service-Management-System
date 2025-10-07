// ES module import
import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true,
    default: ''
  },
  category: {
    type: String,
    required: true,
    enum: ['general', 'technical', 'billing', 'mechanics', 'feedback', 'partnership']
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  priority: {
    type: String,
    enum: ['normal', 'high'],
    default: 'normal'
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'answered', 'closed'],
    default: 'pending'
  },
  type: {
    type: String,
    enum: ['forum', 'contact', 'support'],
    default: 'forum'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  // For responses from HR/Admin
  response: {
    type: String,
    trim: true,
    default: ''
  },
  respondedAt: {
    type: Date,
    default: null
  },
  respondedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  // For internal notes
  internalNotes: {
    type: String,
    trim: true,
    default: ''
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

// Index for efficient queries
contactSchema.index({ status: 1, category: 1, timestamp: -1 });
contactSchema.index({ priority: 1, status: 1 });
contactSchema.index({ userId: 1, timestamp: -1 });

// Virtual for response time
contactSchema.virtual('responseTime').get(function() {
  if (this.respondedAt && this.timestamp) {
    return Math.round((this.respondedAt - this.timestamp) / (1000 * 60 * 60)); // hours
  }
  return null;
});

// Method to mark as answered
contactSchema.methods.markAsAnswered = function(response, userId) {
  this.status = 'answered';
  this.response = response;
  this.respondedAt = new Date();
  this.respondedBy = userId;
  this.updatedAt = new Date();
  return this.save();
};

// Method to mark as in progress
contactSchema.methods.markInProgress = function(userId) {
  this.status = 'in-progress';
  this.assignedTo = userId;
  this.updatedAt = new Date();
  return this.save();
};

// Static method to get stats
contactSchema.statics.getStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
        answered: { $sum: { $cond: [{ $eq: ['$status', 'answered'] }, 1, 0] } },
        highPriority: { $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] } }
      }
    }
  ]);

  return stats[0] || { total: 0, pending: 0, answered: 0, highPriority: 0 };
};

// ES module export
export default mongoose.model('Contact', contactSchema);
