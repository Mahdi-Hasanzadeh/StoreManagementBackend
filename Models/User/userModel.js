import mongoose from "mongoose";

const userSchema = mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Please provide username"],
      unique: [true, "this username is not available"],
    },
    email: {
      type: String,
      required: [true, "Please provide email"],
      unique: [true, "Email is already in used"],
    },
    password: {
      type: String,
      required: [true, "Please Provide Password"],
    },
    avatar: {
      type: String,
      default: "",
    },
    mobileNumber: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

export const userModel = mongoose.model("User", userSchema);
