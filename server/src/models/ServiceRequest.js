import mongoose from 'mongoose';

const serviceRequestSchema = new mongoose.Schema({
  // Customer Information
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  customerEmail: { type: String },

  // Location Information
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: { type: String, default: 'USA' }
    },
    serviceRadius: { type: Number, default: 10 } // miles
  },

  // Service Information
  serviceType: { type: String, required: true },
  problemDescription: { type: String, required: true },
  urgency: {
    type: String,
    enum: ['normal', 'urgent', 'emergency'],
    default: 'normal'
  },
  preferredTime: Date,
  additionalNotes: String,

  // Status and Assignment
  status: {
    type: String,
    enum: ['pending', 'assigned', 'accepted', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },

  // Mechanic Assignment (first-come-first-served)
  assignedMechanic: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedAt: Date,

  // Mechanic Responses (for tracking who responded and when)
  mechanicResponses: [{
    mechanic: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    response: { type: String, enum: ['accepted', 'declined'], required: true },
    respondedAt: { type: Date, default: Date.now },
    notes: String
  }],

  // Notifications
  notificationsSent: { type: Boolean, default: false },
  notificationCount: { type: Number, default: 0 },

  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Index for geospatial queries
serviceRequestSchema.index({ location: '2dsphere' });

// Index for status queries
serviceRequestSchema.index({ status: 1, createdAt: -1 });

// Pre-save middleware to update timestamps
serviceRequestSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Virtual for request age in minutes
serviceRequestSchema.virtual('ageInMinutes').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60));
});

// Method to check if request is still active
serviceRequestSchema.methods.isActive = function() {
  return ['pending', 'assigned', 'accepted', 'in_progress'].includes(this.status);
};

// Method to assign mechanic
serviceRequestSchema.methods.assignMechanic = function(mechanicId) {
  this.assignedMechanic = mechanicId;
  this.assignedAt = new Date();
  this.status = 'assigned';
  return this.save();
};

// Method to add mechanic response
serviceRequestSchema.methods.addMechanicResponse = function(mechanicId, response, notes = '') {
  this.mechanicResponses.push({
    mechanic: mechanicId,
    response: response,
    respondedAt: new Date(),
    notes: notes
  });
  return this.save();
};

// Static method to find nearby pending requests
serviceRequestSchema.statics.findNearbyPending = function(longitude, latitude, maxDistance = 10) {
  return this.find({
    status: 'pending',
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: maxDistance * 1609.34 // Convert miles to meters
      }
    }
  }).populate('assignedMechanic', 'name email phone');
};

export default mongoose.model('ServiceRequest', serviceRequestSchema);
