import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema({
  make: {
    type: String,
    required: [true, 'Please add a vehicle make'],
    trim: true,
    maxlength: [50, 'Make cannot be more than 50 characters']
  },
  model: {
    type: String,
    required: [true, 'Please add a vehicle model'],
    trim: true,
    maxlength: [50, 'Model cannot be more than 50 characters']
  },
  year: {
    type: Number,
    required: [true, 'Please add a vehicle year'],
    min: 1900,
    max: new Date().getFullYear() + 1
  },
  vin: {
    type: String,
    required: [true, 'Please add a VIN'],
    unique: true,
    maxlength: [17, 'VIN must be 17 characters']
  },
  licensePlate: {
    type: String,
    required: [true, 'Please add a license plate'],
    maxlength: [15, 'License plate cannot be more than 15 characters']
  },
  color: {
    type: String,
    maxlength: [30, 'Color cannot be more than 30 characters']
  },
  mileage: {
    type: Number,
    min: 0
  },
  customer: {
    type: mongoose.Schema.ObjectId,
    ref: 'Customer',
    required: true
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

export default mongoose.model('Vehicle', vehicleSchema);