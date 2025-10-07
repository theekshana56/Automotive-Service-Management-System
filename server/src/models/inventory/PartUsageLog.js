import mongoose from "mongoose";

const PartUsageLogSchema = new mongoose.Schema({
  partId: { type: mongoose.Schema.Types.ObjectId, ref: "Part", required: true },
  quantityUsed: { type: Number, required: true, min: 1 },
  usedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" }, // Optional: link to job/booking
  usedAt: { type: Date, default: Date.now },
  note: { type: String, trim: true },
}, { timestamps: true });

export default mongoose.model("PartUsageLog", PartUsageLogSchema);
