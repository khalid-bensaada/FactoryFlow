const mongoose = require("mongoose");
const { ORDER_STATUS, ORDER_STATUSES } = require("../constants/orderStatus");

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

const manufacturingOrderSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    quantity: {
      type: Number,
      required: true,
      validate: {
        validator: (value) => value > 0,
        message: "Quantity must be greater than 0",
      },
    },
    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: ORDER_STATUS.PLANNED,
      index: true,
    },
    composition: {
      type: [compositionItemSchema],
      required: true,
      immutable: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    startedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    startedAt: { type: Date, default: null },
    finishedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

module.exports = mongoose.model("ManufacturingOrder", manufacturingOrderSchema);
