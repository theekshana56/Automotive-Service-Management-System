import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a customer name'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  email: {
    type: String,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  phone: {
    type: String,
    maxlength: [20, 'Phone number cannot be longer than 20 characters']
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  balance: {
    type: Number,
    default: 0
  },
  creditLimit: {
    type: Number,
    default: 0,
    min: 0
  },
  paymentTerms: {
    type: Number,
    default: 30,
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

// Update balance when invoices or payments change
customerSchema.methods.updateBalance = async function() {
  const Invoice = mongoose.model('Invoice');
  const Payment = mongoose.model('Payment');
  
  const totalInvoices = await Invoice.aggregate([
    { $match: { customer: this._id, status: { $in: ['sent', 'overdue'] } } },
    { $group: { _id: null, total: { $sum: '$totalAmount' } } }
  ]);
  
  const totalPayments = await Payment.aggregate([
    { $match: { customer: this._id, status: 'completed' } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  
  const invoiceTotal = totalInvoices.length > 0 ? totalInvoices[0].total : 0;
  const paymentTotal = totalPayments.length > 0 ? totalPayments[0].total : 0;
  
  this.balance = invoiceTotal - paymentTotal;
  this.updatedAt = Date.now();
  await this.save();
};

export default mongoose.model('Customer', customerSchema);