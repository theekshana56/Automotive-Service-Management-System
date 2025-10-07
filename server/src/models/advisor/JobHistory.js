import mongoose from 'mongoose';

const jobHistorySchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  inspectionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Inspection',
    required: false
  },
  advisorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  vehiclePlate: {
    type: String,
    required: true
  },
  serviceType: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['Pending', 'Confirmed', 'In Progress', 'Inspection Complete', 'Work In Progress', 'Completed', 'Cancelled', 'On Hold']
  },
  previousStatus: {
    type: String,
    enum: ['Pending', 'Confirmed', 'In Progress', 'Inspection Complete', 'Work In Progress', 'Completed', 'Cancelled', 'On Hold']
  },
  action: {
    type: String,
    required: true,
    enum: [
      'BOOKING_CREATED',
      'BOOKING_CONFIRMED', 
      'INSPECTION_STARTED',
      'INSPECTION_COMPLETED',
      'WORK_STARTED',
      'WORK_COMPLETED',
      'JOB_COMPLETED',
      'JOB_CANCELLED',
      'JOB_ON_HOLD',
      'STATUS_UPDATED'
    ]
  },
  description: {
    type: String,
    required: true
  },
  notes: {
    type: String,
    maxlength: 1000
  },
  duration: {
    type: Number, // in minutes
    default: 0
  },
  estimatedCost: {
    type: Number,
    default: 0
  },
  actualCost: {
    type: Number,
    default: 0
  },
  partsUsed: [{
    partId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Part'
    },
    partName: String,
    quantity: Number,
    unitCost: Number,
    totalCost: Number
  }],
  laborHours: {
    type: Number,
    default: 0
  },
  laborRate: {
    type: Number,
    default: 0
  },
  recommendations: [{
    item: String,
    description: String,
    priority: {
      type: String,
      enum: ['low', 'medium', 'high']
    },
    estimatedCost: Number,
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'completed'],
      default: 'pending'
    }
  }],
  customerApproval: {
    approved: {
      type: Boolean,
      default: false
    },
    approvedAt: Date,
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: String
  },
  completionNotes: {
    type: String,
    maxlength: 1000
  },
  qualityCheck: {
    passed: {
      type: Boolean,
      default: false
    },
    checkedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    checkedAt: Date,
    notes: String
  },
  customerSatisfaction: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    feedback: String,
    submittedAt: Date
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
jobHistorySchema.index({ bookingId: 1, createdAt: -1 });
jobHistorySchema.index({ advisorId: 1, createdAt: -1 });
jobHistorySchema.index({ customerId: 1, createdAt: -1 });
jobHistorySchema.index({ status: 1, createdAt: -1 });
jobHistorySchema.index({ vehiclePlate: 1, createdAt: -1 });

const JobHistory = mongoose.model('JobHistory', jobHistorySchema);

export default JobHistory;
