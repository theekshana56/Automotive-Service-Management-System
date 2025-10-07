import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  advisor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  serviceType: { type: String, enum: ['General Service','Oil Change','Diagnostics','Body Work'], required: true },
  vehicle: { model: String, year: Number, plate: String },
  date: { type: String, required: true },     // YYYY-MM-DD
  timeSlot: { type: String, required: true }, // e.g. 10:00-11:00
  status: { type: String, enum: ['Pending','Confirmed','In Progress','Completed','Cancelled','Queued'], default: 'Pending' },
  notes: String,
  estimatedCost: { type: Number, default: 0 },
  canModifyUntil: Date,
  serviceStartTime: Date, // When service actually started
  serviceEndTime: Date,   // When service completed
  estimatedDuration: { type: Number, default: 60 }, // Duration in minutes
  slotId: { type: String, required: true }, // Unique slot identifier
  isSlotAvailable: { type: Boolean, default: true }, // Slot availability status
  queuePosition: { type: Number, default: 0 }, // Position in queue for this time slot
  isQueued: { type: Boolean, default: false }, // Whether this booking is in queue
  queueStartTime: Date, // When the booking entered the queue
  estimatedServiceTime: Date // Estimated time when service will actually start
}, { timestamps: true });

export default mongoose.model('Booking', bookingSchema);
