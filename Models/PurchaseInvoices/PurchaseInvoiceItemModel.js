import mongoose from "mongoose";

const { Schema } = mongoose;

const PurchaseItemSchema = new Schema(
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
    item: {
      type: Schema.Types.ObjectId,
      ref: "Item",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      set: (v) => Math.round(v),
    },
    unit_price: {
      type: Number,
      required: true,
      min: 0,
      set: (v) => Math.round(v * 100) / 100,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
      set: (v) => Math.round(v * 100) / 100,
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

export const PurchaseInvoiceItemModel = mongoose.model(
  "PurchaseItem",
  PurchaseItemSchema
);
