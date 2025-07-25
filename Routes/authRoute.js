import express from "express";

import { validateToken } from "../Middleware/validateToken.js";
import { authValidator } from "../Controllers/Auth/AuthController.js";

const Router = express.Router();

//@desc POST api/auth/validate

//private route
Router.get("/validate", validateToken, authValidator);

export default Router;
