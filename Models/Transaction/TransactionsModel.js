import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    amount: {
      type: Number,
      required: true,
      set: (v) => Math.round(v * 100) / 100,
    },
    type: {
      type: String,
      enum: ["income", "expense"],
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export const TransactionModel = mongoose.model(
  "Transaction",
  transactionSchema
);
