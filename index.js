import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";

import errorHandler from "./Middleware/errorHandler.js";
import userRouter from "./Routes/userRoute.js";
import CategoryRouter from "./Routes/Category/CategoryRoute.js";
import TransactionRouter from "./Routes/Transaction/TransactionRoute.js";
import CustomerRouter from "./Routes/Customer/CustomerRoute.js";
import ItemRouter from "./Routes/Item/ItemRoute.js";
import SellInvoiceRouter from "./Routes/SellInvoice/SellInvoiceRoute.js";
import authRoute from "./Routes/authRoute.js";
import SupplierRouter from "./Routes/Supplier/supplierRoute.js";
import PurchaseInvoiceRouter from "./Routes/PurhcaseInvoice/PurchaseInvoiceRoute.js";
dotenv.config();

const app = express();

const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://store-management-system-local.netlify.app",
  ],
  credentials: true,
  optionSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());

app.use("/api/auth", authRoute);
app.use("/api/user", userRouter);

app.use("/api/category", CategoryRouter);
app.use("/api/transaction", TransactionRouter);
app.use("/api/customer", CustomerRouter);
app.use("/api/item", ItemRouter);
app.use("/api/supplier", SupplierRouter);

//Invoices
app.use("/api/saleInvoice", SellInvoiceRouter);
app.use("/api/purchaseInvoice", PurchaseInvoiceRouter);

app.use(errorHandler);

export default app;
