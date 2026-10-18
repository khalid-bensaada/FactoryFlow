const mongoose = require("mongoose");

const stockMovementSchema = new mongoose.Schema(
  {
    material: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RawMaterial",
      required: true,
      index: true,
    },
    type: { type: String, enum: ["IN", "OUT"], required: true },
    quantity: {
      type: Number,
      required: true,
      validate: {
        validator: (value) => value > 0,
        message: "Quantity must be greater than 0",
      },
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ManufacturingOrder",
      default: null,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("StockMovement", stockMovementSchema);
