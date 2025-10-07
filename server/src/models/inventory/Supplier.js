import mongoose from "mongoose";

// Address sub-document
const AddressSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["HEAD_OFFICE", "WAREHOUSE", "BILLING"], required: true },
    line1: { type: String, required: true, trim: true },
    line2: { type: String, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, trim: true },
    postalCode: { type: String, trim: true },
    country: { type: String, required: true, trim: true },
  },
  { _id: false }
);

// Primary contact sub-document
const PrimaryContactSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    position: { type: String, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    mobile: { type: String, trim: true },
  },
  { _id: false }
);

// Bank details sub-document (optional)
const BankDetailsSchema = new mongoose.Schema(
  {
    bankName: { type: String, trim: true },
    accountName: { type: String, trim: true },
    accountNumber: { type: String, trim: true },
    branch: { type: String, trim: true },
  },
  { _id: false }
);

const SupplierSchema = new mongoose.Schema(
  {
    // 1. Basic Company Information
    companyName: { type: String, required: true, trim: true, index: true },
    displayName: { type: String, trim: true },
    businessRegistrationNo: { type: String, required: true, trim: true, index: true },
    website: { type: String, trim: true },

    // 2. Primary Contact Information
    primaryContact: { type: PrimaryContactSchema, required: true },

    // 3. Address Information
    addresses: { type: [AddressSchema], validate: v => Array.isArray(v) && v.length > 0 },

    // 4. Financial & Terms Information
    paymentTerms: { type: String, required: true, trim: true },
    currency: { type: String, required: true, trim: true },
    bankDetails: { type: BankDetailsSchema, default: undefined },

    // 5. Product & Operational Information
    suppliedCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true }],
    leadTimeDays: { type: Number, required: true, min: 0 },

    // Common flags
    isActive: { type: Boolean, default: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

// Unique compound index to avoid duplicates by company and BRN
SupplierSchema.index({ companyName: 1, businessRegistrationNo: 1 }, { unique: true });

export default mongoose.model("Supplier", SupplierSchema);
