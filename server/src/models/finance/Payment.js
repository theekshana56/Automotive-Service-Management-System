import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  invoice: {
    type: mongoose.Schema.ObjectId,
    ref: 'Invoice',
    required: true
  },
  customer: {
    type: mongoose.Schema.ObjectId,
    ref: 'Customer',
    required: true
  },
  amount: {
    type: Number,
    required: [true, 'Please add a payment amount'],
    min: 0
  },
  paymentDate: {
    type: Date,
    default: Date.now
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'credit_card', 'debit_card', 'bank_transfer', 'check'],
    required: [true, 'Please select a payment method']
  },
  reference: {
    type: String,
    maxlength: [100, 'Reference cannot be more than 100 characters']
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot be more than 500 characters']
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

// Update invoice status and customer balance when payment is saved
paymentSchema.post('save', async function() {
  const Invoice = mongoose.model('Invoice');
  const Customer = mongoose.model('Customer');
  
  if (this.status === 'completed') {
    const invoice = await Invoice.findById(this.invoice);
    if (invoice) {
      const payments = await mongoose.model('Payment').find({
        invoice: this.invoice,
        status: 'completed'
      });
      
      const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
      
      if (totalPaid >= invoice.totalAmount) {
        invoice.status = 'paid';
      } else if (invoice.dueDate < new Date()) {
        invoice.status = 'overdue';
      } else {
        invoice.status = 'sent';
      }
      
      await invoice.save();
    }
    
    // Update customer balance
    const customer = await Customer.findById(this.customer);
    if (customer) {
      await customer.updateBalance();
    }
  }
});

export default mongoose.model('Payment', paymentSchema);