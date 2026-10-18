const mongoose = require("mongoose");

const rawMaterialSchema = new mongoose.Schema(
  {
    reference: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    unit: { type: String, required: true, trim: true },
    quantity: { type: Number, default: 0, min: 0 },
    alertThreshold: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

module.exports = mongoose.model("RawMaterial", rawMaterialSchema);
