import mongoose from 'mongoose';

const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  parentCategoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
  level: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model('Category', CategorySchema);
