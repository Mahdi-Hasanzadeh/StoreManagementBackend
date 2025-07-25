import mongoose from "mongoose";
const { Schema } = mongoose;

const PurchasePaymentSchema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    invoice: {
      type: Schema.Types.ObjectId,
      ref: "PurchaseInvoice",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    paid_at: {
      type: Date,
      default: Date.now, // use current timestamp by default
    },
    description: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt fields
  }
);

export const PurchasePaymentModel = mongoose.model(
  "PurchasePayment",
  PurchasePaymentSchema
);
