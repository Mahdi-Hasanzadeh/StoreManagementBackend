import express from "express";
import multer from "multer";
import {
  signupUser,
  signinUser,
  google,
  updateUser,
  deleteUser,
  getUserInfo,
  getAllUsersInfo,
  updateValidUntil,
  getBackup,
  uploadBackup,
} from "../Controllers/userController.js";

import { validateToken } from "../Middleware/validateToken.js";
import { authorizeSuperAdmin } from "../Middleware/superadminMiddleware.js";

const Router = express.Router();

const upload = multer({ storage: multer.memoryStorage() }); // configure multer

//@desc POST api/user/

// register a user
//Superadmin
Router.post("/signup", validateToken, authorizeSuperAdmin, signupUser);
Router.get("/getAllUsers", validateToken, authorizeSuperAdmin, getAllUsersInfo);
Router.put(
  "/updateValidUntil/:id",
  validateToken,
  authorizeSuperAdmin,
  updateValidUntil
);

// Admin
Router.post("/signin", signinUser);
Router.post("/google", google);
Router.delete("/delete/:id", validateToken, deleteUser);
Router.get("/userInfo/:id", validateToken, getUserInfo);

//private route
Router.put("/update/:id", validateToken, updateUser);
Router.post("/backup", validateToken, getBackup);

// ** Add multer middleware here for file upload **
// Router.post(
//   "/uploadBackup",
//   validateToken,
//   upload.single("backup"),
//   uploadBackup
// );

Router.post(
  "/uploadBackup",
  validateToken,
  upload.single("backup"),
  uploadBackup
);

export default Router;
