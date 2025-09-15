import mongoose from "mongoose";

const AuditLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    entityType: { type: String, enum: ["Part", "Supplier", "PurchaseOrder"], required: true },
    entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
    action: { type: String, enum: ["create", "update", "delete"], required: true },
    before: { type: mongoose.Schema.Types.Mixed },
    after: { type: mongoose.Schema.Types.Mixed },
    source: { type: String, default: "API" },
  },
  { timestamps: true }
);

export default mongoose.model("InventoryAuditLog", AuditLogSchema);
