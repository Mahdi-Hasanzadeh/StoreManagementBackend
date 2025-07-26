import mongoose from "mongoose";
import { TransactionModel } from "../../Models/Transaction/TransactionsModel.js";
import { PurchasePaymentModel } from "../../Models/PurchaseInvoices/PurchasePaymentModel.js";
import { PurchaseInvoiceModel } from "../../Models/PurchaseInvoices/PurchaseInvoiceModel.js";
import { CustomerPaymentModel } from "../../Models/SellInvoices/CustomerPayment/CustomerPayment.js";
import { SellInvoiceModel } from "../../Models/SellInvoices/SellInvoice/SellInvoiceModel.js";

export const getDashboardData = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User is not authorized",
      });
    }

    const userId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Get local start of today
    const localStartOfToday = new Date();
    localStartOfToday.setHours(0, 0, 0, 0);

    // 2. Get local start of tomorrow
    const localStartOfTomorrow = new Date(localStartOfToday);
    localStartOfTomorrow.setDate(localStartOfTomorrow.getDate() + 1);

    // 3. Convert local times to UTC (MongoDB stored dates are UTC)
    const startOfTodayUTC = new Date(
      localStartOfToday.getTime() -
        localStartOfToday.getTimezoneOffset() * 60000
    );
    const startOfTomorrowUTC = new Date(
      localStartOfTomorrow.getTime() -
        localStartOfTomorrow.getTimezoneOffset() * 60000
    );

    const result = await CustomerPaymentModel.aggregate([
      {
        $match: {
          user: userId,
          createdAt: {
            $gte: startOfTodayUTC,
            $lt: startOfTomorrowUTC,
          },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);
    console.log(result);

    // 🏃‍♂️ Run all queries in parallel
    const [
      totalIncomeFromTransactions,
      totalInvoicePaid,
      totalExpenseFromTransactions,
      totalPurchaseInvoicePaid,
      todayIncomeFromTransactions,
      todayInvoicePaid,
      todayExpenseFromTransactions,
      todayPurchaseInvoicePaid,
      incomeData,
      expenseData,
      transactions,
      sellInvoices,
      buyInvoices,
    ] = await Promise.all([
      TransactionModel.aggregate([
        { $match: { user: userId, type: "income" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      CustomerPaymentModel.aggregate([
        { $match: { user: userId } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      TransactionModel.aggregate([
        { $match: { user: userId, type: "expense" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      PurchasePaymentModel.aggregate([
        { $match: { user: userId } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      TransactionModel.aggregate([
        {
          $match: {
            user: userId,
            type: "income",
            createdAt: { $gte: today },
          },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      CustomerPaymentModel.aggregate([
        {
          $match: {
            user: userId,
            createdAt: { $gte: today },
          },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      TransactionModel.aggregate([
        {
          $match: {
            user: userId,
            type: "expense",
            createdAt: { $gte: today },
          },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      PurchasePaymentModel.aggregate([
        {
          $match: {
            user: userId,
            createdAt: { $gte: today },
          },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      TransactionModel.aggregate([
        { $match: { user: userId, type: "income" } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            total: { $sum: "$amount" },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      TransactionModel.aggregate([
        { $match: { user: userId, type: "expense" } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            total: { $sum: "$amount" },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      TransactionModel.find({ user: userId }).sort({ updatedAt: -1 }).limit(10),
      SellInvoiceModel.find({ user: userId })
        .populate("customer")
        .sort({ createdAt: -1 })
        .limit(10),
      PurchaseInvoiceModel.find({ user: userId })
        .populate("supplier")
        .sort({ createdAt: -1 })
        .limit(10),
    ]);

    console.log(
      totalIncomeFromTransactions,
      totalInvoicePaid,
      totalExpenseFromTransactions,
      totalPurchaseInvoicePaid
    );
    // 🧮 Final calculations
    const totalIncome =
      (totalIncomeFromTransactions[0]?.total || 0) +
      (totalInvoicePaid[0]?.total || 0);

    const totalExpense =
      (totalExpenseFromTransactions[0]?.total || 0) +
      (totalPurchaseInvoicePaid[0]?.total || 0);

    const balance = totalIncome - totalExpense;

    const todayIncome =
      (todayIncomeFromTransactions[0]?.total || 0) +
      (todayInvoicePaid[0]?.total || 0);

    const todayExpense =
      (todayExpenseFromTransactions[0]?.total || 0) +
      (todayPurchaseInvoicePaid[0]?.total || 0);

    const todayBalance = todayIncome - todayExpense;

    // 📦 Send response
    res.status(200).json({
      message: "Data loaded Successfully",
      data: {
        totalIncome,
        totalExpense,
        balance,
        todayIncome,
        todayExpense,
        todayBalance,
        //   incomeData,
        //   expenseData,
        transactions,
        sellInvoices,
        buyInvoices,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
