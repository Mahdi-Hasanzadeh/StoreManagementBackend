import express from "express";

import { validateToken } from "../../Middleware/validateToken.js";
import {
  createSupplier,
  deleteSupplier,
  getAllSuppliers,
  getSupplierById,
  searchSuppliers,
  updateSupplier,
} from "../../Controllers/Supplier/SupplierController.js";

const Router = express.Router();

//@desc POST api/supplier

//private routes
Router.get("/search", validateToken, searchSuppliers);
Router.post("/create/", validateToken, createSupplier);
Router.put("/update/:id", validateToken, updateSupplier);
Router.delete("/delete/:id", validateToken, deleteSupplier);
Router.get("/getAll", validateToken, getAllSuppliers);
Router.get("/:id", validateToken, getSupplierById);

export default Router;
