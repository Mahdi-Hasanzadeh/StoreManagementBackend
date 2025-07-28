import mongoose from "mongoose";

const CustomerPaymentSchema = new mongoose.Schema(
  {
    invoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SellInvoice",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      set: (v) => Math.round(v * 100) / 100,
    },
    paid_at: {
      type: Date,
      default: Date.now,
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

export const CustomerPaymentModel = mongoose.model(
  "Payment",
  CustomerPaymentSchema
);
