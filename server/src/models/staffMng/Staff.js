import mongoose from 'mongoose';

const staffSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    default: "staff"
  },
  attendance: [{
    date: Date,
    email: String,
    checkInTime: String,
    checkOutTime: String,
    hoursWorked: Number,
    approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    approvedBy: { type: String },
    approvalNote: { type: String }
  }],
  jobs: [{
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    task: String,
    status: String,
    bookingId: String,
    vehiclePlate: String,
    jobType: String,
    notes: String,
    assignedAt: Date
  }],
  extraWork: [{
    description: String,
    hours: Number,
    date: Date
  }],
  salary: {
    basic: { type: Number, default: 4000 },
    ot: { type: Number, default: 0 },
    allowance: { type: Number, default: 200 },
    deductions: { type: Number, default: 0 }
  },
  compensationUpdatedAt: { type: Date },
  suggestions: [{
    text: String,
    date: { type: Date, default: Date.now }
  }],
  performanceScore: { type: Number, default: 0 },
  performanceReviews: [{
    score: Number,
    comments: String,
    goals: String,
    reviewDate: { type: Date, default: Date.now },
    reviewedBy: String
  }]
}, {
  timestamps: true
});

export default mongoose.model('Staff', staffSchema);