import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true, lowercase: true },
  password: { type: String, required: true, select: false },
  role: {
    type: String,
    enum: ['user', 'advisor', 'manager', 'admin', 'finance_manager', 'inventory_manager', 'staff_member', 'staff_manager', 'hr_manager', 'mechanic'],
    default: 'user'
  },
  phone: String,
  address: String,
  avatarUrl: String, // served from /uploads/...
  resetOTP: { code: String, expiresAt: Date },
  bookingCount: { type: Number, default: 0 }, // Track total bookings
  isLoyaltyEligible: { type: Boolean, default: false }, // Flag for finance notification
  loyaltyDiscountRequested: { type: Boolean, default: false }, // Has user requested discount
  loyaltyDiscountApproved: { type: Boolean, default: false }, // Finance approval status
  loyaltyDiscountRequestDate: Date, // When discount was requested
  loyaltyDiscountApprovalDate: Date, // When finance approved/rejected
  // Staff specific fields
  isAvailable: { type: Boolean, default: true }, // Staff availability
  currentBookings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Booking' }], // Current assignments (for advisors)
  maxConcurrentBookings: { type: Number, default: 3 }, // Max bookings per advisor
  specializations: [{ type: String }], // Service types they can handle (for advisors)
  department: { type: String }, // Department for non-advisor staff
  permissions: [{ type: String }] // Permissions for staff members
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function(candidate) {
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.model('User', userSchema);
