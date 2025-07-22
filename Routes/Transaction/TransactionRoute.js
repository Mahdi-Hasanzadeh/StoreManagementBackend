import express from "express";

import { validateToken } from "../../Middleware/validateToken.js";

import {
  createTransaction,
  deleteTransaction,
  getAllTransactions,
  getTransactionById,
  updateTransaction,
} from "../../Controllers/Transaction/TransactionController.js";

const Router = express.Router();

//@desc POST api/category

//private routes
Router.post("/create/", validateToken, createTransaction);
Router.put("/update/:id", validateToken, updateTransaction);
Router.delete("/delete/:id", validateToken, deleteTransaction);
Router.get("/getAll", validateToken, getAllTransactions);
Router.get("/:id", validateToken, getTransactionById);

export default Router;
