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
CustomerPaymentSchema.set("toJSON", {
  transform: function (doc, ret) {
    if (ret.amount !== undefined) {
      ret.amount = parseFloat(ret.amount.toFixed(2));
    }
    return ret;
  },
});
export const CustomerPaymentModel = mongoose.model(
  "Payment",
  CustomerPaymentSchema
);
