import express from "express";

import { validateToken } from "../../Middleware/validateToken.js";
import {
  createSellInvoice,
  deleteSellInvoice,
  getAllInvoices,
  getInvoiceDetailById,
  getSellInvoiceById,
  PaymentHistoryByInvoiceId,
  payRemaining,
  updateSellInvoice,
} from "../../Controllers/SellInvoice/SellInvoiceController.js";

const Router = express.Router();

//@desc POST api/saleInvoice

//private routes
Router.get("/getAll", validateToken, getAllInvoices);

Router.post("/create", validateToken, createSellInvoice);
Router.get("/:id", validateToken, getSellInvoiceById);
Router.put("/update/:id", validateToken, updateSellInvoice);
Router.delete("/delete/:id", validateToken, deleteSellInvoice);
Router.post("/payRemaining", validateToken, payRemaining);
Router.get("/paymentHistory/:id", validateToken, PaymentHistoryByInvoiceId);
Router.get("/invoiceDetails/:id", validateToken, getInvoiceDetailById);

export default Router;
