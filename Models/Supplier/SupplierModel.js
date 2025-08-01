import mongoose from "mongoose";

const supplierSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // assumes your User model is named 'User'
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      default: null,
    },
    address: {
      type: String,
      default: null,
      trim: true,
    },
    description: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index: ensures unique name per user
supplierSchema.index({ user: 1, name: 1 }, { unique: true });

export const SupplierModel = mongoose.model("Supplier", supplierSchema);
