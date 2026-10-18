const mongoose = require("mongoose");

const compositionItemSchema = new mongoose.Schema(
  {
    material: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RawMaterial",
      required: true,
    },
    quantityPerUnit: {
      type: Number,
      required: true,
      validate: {
        validator: (value) => value > 0,
        message: "Quantity per unit must be greater than 0",
      },
    },
  },
  { _id: false },
);

const productSchema = new mongoose.Schema(
  {
    reference: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    composition: {
      type: [compositionItemSchema],
      validate: {
        validator: (items) => items.length > 0,
        message: "Composition must have at least one item",
      },
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Product", productSchema);
