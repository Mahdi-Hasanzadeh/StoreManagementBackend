import express from "express";

import { validateToken } from "../../Middleware/validateToken.js";

import {
  getDashboardData,
  getReport,
} from "../../Controllers/Dashboard/DashboardController.js";

const Router = express.Router();

//@desc POST api/dashboard

//private routes
Router.get("/", validateToken, getDashboardData);
Router.post("/report", validateToken, getReport);

export default Router;
