import { TransactionModel } from "../../Models/Transaction/TransactionsModel.js"; // adjust path
import expressAsyncHandler from "express-async-handler";

// Create a new transaction
export const createTransaction = expressAsyncHandler(async (req, res) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "User is not authorized" });
    }

    const { amount, type, description, date, categoryId } = req.body;

    const transaction = await TransactionModel.create({
      user: req.user.id,
      amount,
      type, // "income" or "expense"
      description,
      date,
      category_id: categoryId, // category _id
      createdAt: date,
      updatedAt: date,
    });

    res.status(201).json({ success: true, data: transaction });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update a transaction
export const updateTransaction = expressAsyncHandler(async (req, res) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "User is not authorized" });
    }

    const transactionId = req.params.id;
    const { amount, type, description, date, categoryId } = req.body;

    const transaction = await TransactionModel.findOne({
      _id: transactionId,
      user: req.user.id,
    });

    if (!transaction) {
      return res
        .status(404)
        .json({ success: false, message: "Transaction not found" });
    }

    transaction.amount = amount ?? transaction.amount;
    transaction.type = type ?? transaction.type;
    transaction.description = description ?? transaction.description;
    transaction.date = date ?? transaction.date;
    transaction.category_id = categoryId ?? transaction.category_id;

    await transaction.save();

    res.json({ success: true, data: transaction });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete a transaction
export const deleteTransaction = expressAsyncHandler(async (req, res) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "User is not authorized" });
    }

    const transaction = await TransactionModel.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!transaction) {
      return res
        .status(404)
        .json({ success: false, message: "Transaction not found" });
    }

    await transaction.deleteOne();

    res.json({ success: true, message: "Transaction deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all transactions
export const getAllTransactions = expressAsyncHandler(async (req, res) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "User is not authorized" });
    }

    const transactions = await TransactionModel.find({ user: req.user.id })
      .populate("category_id", "name type")
      .sort({ date: -1 });

    res.json({ success: true, data: transactions });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get transaction by ID
export const getTransactionById = expressAsyncHandler(async (req, res) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "User is not authorized" });
    }

    const transaction = await TransactionModel.findOne({
      _id: req.params.id,
      user: req.user.id,
    }).populate("category_id");

    if (!transaction) {
      return res
        .status(404)
        .json({ success: false, message: "Transaction not found" });
    }

    res.json({ success: true, data: transaction });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
