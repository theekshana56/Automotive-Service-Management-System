import mongoose from 'mongoose';

const serviceCostSchema = new mongoose.Schema({
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
  advisorEstimate: {
    laborHours: {
      type: Number,
      required: true,
      min: 0
    },
    laborRate: {
      type: Number,
      required: true,
      min: 0
    },
    partsRequired: [{
      partId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Part'
      },
      partName: {
        type: String,
        required: true
      },
      partNumber: {
        type: String,
        required: true
      },
      quantity: {
        type: Number,
        required: true,
        min: 1
      },
      unitCost: {
        type: Number,
        required: true,
        min: 0
      },
      totalCost: {
        type: Number,
        required: true,
        min: 0
      }
    }],
    additionalServices: [{
      serviceName: {
        type: String,
        required: true
      },
      description: String,
      cost: {
        type: Number,
        required: true,
        min: 0
      }
    }],
    notes: {
      type: String,
      maxlength: 1000
    },
    estimatedTotal: {
      type: Number,
      required: true,
      min: 0
    }
  },
  financeManagerReview: {
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: {
      type: Date
    },
    approved: {
      type: Boolean,
      default: false
    },
    adjustments: [{
      type: {
        type: String,
        enum: ['labor', 'parts', 'additional', 'discount', 'markup']
      },
      description: String,
      amount: {
        type: Number,
        required: true
      },
      reason: String
    }],
    finalApproval: {
      type: Boolean,
      default: false
    },
    approvedAt: {
      type: Date
    },
    notes: {
      type: String,
      maxlength: 1000
    }
  },
  finalCost: {
    laborCost: {
      type: Number,
      default: 0,
      min: 0
    },
    partsCost: {
      type: Number,
      default: 0,
      min: 0
    },
    additionalServicesCost: {
      type: Number,
      default: 0,
      min: 0
    },
    subtotal: {
      type: Number,
      default: 0,
      min: 0
    },
    taxRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    taxAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    totalAmount: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  status: {
    type: String,
    enum: ['pending_review', 'under_review', 'approved', 'rejected', 'invoiced', 'paid'],
    default: 'pending_review'
  },
  invoiceGenerated: {
    type: Boolean,
    default: false
  },
  invoiceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice'
  },
  paymentReceived: {
    type: Boolean,
    default: false
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
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

// Pre-save middleware to calculate final costs
serviceCostSchema.pre('save', function(next) {
  // Calculate labor cost
  this.finalCost.laborCost = this.advisorEstimate.laborHours * this.advisorEstimate.laborRate;
  
  // Calculate parts cost
  this.finalCost.partsCost = this.advisorEstimate.partsRequired.reduce(
    (sum, part) => sum + part.totalCost, 0
  );
  
  // Calculate additional services cost
  this.finalCost.additionalServicesCost = this.advisorEstimate.additionalServices.reduce(
    (sum, service) => sum + service.cost, 0
  );
  
  // Calculate subtotal
  this.finalCost.subtotal = this.finalCost.laborCost + 
                           this.finalCost.partsCost + 
                           this.finalCost.additionalServicesCost;
  
  // Apply adjustments from finance manager review
  if (this.financeManagerReview.adjustments) {
    const adjustmentTotal = this.financeManagerReview.adjustments.reduce(
      (sum, adjustment) => sum + adjustment.amount, 0
    );
    this.finalCost.subtotal += adjustmentTotal;
  }
  
  // Calculate tax amount
  this.finalCost.taxAmount = (this.finalCost.subtotal * this.finalCost.taxRate) / 100;
  
  // Calculate total amount
  this.finalCost.totalAmount = this.finalCost.subtotal + 
                               this.finalCost.taxAmount - 
                               this.finalCost.discountAmount;
  
  // Update timestamp
  this.updatedAt = new Date();
  
  next();
});

// Index for efficient queries
serviceCostSchema.index({ bookingId: 1 });
serviceCostSchema.index({ advisorId: 1, status: 1 });
serviceCostSchema.index({ customerId: 1, status: 1 });
serviceCostSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model('ServiceCost', serviceCostSchema);
