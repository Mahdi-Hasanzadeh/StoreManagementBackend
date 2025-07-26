import express from "express";

import { validateToken } from "../../Middleware/validateToken.js";

import { getDashboardData } from "../../Controllers/Dashboard/DashboardController.js";

const Router = express.Router();

//@desc POST api/dashboard

//private routes
Router.get("/", validateToken, getDashboardData);

export default Router;
