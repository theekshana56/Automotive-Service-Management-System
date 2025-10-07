import mongoose from 'mongoose';

const capitalSchema = new mongoose.Schema({
  initialAmount: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  currentAmount: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  totalSpent: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Transaction history
  transactions: [{
    type: {
      type: String,
      enum: ['initial', 'purchase_order', 'adjustment', 'refund'],
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    reference: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'transactions.referenceType'
    },
    referenceType: {
      type: String,
      enum: ['PurchaseOrder', 'User', 'Adjustment']
    },
    date: {
      type: Date,
      default: Date.now
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }]
}, { timestamps: true });

// Method to add a transaction
capitalSchema.methods.addTransaction = function(transactionData) {
  this.transactions.push(transactionData);
  this.lastUpdated = new Date();
  return this.save();
};

// Method to spend capital (for purchase orders)
capitalSchema.methods.spendCapital = function(amount, description, reference, referenceType, userId) {
  if (this.currentAmount < amount) {
    throw new Error('Insufficient capital');
  }
  
  this.currentAmount -= amount;
  this.totalSpent += amount;
  this.updatedBy = userId;
  
  return this.addTransaction({
    type: 'purchase_order',
    amount: -amount, // Negative amount for spending
    description,
    reference,
    referenceType,
    createdBy: userId
  });
};

// Method to refund capital (if purchase order is cancelled)
capitalSchema.methods.refundCapital = function(amount, description, reference, referenceType, userId) {
  this.currentAmount += amount;
  this.totalSpent -= amount;
  this.updatedBy = userId;
  
  return this.addTransaction({
    type: 'refund',
    amount: amount, // Positive amount for refund
    description,
    reference,
    referenceType,
    createdBy: userId
  });
};

// Method to initialize capital
capitalSchema.methods.initializeCapital = function(amount, userId) {
  this.initialAmount = amount;
  this.currentAmount = amount;
  this.totalSpent = 0;
  this.updatedBy = userId;
  
  return this.addTransaction({
    type: 'initial',
    amount: amount,
    description: 'Initial capital setup',
    createdBy: userId
  });
};

// Static method to get or create capital record
capitalSchema.statics.getOrCreate = async function() {
  let capital = await this.findOne();
  if (!capital) {
    // Auto-initialize with $500,000
    const systemUserId = new mongoose.Types.ObjectId();
    capital = new this({
      initialAmount: 500000,
      currentAmount: 500000,
      totalSpent: 0,
      updatedBy: systemUserId
    });
    
    // Add initial transaction
    capital.transactions.push({
      type: 'initial',
      amount: 500000,
      description: 'Auto-initialized capital setup',
      createdBy: systemUserId,
      date: new Date()
    });
    
    await capital.save();
    console.log('💰 Capital auto-initialized with $500,000');
  } else if (capital.initialAmount === 0) {
    // If capital exists but not initialized, initialize it
    const systemUserId = new mongoose.Types.ObjectId();
    capital.initialAmount = 500000;
    capital.currentAmount = 500000;
    capital.totalSpent = 0;
    capital.updatedBy = systemUserId;
    
    // Add initial transaction
    capital.transactions.push({
      type: 'initial',
      amount: 500000,
      description: 'Auto-initialized capital setup',
      createdBy: systemUserId,
      date: new Date()
    });
    
    await capital.save();
    console.log('💰 Capital auto-initialized with $500,000');
  }
  return capital;
};

export default mongoose.model('Capital', capitalSchema);
