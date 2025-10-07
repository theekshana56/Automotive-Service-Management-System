import mongoose from 'mongoose';

const customerPaymentSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  customerName: {
    type: String,
    required: true
  },
  customerEmail: {
    type: String,
    required: true
  },
  invoiceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice',
    required: false
  },
  invoiceNumber: {
    type: String,
    required: true
  },
  serviceCostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceCost',
    required: false
  },
  vehiclePlate: {
    type: String,
    required: true
  },
  serviceType: {
    type: String,
    required: true
  },
  paymentCalculation: {
    subtotal: {
      type: Number,
      required: true,
      min: 0
    },
    taxAmount: {
      type: Number,
      required: true,
      min: 0
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    loyaltyDiscount: {
      type: Number,
      default: 0,
      min: 0
    },
    grossAmount: {
      type: Number,
      required: true,
      min: 0
    },
    deductions: {
      epf: {
        type: Number,
        default: 0,
        min: 0
      },
      etf: {
        type: Number,
        default: 0,
        min: 0
      },
      other: {
        type: Number,
        default: 0,
        min: 0
      }
    },
    totalDeductions: {
      type: Number,
      default: 0,
      min: 0
    },
    netAmount: {
      type: Number,
      required: true,
      min: 0
    }
  },
  paymentDetails: {
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'credit_card', 'debit_card', 'bank_transfer', 'cheque', 'online'],
      required: true
    },
    paymentReference: {
      type: String,
      trim: true
    },
    transactionId: {
      type: String,
      trim: true
    },
    bankDetails: {
      bankName: String,
      accountNumber: String,
      branch: String
    },
    cardDetails: {
      lastFourDigits: String,
      cardType: String
    }
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'],
    default: 'pending'
  },
  paymentDate: {
    type: Date,
    required: true
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  processedAt: {
    type: Date,
    default: Date.now
  },
  receiptNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  emailSent: {
    type: Boolean,
    default: false
  },
  emailSentAt: {
    type: Date
  },
  notes: {
    type: String,
    maxlength: 500
  },
  refundDetails: {
    refundAmount: {
      type: Number,
      min: 0
    },
    refundReason: String,
    refundDate: Date,
    refundedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }
}, {
  timestamps: true
});

// Pre-save middleware to calculate payment amounts
customerPaymentSchema.pre('save', function(next) {
  // Calculate total deductions
  this.paymentCalculation.totalDeductions = 
    this.paymentCalculation.deductions.epf + 
    this.paymentCalculation.deductions.etf + 
    this.paymentCalculation.deductions.other;
  
  // Calculate net amount
  this.paymentCalculation.netAmount = 
    this.paymentCalculation.grossAmount - 
    this.paymentCalculation.totalDeductions;
  
  // Generate receipt number if not provided
  if (!this.receiptNumber && this.paymentStatus === 'completed') {
    this.receiptNumber = `RCP-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
  }
  
  next();
});

// Index for efficient queries
customerPaymentSchema.index({ customerId: 1, paymentDate: -1 });
customerPaymentSchema.index({ invoiceId: 1 });
customerPaymentSchema.index({ paymentStatus: 1, paymentDate: -1 });

export default mongoose.model('CustomerPayment', customerPaymentSchema);
