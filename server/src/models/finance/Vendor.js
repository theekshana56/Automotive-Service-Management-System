import mongoose from 'mongoose';

const vendorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a vendor name'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  contactPerson: {
    type: String,
    trim: true,
    maxlength: [50, 'Contact person name cannot be more than 50 characters']
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
  paymentTerms: {
    type: Number,
    default: 30,
    min: 0
  },
  accountNumber: {
    type: String,
    maxlength: [50, 'Account number cannot be more than 50 characters']
  },
  taxId: {
    type: String,
    maxlength: [50, 'Tax ID cannot be more than 50 characters']
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

export default mongoose.model('Vendor', vendorSchema);