import mongoose from "mongoose";

const itemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    last_price: {
      type: Number,
      default: null,
      set: (v) => Math.round(v * 100) / 100,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure `name` is unique **per user**
itemSchema.index({ user: 1, name: 1 }, { unique: true });

export const ItemModel = mongoose.model("Item", itemSchema);
