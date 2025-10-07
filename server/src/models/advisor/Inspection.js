import mongoose from 'mongoose';

const inspectionSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  advisorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  vehiclePlate: {
    type: String,
    required: true
  },
  jobType: {
    type: String,
    required: true,
    enum: ['oil-change', 'brake-service', 'engine-repair', 'general-inspection', 'tire-rotation', 'battery-check']
  },
  inspectionItems: {
    engineOil: {
      type: String,
      required: true,
      enum: ['good', 'needs-change', 'low']
    },
    brakeFluid: {
      type: String,
      required: true,
      enum: ['good', 'needs-change', 'low']
    },
    coolant: {
      type: String,
      required: true,
      enum: ['good', 'needs-change', 'low']
    },
    battery: {
      type: String,
      required: true,
      enum: ['good', 'weak', 'dead']
    },
    tires: {
      type: String,
      enum: ['good', 'needs-rotation', 'needs-replacement', 'low-pressure']
    },
    lights: {
      type: String,
      enum: ['good', 'bulb-out', 'dim']
    },
    airFilter: {
      type: String,
      enum: ['good', 'dirty', 'clogged']
    },
    transmissionFluid: {
      type: String,
      enum: ['good', 'needs-change', 'low']
    }
  },
  notes: {
    type: String,
    maxlength: 1000
  },
  recommendations: [{
    item: String,
    description: String,
    priority: {
      type: String,
      enum: ['low', 'medium', 'high']
    },
    estimatedCost: Number
  }],
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  completedAt: {
    type: Date
  },
  estimatedDuration: {
    type: Number, // in minutes
    default: 60
  },
  actualDuration: {
    type: Number // in minutes
  }
}, {
  timestamps: true
});

// Index for efficient queries
inspectionSchema.index({ advisorId: 1, status: 1 });
inspectionSchema.index({ bookingId: 1 });
inspectionSchema.index({ vehiclePlate: 1 });

const Inspection = mongoose.model('Inspection', inspectionSchema);

export default Inspection;
