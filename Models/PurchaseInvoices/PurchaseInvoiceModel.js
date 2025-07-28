import mongoose from "mongoose";

const purchaseInvoiceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
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
  },
  {
    timestamps: true,
  }
);

export const PurchaseInvoiceModel = mongoose.model(
  "PurchaseInvoice",
  purchaseInvoiceSchema
);
