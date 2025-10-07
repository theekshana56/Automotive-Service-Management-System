import mongoose from 'mongoose';

const purchaseOrderSchema = new mongoose.Schema({
  // Basic PO Information
  poNumber: {
    type: String,
    required: true,
    unique: true,
    default: () => `PO-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`
  },
  
  // Status Management
  status: {
    type: String,
    enum: ['draft', 'submitted', 'approved', 'delivered'],
    default: 'draft',
    required: true
  },
  
  // Supplier Information
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true
  },
  
  // Items to be purchased
  items: [{
    part: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Part',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  
  // Financial Information
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  tax: {
    type: Number,
    default: 0,
    min: 0
  },
  shipping: {
    type: Number,
    default: 0,
    min: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Dates and Timestamps
  expectedDeliveryDate: {
    type: Date,
    required: true
  },
  submittedAt: {
    type: Date
  },
  approvedAt: {
    type: Date
  },
  deliveredAt: {
    type: Date
  },
  
  // Approval Information
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectedAt: {
    type: Date
  },
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Notes and Comments
  notes: {
    type: String,
    maxLength: 1000
  },
  internalNotes: {
    type: String,
    maxLength: 1000
  },
  approvalNotes: {
    type: String,
    maxLength: 1000
  },
  rejectionNotes: {
    type: String,
    maxLength: 1000
  },
  
  // Delivery Information
  deliveryAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  
  // Terms and Conditions
  paymentTerms: {
    type: String,
    default: 'Net 30'
  },
  
  // Audit Fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Security and Compliance Fields
  ipAddress: {
    type: String,
    maxLength: 45 // IPv6 compatible
  },
  userAgent: {
    type: String,
    maxLength: 500
  },
  approvalNotes: {
    type: String,
    maxLength: 1000,
    description: 'Manager notes when approving PO'
  },
  rejectionReason: {
    type: String,
    maxLength: 1000,
    description: 'Reason if PO is rejected'
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  modificationHistory: [{
    field: String,
    oldValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed,
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    changedAt: {
      type: Date,
      default: Date.now
    },
    reason: String
  }]
}, {
  timestamps: true
});

// Pre-save middleware to calculate totals
purchaseOrderSchema.pre('save', function(next) {
  // Calculate item totals
  this.items.forEach(item => {
    item.totalPrice = item.quantity * item.unitPrice;
  });
  
  // Calculate subtotal
  this.subtotal = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
  
  // Calculate total amount
  this.totalAmount = this.subtotal + this.tax + this.shipping;
  
  next();
});

// Virtual for status display
purchaseOrderSchema.virtual('statusDisplay').get(function() {
  const statusMap = {
    draft: 'Draft',
    submitted: 'Submitted',
    approved: 'Approved',
    delivered: 'Delivered'
  };
  return statusMap[this.status] || this.status;
});

// Virtual for total items count
purchaseOrderSchema.virtual('totalItems').get(function() {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

// Method to check if PO can be edited
purchaseOrderSchema.methods.canEdit = function() {
  return this.status === 'draft';
};

// Method to check if PO can be submitted
purchaseOrderSchema.methods.canSubmit = function() {
  return this.status === 'draft' && this.items.length > 0;
};

// Method to check if PO can be approved
purchaseOrderSchema.methods.canApprove = function() {
  return this.status === 'submitted';
};

// Method to check if PO can be delivered
purchaseOrderSchema.methods.canDeliver = function() {
  return this.status === 'approved';
};

// Method to submit PO
purchaseOrderSchema.methods.submit = function(userId) {
  if (!this.canSubmit()) {
    throw new Error('Purchase Order cannot be submitted in current status');
  }
  
  this.status = 'submitted';
  this.submittedAt = new Date();
  this.submittedBy = userId;
  
  return this.save();
};

// Method to approve PO
purchaseOrderSchema.methods.approve = function(userId) {
  if (!this.canApprove()) {
    throw new Error('Purchase Order cannot be approved in current status');
  }
  
  this.status = 'approved';
  this.approvedAt = new Date();
  this.approvedBy = userId;
  
  return this.save();
};

// Method to deliver PO
purchaseOrderSchema.methods.deliver = function(userId) {
  if (!this.canDeliver()) {
    throw new Error('Purchase Order cannot be delivered in current status');
  }
  
  this.status = 'delivered';
  this.deliveredAt = new Date();
  this.updatedBy = userId;
  
  return this.save();
};

// Indexes for better query performance
purchaseOrderSchema.index({ status: 1, createdAt: -1 });
purchaseOrderSchema.index({ supplier: 1, status: 1 });
purchaseOrderSchema.index({ expectedDeliveryDate: 1 });

export default mongoose.model('PurchaseOrder', purchaseOrderSchema);
