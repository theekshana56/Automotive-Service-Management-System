import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: [true, 'Please add an invoice number'],
    unique: true
  },
  customer: {
    type: mongoose.Schema.ObjectId,
    ref: 'Customer',
    required: true
  },

  date: {
    type: Date,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: [true, 'Please add a due date']
  },
  items: [{
    description: {
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
    taxRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  }],
  status: {
    type: String,
    enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
    default: 'draft'
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot be more than 500 characters']
  },
  totalAmount: {
    type: Number,
    min: 0
  },
  taxAmount: {
    type: Number,
    min: 0
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

// Calculate totals before saving
invoiceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  if (this.items && this.items.length > 0) {
    let total = 0;
    let tax = 0;
    
    this.items.forEach(item => {
      const itemTotal = item.quantity * item.unitPrice;
      const itemTax = itemTotal * (item.taxRate / 100);
      total += itemTotal;
      tax += itemTax;
    });
    
    this.totalAmount = total;
    this.taxAmount = tax;
  }
  
  next();
});

export default mongoose.model('Invoice', invoiceSchema);