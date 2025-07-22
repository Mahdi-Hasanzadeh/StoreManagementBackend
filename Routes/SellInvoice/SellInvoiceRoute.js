import express from "express";

import { validateToken } from "../../Middleware/validateToken.js";
import {
  createSellInvoice,
  getAllInvoices,
} from "../../Controllers/SellInvoice/SellInvoiceController.js";

const Router = express.Router();

//@desc POST api/saleInvoice

//private routes
Router.get("/getAll", validateToken, getAllInvoices);

Router.post("/create", validateToken, createSellInvoice);
// Router.put("/update/:id", validateToken, updateItem);
// Router.delete("/delete/:id", validateToken, deleteItem);
// Router.get("/:id", validateToken, getItemById);

export default Router;
