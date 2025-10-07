import mongoose from 'mongoose';

const inventoryPaymentSchema = new mongoose.Schema({
  supplierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true
  },
  supplierName: {
    type: String,
    required: true
  },
  purchaseOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PurchaseOrder',
    required: true
  },
  purchaseOrderNumber: {
    type: String,
    required: true
  },
  paymentDate: {
    type: Date,
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  items: [{
    partId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Part',
      required: true
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
  subtotal: {
    type: Number,
    required: true,
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
  shippingCost: {
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
    required: true,
    min: 0
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  remainingAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'paid', 'overdue', 'cancelled'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['bank_transfer', 'cash', 'cheque', 'credit_card'],
    default: 'bank_transfer'
  },
  paymentReference: {
    type: String,
    trim: true
  },
  bankDetails: {
    accountNumber: String,
    bankName: String,
    branch: String,
    swiftCode: String
  },
  paymentHistory: [{
    paymentDate: {
      type: Date,
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    paymentMethod: {
      type: String,
      required: true
    },
    reference: String,
    notes: String,
    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  }],
  notes: {
    type: String,
    maxlength: 500
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  paidBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  paidAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Pre-save middleware to calculate amounts
inventoryPaymentSchema.pre('save', function(next) {
  // Calculate subtotal from items
  this.subtotal = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
  
  // Calculate tax amount
  this.taxAmount = (this.subtotal * this.taxRate) / 100;
  
  // Calculate total amount
  this.totalAmount = this.subtotal + this.taxAmount + this.shippingCost - this.discountAmount;
  
  // Calculate remaining amount
  this.remainingAmount = this.totalAmount - this.paidAmount;
  
  // Update payment status
  if (this.remainingAmount <= 0) {
    this.paymentStatus = 'paid';
  } else if (this.paidAmount > 0) {
    this.paymentStatus = 'partial';
  } else if (this.dueDate < new Date()) {
    this.paymentStatus = 'overdue';
  } else {
    this.paymentStatus = 'pending';
  }
  
  next();
});

// Index for efficient queries
inventoryPaymentSchema.index({ supplierId: 1, paymentDate: -1 });
inventoryPaymentSchema.index({ paymentStatus: 1, dueDate: 1 });
inventoryPaymentSchema.index({ purchaseOrderId: 1 });

export default mongoose.model('InventoryPayment', inventoryPaymentSchema);
