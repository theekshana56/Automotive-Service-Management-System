import mongoose from 'mongoose';

const loyaltyDiscountRequestSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  customerName: {
    type: String,
    required: true
  },
  customerEmail: {
    type: String,
    required: true
  },
  customerPhone: {
    type: String,
    required: false
  },
  totalBookings: {
    type: Number,
    required: true,
    default: 0
  },
  loyaltyEligible: {
    type: Boolean,
    required: true,
    default: false
  },
  discountPercentage: {
    type: Number,
    required: true,
    default: 10,
    min: 0,
    max: 100
  },
  requestReason: {
    type: String,
    required: false,
    maxlength: 500
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'declined'],
    default: 'pending'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  reviewedAt: {
    type: Date,
    required: false
  },
  reviewNotes: {
    type: String,
    required: false,
    maxlength: 500
  },
  declineReason: {
    type: String,
    required: false,
    maxlength: 500
  },
  serviceCostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceCost',
    required: false
  },
  appliedToPayment: {
    type: Boolean,
    default: false
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CustomerPayment',
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Pre-save middleware to update timestamps
loyaltyDiscountRequestSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Index for efficient queries
loyaltyDiscountRequestSchema.index({ customerId: 1 });
loyaltyDiscountRequestSchema.index({ status: 1 });
loyaltyDiscountRequestSchema.index({ createdAt: -1 });

// Virtual for status display
loyaltyDiscountRequestSchema.virtual('statusDisplay').get(function() {
  return this.status.charAt(0).toUpperCase() + this.status.slice(1);
});

// Virtual for eligibility check
loyaltyDiscountRequestSchema.virtual('isEligible').get(function() {
  return this.totalBookings >= 5; // Minimum 5 bookings for loyalty eligibility
});

const LoyaltyDiscountRequest = mongoose.model('LoyaltyDiscountRequest', loyaltyDiscountRequestSchema);

export default LoyaltyDiscountRequest;