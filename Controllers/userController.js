import asyncHandler from "express-async-handler";
import bcrypt from "bcrypt";
import { userModel } from "../Models/User/userModel.js";
import jwt from "jsonwebtoken";
import { SupplierModel } from "../Models/Supplier/SupplierModel.js";
import { ItemModel } from "../Models/Item/ItemModel.js";
import { PurchaseItemModel } from "../Models/Item/PurchaseItemModel.js";
import { CustomerModel } from "../Models/Customer/CustomerModel.js";
import { CategoryModel } from "../Models/Category/CategoryModel.js";
import { TransactionModel } from "../Models/Transaction/TransactionsModel.js";
import { PurchaseInvoiceItemModel } from "../Models/PurchaseInvoices/PurchaseInvoiceItemModel.js";
import { PurchaseInvoiceModel } from "../Models/PurchaseInvoices/PurchaseInvoiceModel.js";
import { PurchasePaymentModel } from "../Models/PurchaseInvoices/PurchasePaymentModel.js";
import { CustomerPaymentModel } from "../Models/SellInvoices/CustomerPayment/CustomerPayment.js";
import { SellInvoiceModel } from "../Models/SellInvoices/SellInvoice/SellInvoiceModel.js";
import { SellInvoiceItemModel } from "../Models/SellInvoices/SellInvoiceItem/SellInvoiceItemModel.js";
import mongoose from "mongoose";

// register a new user
// @desc POST api/user/signup

// login a user
// @desc POST api/user/signin
export const signinUser = asyncHandler(async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({ message: "Please provide credentials" });
    }
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Please provide credentials" });
    }

    // Find user by username
    const user = await userModel.findOne({ username });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Username or password is incorrect" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "Username or password is incorrect" });
    }

    //Check account expiration
    if (user.validUntil && new Date() > new Date(user.validUntil)) {
      return res.status(400).json({
        success: false,
        message: "AccessExpired",
      });
    }

    // Create JWT payload (minimize sensitive info)
    const payload = {
      user: {
        id: user._id,
        username: user.username,
        avatar: user.avatar || null, // fallback if avatar is missing
        role: user.role,
        validUntil: user.validUntil,
      },
    };

    // Sign JWT token
    const accessToken = jwt.sign(payload, process.env.SECRET_KEY, {
      expiresIn: "30d", // Recommended to set expiration
    });

    // Send response JSON with token and user info
    res.status(200).json({
      accessToken,
      id: user._id,
      username: user.username,
      avatar: user.avatar || null,
      favorites: user.favorites || [],
      mobileNumber: user.mobileNumber || "",
      role: user.role,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Server Error" });
  }
});

// login with google account
// @desc POST api/users/google
export const google = asyncHandler(async (req, res, next) => {
  console.log(req.body);
  // first we check that if the use exist in the database
  // if exist, then we  send and access token with cookie
  // and if the use not exist, first we need to generate
  // a random pasword for the user and also we need to
  // create a username for the user by using displayname that
  // we get from the googleAuthProvider and after that we send
  // an access token and cookie to the front-end
  const user = await userModel.findOne({ email: req.body.email });
  if (user) {
    const accessToken = jwt.sign(
      {
        user: {
          id: user.id,
          username: user.username,
          avatar: user.avatar,
        },
      },
      process.env.SECRET_KEY
    );
    // res
    //   .cookie("accessToken", accessToken, { httpOnly: true })
    //   .status(200)
    //   .json({
    //     id: user.id,
    //     username: user.username,
    //     avatar: user.avatar,
    //   });
    res.status(200).json({
      accessToken,
      id: user.id,
      username: user.username,
      avatar: user.avatar,
      mobileNumber: user.mobileNumber,
      favorites: user.favorites,
    });
  } else {
    // beacause the user not exist, first we create a random password and then we hash the password
    const generatedPassword =
      Math.random().toString(36).slice(-8) +
      Math.random().toString(36).slice(-8);
    // this return 0.2213dfdf but by using slice(-8)we return the last 8//characters
    // we use it again to create a strong password with 16 character

    // we hash the random generated password
    const hashedPassword = await bcrypt.hash(generatedPassword, 10);

    // we create a username for the user with a random suffix
    const newUsername =
      req.body.name.split(" ").join("").toLowerCase() +
      Math.random().toString(36).slice(-4);
    const user = await userModel.create({
      username: newUsername,
      email: req.body.email,
      password: hashedPassword,
      avatar: req.body.avatar,
    });
    if (!user) {
      res.status(400);
      throw new Error("User data is not valid");
    }
    const accessToken = jwt.sign(
      {
        user: {
          id: user.id,
          username: user.username,
          avatar: user.avatar,
        },
      },
      process.env.SECRET_KEY
    );
    // res
    //   .cookie("accessToken", accessToken, { httpOnly: true })
    //   .status(200)
    //   .json({
    //     id: user.id,
    //     username: user.username,
    //     avatar: user.avatar,
    //   });
    res.status(200).json({
      accessToken,
      id: user.id,
      username: user.username,
      avatar: user.avatar,
      mobileNumber: user.mobileNumber,
      favorites: user.favorites,
    });
  }
});

export const updateUser = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User is not authorized" });
    }

    const { username, email, password, newPassword, avatar, mobileNumber } =
      req.body;

    const user = await userModel.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "UserNotFound" });
    }

    // Check current password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "IncorrectPassword" });
    }

    // // Check if new username is taken (by another user)
    // if (username && username !== user.username) {
    //   const existingUsername = await userModel.findOne({ username });
    //   if (
    //     existingUsername &&
    //     existingUsername._id.toString() !== req.params.id
    //   ) {
    //     return res.status(400).json({ message: "Username is already taken" });
    //   }
    // }

    // // Check if new email is taken (by another user)
    // if (email && email !== user.email) {
    //   const existingEmail = await userModel.findOne({ email });
    //   if (existingEmail && existingEmail._id.toString() !== req.params.id) {
    //     return res.status(400).json({ message: "Email is already in use" });
    //   }
    // }

    const updateData = {
      username,
      email,
      avatar,
      mobileNumber,
    };

    // Update password if provided and valid
    if (newPassword) {
      if (newPassword.length < 8) {
        return res
          .status(400)
          .json({ message: "New password must be at least 8 characters" });
      }
      updateData.password = await bcrypt.hash(newPassword, 10);
    }

    const updatedUser = await userModel.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(400).json({ message: "Failed to update user" });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    if (
      error.message == "Email already in use" ||
      error.message == "Username is not available"
    ) {
      return res.status(400).json({ success: false, message: error.message });
    }
    return res.status(500).json({ message: "ServerError" });
  }
};

// delete user account
export const deleteUser = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    res.status(401);
    throw new Error("User is not authorized");
  }

  const deletedUser = await userModel.findByIdAndDelete(req.params.id);

  if (!deletedUser) {
    res.status(404);
    throw new Error("User not found or already deleted");
  }

  res.status(200).json({
    message: "User deleted successfully",
    id: deletedUser._id,
    username: deletedUser.username,
    email: deletedUser.email,
  });
});

// get user information
export const getUserInfo = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    res.status(401);
    throw new Error("User is not authorized");
  }
  const user = await userModel.findOne({ _id: req.params.id });
  if (!user) {
    res.status(404);
    throw new Error("User is not found");
  }
  const { username, email, mobileNumber, validUntil } = user;
  res.status(200).json({ username, email, mobileNumber, validUntil });
});

// Superadmin methods

export const signupUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: "Please provide credentials" });
    }

    const userEmailAvailable = await userModel.findOne({ email });
    if (userEmailAvailable) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const usernameAvailable = await userModel.findOne({ username });
    if (usernameAvailable) {
      return res.status(400).json({ message: "Username is not available" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await userModel.create({
      username,
      email,
      password: hashedPassword,
    });

    res.status(201).json({
      username,
      id: user._id,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Server Error" });
  }
};

// get all users information
export const getAllUsersInfo = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    res.status(401);
    throw new Error("User is not authorized");
  }

  // Optional: allow only admin/superadmin
  if (req.user.role !== "admin" && req.user.role !== "superadmin") {
    res.status(403);
    throw new Error("Access denied");
  }

  const users = await userModel.find(
    {},
    "username email mobileNumber role validUntil createdAt"
  );

  console.log(users);

  res.status(200).json({ success: true, data: users });
});

// update user's validUntil date
export const updateValidUntil = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { validUntil } = req.body;

  if (!req.user) {
    res.status(401);
    throw new Error("User is not authorized");
  }

  // Optional: restrict to only superadmin
  if (req.user.role !== "superadmin") {
    res.status(403);
    throw new Error("Access denied");
  }

  if (!validUntil || isNaN(Date.parse(validUntil))) {
    res.status(400);
    throw new Error("Valid date is required");
  }

  const user = await userModel.findById(id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  user.validUntil = new Date(validUntil);
  await user.save();

  res.status(200).json({
    message: "validUntil updated successfully",
    validUntil: user.validUntil,
  });
});

export const getBackup = async (req, res, next) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "User is not authorized" });
    }

    const userId = req.user.id; // Make sure this is set by your auth middleware

    const { password } = req.body;
    if (!password) {
      return res
        .status(400)
        .json({ success: false, message: "Password is required" });
    }

    // Get user including password hash
    const user = await userModel.findById(userId).select("+password"); // make sure password field is selected

    if (!user) {
      return res.status(404).json({ success: false, message: "UserNotFound" });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "InvalidPassword" });
    }

    const [
      transactions,
      suppliers,
      customers,
      categories,
      items,
      purchaseItems,
      purchaseInvoices,
      purchaseInvoiceItems,
      purchasePayments,
      customerPayments,
      sellInvoices,
      sellInvoiceItems,
    ] = await Promise.all([
      TransactionModel.find({ user: userId }),
      SupplierModel.find({ user: userId }),
      CustomerModel.find({ user: userId }),
      CategoryModel.find({ user: userId }),
      ItemModel.find({ user: userId }),
      PurchaseItemModel.find({ user: userId }),
      PurchaseInvoiceModel.find({ user: userId }),
      PurchaseInvoiceItemModel.find({ user: userId }),
      PurchasePaymentModel.find({ user: userId }),
      CustomerPaymentModel.find({ user: userId }),
      SellInvoiceModel.find({ user: userId }),
      SellInvoiceItemModel.find({ user: userId }),
    ]);

    const backupData = {
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        mobileNumber: user.mobileNumber,
        // exclude password and other sensitive info here
      },
      transactions,
      suppliers,
      customers,
      categories,
      items,
      purchaseItems,
      purchaseInvoices,
      purchaseInvoiceItems,
      purchasePayments,
      customerPayments,
      sellInvoices,
      sellInvoiceItems,
      createdAt: new Date(),
    };

    res.setHeader("Content-Disposition", "attachment; filename=backup.json");
    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(backupData, null, 2));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create backup." });
  }
};

export const uploadBackup = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const userId = req.user.id;
    if (!req.file || !req.file.buffer) {
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });
    }

    const { password } = req.body;
    if (!password) {
      return res
        .status(400)
        .json({ success: false, message: "Password is required" });
    }

    // Get user including password hash
    const user = await userModel.findById(userId).select("+password"); // make sure password field is selected

    if (!user) {
      return res.status(404).json({ success: false, message: "UserNotFound" });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "InvalidPassword" });
    }

    let backup;
    try {
      const jsonString = req.file.buffer.toString("utf-8");
      backup = JSON.parse(jsonString);
    } catch (parseErr) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid JSON format" });
    }

    if (!backup || !Array.isArray(backup.transactions)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid backup structure" });
    }

    console.log(backup);

    await session.withTransaction(async () => {
      // Step 1: Delete old data for the user
      await Promise.all([
        TransactionModel.deleteMany({ user: userId }, { session }),
        SupplierModel.deleteMany({ user: userId }, { session }),
        CustomerModel.deleteMany({ user: userId }, { session }),
        CategoryModel.deleteMany({ user: userId }, { session }),
        ItemModel.deleteMany({ user: userId }, { session }),
        PurchaseItemModel.deleteMany({ user: userId }, { session }),
        PurchaseInvoiceModel.deleteMany({ user: userId }, { session }),
        PurchaseInvoiceItemModel.deleteMany({ user: userId }, { session }),
        PurchasePaymentModel.deleteMany({ user: userId }, { session }),
        CustomerPaymentModel.deleteMany({ user: userId }, { session }),
        SellInvoiceModel.deleteMany({ user: userId }, { session }),
        SellInvoiceItemModel.deleteMany({ user: userId }, { session }),
      ]);

      // Step 2: Insert backup data directly (no modifications)
      await Promise.all([
        TransactionModel.insertMany(backup.transactions, { session }),
        SupplierModel.insertMany(backup.suppliers, { session }),
        CustomerModel.insertMany(backup.customers, { session }),
        CategoryModel.insertMany(backup.categories, { session }),
        ItemModel.insertMany(backup.items, { session }),
        PurchaseItemModel.insertMany(backup.purchaseItems, { session }),
        PurchaseInvoiceModel.insertMany(backup.purchaseInvoices, { session }),
        PurchaseInvoiceItemModel.insertMany(backup.purchaseInvoiceItems, {
          session,
        }),
        PurchasePaymentModel.insertMany(backup.purchasePayments, { session }),
        CustomerPaymentModel.insertMany(backup.customerPayments, { session }),
        SellInvoiceModel.insertMany(backup.sellInvoices, { session }),
        SellInvoiceItemModel.insertMany(backup.sellInvoiceItems, { session }),
      ]);
    });

    res
      .status(200)
      .json({ success: true, message: "Backup restored successfully" });
  } catch (error) {
    console.error("Upload failed:", error);
    res.status(500).json({ success: false, message: "Restore failed" });
  } finally {
    await session.endSession();
  }
};
