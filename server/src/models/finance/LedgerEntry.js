import mongoose from 'mongoose';

const ledgerEntrySchema = new mongoose.Schema({
  date: {
    type: Date,
    default: Date.now
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    maxlength: [200, 'Description cannot be more than 200 characters']
  },
  debit: {
    type: Number,
    min: 0
  },
  credit: {
    type: Number,
    min: 0
  },
  account: {
    type: String,
    required: [true, 'Please specify an account'],
    enum: [
      'accounts_receivable',
      'accounts_payable',
      'revenue',
      'expenses',
      'cash',
      'bank',
      'tax'
    ]
  },
  reference: {
    type: mongoose.Schema.ObjectId,
    required: true
  },
  referenceType: {
    type: String,
    required: true,
    enum: ['invoice', 'payment', 'bill', 'vendor_payment']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('LedgerEntry', ledgerEntrySchema);