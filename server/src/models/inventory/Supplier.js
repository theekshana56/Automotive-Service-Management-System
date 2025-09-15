import mongoose from "mongoose";

const SupplierSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    contactPerson: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

export default mongoose.model("Supplier", SupplierSchema);
