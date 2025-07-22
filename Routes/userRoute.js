import express from "express";
import {
  signupUser,
  signinUser,
  google,
  updateUser,
  deleteUser,
  getUserInfo,
} from "../Controllers/userController.js";

import { validateToken } from "../Middleware/validateToken.js";

const Router = express.Router();

//@desc POST api/user/signup

// register a user

Router.post("/signup", signupUser);
Router.post("/signin", signinUser);
Router.post("/google", google);
Router.delete("/delete/:id", validateToken, deleteUser);
Router.get("/userInfo/:id", validateToken, getUserInfo);

//private route
Router.put("/update/:id", validateToken, updateUser);

export default Router;
