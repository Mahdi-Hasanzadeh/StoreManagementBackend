import mongoose from "mongoose";

const userSchema = mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Please provide username"],
      unique: [true, "Username is not available"],
    },
    email: {
      type: String,
      required: [true, "Please provide email"],
      unique: [true, "Email already in use"],
    },
    password: {
      type: String,
      required: [true, "Please Provide Password"],
    },
    avatar: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      enum: ["user", "admin", "superadmin"],
      default: "user",
    },
    mobileNumber: {
      type: String,
      default: "",
    },
    validUntil: {
      type: Date,
      default: () => new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    },
  },
  {
    timestamps: true,
  }
);

export const userModel = mongoose.model("User", userSchema);
