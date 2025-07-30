import asyncHandler from "express-async-handler";
import jwt from "jsonwebtoken";

export const validateToken = asyncHandler((req, res, next) => {
  let token;
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (authHeader && authHeader.startsWith("Bearer")) {
    token = authHeader.split(" ")[1];
    jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
      if (err) {
        res.status(401);
        throw new Error("User is not authorized");
      }
      const { user } = decoded;
      if (!user.validUntil || new Date() > new Date(user.validUntil)) {
        res.status(403);
        throw new Error("AccessExpired");
      }

      req.user = decoded.user;
      next();
    });
  }

  if (!token) {
    res.status(401);
    throw new Error("User is not authorized");
  }
});
