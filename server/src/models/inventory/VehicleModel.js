// server/models/VehicleModel.js
const mongoose = require('mongoose');

const VehicleModelSchema = new mongoose.Schema({
  make: { type: String, required: true, trim: true },
  model: { type: String, required: true, trim: true },
  yearFrom: { type: Number, required: true },
  yearTo: { type: Number, required: true },
  engineType: { type: String, trim: true },
}, { timestamps: true });

module.exports = mongoose.model('VehicleModel', VehicleModelSchema);
