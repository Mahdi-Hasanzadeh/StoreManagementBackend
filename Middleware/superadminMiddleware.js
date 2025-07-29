// middleware/authorizeSuperAdmin.js
import asyncHandler from "express-async-handler";

export const authorizeSuperAdmin = asyncHandler((req, res, next) => {
  if (!req.user || req.user.role !== "superadmin") {
    res.status(403);
    throw new Error("Access denied: Superadmin only");
  }

  next();
});
