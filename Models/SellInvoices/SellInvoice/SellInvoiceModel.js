import mongoose from "mongoose";

const sellInvoiceSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    total: {
      type: Number,
      default: 0,
      set: (v) => Math.round(v * 100) / 100,
    },
    paid_amount: {
      type: Number,
      default: 0,
      set: (v) => Math.round(v * 100) / 100,
    },
    remaining_amount: {
      type: Number,
      default: 0,
      set: (v) => Math.round(v * 100) / 100,
    },
    date: {
      type: Date,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

export const SellInvoiceModel = mongoose.model(
  "SellInvoice",
  sellInvoiceSchema
);
