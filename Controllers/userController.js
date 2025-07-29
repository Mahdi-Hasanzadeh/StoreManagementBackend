import asyncHandler from "express-async-handler";
import bcrypt from "bcrypt";
import { userModel } from "../Models/User/userModel.js";
import jwt from "jsonwebtoken";

// register a new user
// @desc POST api/user/signup
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

    // Create JWT payload (minimize sensitive info)
    const payload = {
      user: {
        id: user._id,
        username: user.username,
        avatar: user.avatar || null, // fallback if avatar is missing
        role: user.role,
      },
    };

    // Sign JWT token
    const accessToken = jwt.sign(payload, process.env.SECRET_KEY, {
      expiresIn: "1d", // Recommended to set expiration
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
  const { username, email, mobileNumber } = user;
  res.status(200).json({ username, email, mobileNumber });
});
