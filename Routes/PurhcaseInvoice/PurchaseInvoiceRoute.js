import express from "express";

import { validateToken } from "../../Middleware/validateToken.js";
import {
  createPurchaseInvoice,
  deletePurchaseInvoice,
  getAllPurchaseInvoices,
  getPurchaseInvoiceById,
  getPurchaseInvoiceDetailById,
  PaymentHistoryByPurchaseInvoiceId,
  payPurchaseRemaining,
  updatePurchaseInvoice,
} from "../../Controllers/PurchaseInvoice/PurchaseInvoiceController.js";

const Router = express.Router();

//@desc POST api/purchaseInvoice

//private routes
Router.get("/getAll", validateToken, getAllPurchaseInvoices);

Router.post("/create", validateToken, createPurchaseInvoice);
Router.get("/:id", validateToken, getPurchaseInvoiceById);
Router.put("/update/:id", validateToken, updatePurchaseInvoice);
Router.delete("/delete/:id", validateToken, deletePurchaseInvoice);
Router.post("/payRemaining", validateToken, payPurchaseRemaining);
Router.get(
  "/paymentHistory/:id",
  validateToken,
  PaymentHistoryByPurchaseInvoiceId
);
Router.get("/invoiceDetails/:id", validateToken, getPurchaseInvoiceDetailById);

export default Router;
