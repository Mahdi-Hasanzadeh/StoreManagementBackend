import express from "express";

import { validateToken } from "../../Middleware/validateToken.js";
import {
  createCustomer,
  deleteCustomer,
  getAllCustomers,
  getCustomerById,
  searchCustomers,
  updateCustomer,
} from "../../Controllers/Customer/CustomerController.js";

const Router = express.Router();

//@desc POST api/category

//private routes
Router.get("/search", validateToken, searchCustomers);
Router.post("/create/", validateToken, createCustomer);
Router.put("/update/:id", validateToken, updateCustomer);
Router.delete("/delete/:id", validateToken, deleteCustomer);
Router.get("/getAll", validateToken, getAllCustomers);
Router.get("/:id", validateToken, getCustomerById);

export default Router;
