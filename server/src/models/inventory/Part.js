import mongoose from "mongoose";

// Embedded stock schema to match usage across services/controllers/tests
const StockSchema = new mongoose.Schema(
  {
    onHand: { type: Number, default: 0, min: 0 },
    reserved: { type: Number, default: 0, min: 0 },
    minLevel: { type: Number, default: 0, min: 0 },
    maxLevel: { type: Number, default: 0, min: 0 },
    reorderLevel: { type: Number, default: 0, min: 0 },
    // Some import utilities refer to maxStock; keep it for compatibility
    maxStock: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const PartSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    // Unique human/scan code, used everywhere across the app
    partCode: { type: String, required: true, unique: true, trim: true, index: true },

    description: { type: String, default: "", trim: true },

    // Category stored as a simple string in current routes/controllers
    category: { type: String, default: "", trim: true },

    // Preferred suppliers for this part
    suppliers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' }],

    // Pre-generated barcode URL (see controllers for generation)
    barcodeUrl: { type: String, default: "" },

    // Stock information as an embedded document
    stock: { type: StockSchema, default: () => ({}) },

  // Cost information (purchase-related)
  cost: {
    lastPurchasePrice: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: "USD", trim: true },
  },

    // Selling price for this part (retail/unit price)
    sellingPrice: { type: Number, default: 0, min: 0 },

    // Flags and system fields
    isActive: { type: Boolean, default: true },

    // Cooldown tracking for low-stock alerts
    lastAlertedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Virtual helper for available quantity (onHand - reserved)
PartSchema.virtual("available").get(function () {
  const s = this.stock || {};
  return Math.max(0, (s.onHand || 0) - (s.reserved || 0));
});

export default mongoose.model("Part", PartSchema);