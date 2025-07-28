import mongoose from "mongoose";
import { TransactionModel } from "../../Models/Transaction/TransactionsModel.js";
import { PurchasePaymentModel } from "../../Models/PurchaseInvoices/PurchasePaymentModel.js";
import { PurchaseInvoiceModel } from "../../Models/PurchaseInvoices/PurchaseInvoiceModel.js";
import { CustomerPaymentModel } from "../../Models/SellInvoices/CustomerPayment/CustomerPayment.js";
import { SellInvoiceModel } from "../../Models/SellInvoices/SellInvoice/SellInvoiceModel.js";
import { getAfghanistanDateRange } from "../../Utils/DateConfig.js";
export const getDashboardData = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User is not authorized",
      });
    }

    const userId = req.user.id;

    const { startOfTodayUTC, startOfTomorrowUTC } = getAfghanistanDateRange();

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
      transactions,
      sellInvoices,
      buyInvoices,
    ] = await Promise.all([
      TransactionModel.aggregate([
        {
          $match: { user: new mongoose.Types.ObjectId(userId), type: "income" },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      CustomerPaymentModel.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(userId) } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      TransactionModel.aggregate([
        {
          $match: {
            user: new mongoose.Types.ObjectId(userId),
            type: "expense",
          },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      PurchasePaymentModel.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(userId) } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      TransactionModel.aggregate([
        {
          $match: {
            user: new mongoose.Types.ObjectId(userId),
            type: "income",
            createdAt: { $gte: startOfTodayUTC, $lt: startOfTomorrowUTC },
          },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      CustomerPaymentModel.aggregate([
        {
          $match: {
            user: new mongoose.Types.ObjectId(userId),
            createdAt: { $gte: startOfTodayUTC, $lt: startOfTomorrowUTC },
          },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      TransactionModel.aggregate([
        {
          $match: {
            user: new mongoose.Types.ObjectId(userId),
            type: "expense",
            createdAt: { $gte: startOfTodayUTC, $lt: startOfTomorrowUTC },
          },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      PurchasePaymentModel.aggregate([
        {
          $match: {
            user: new mongoose.Types.ObjectId(userId),
            createdAt: { $gte: startOfTodayUTC, $lt: startOfTomorrowUTC },
          },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      TransactionModel.find({ user: userId })
        .populate("category_id", "name")
        .sort({ createdAt: -1 })
        .limit(10),
      SellInvoiceModel.find({ user: userId })
        .populate("customer", "name phone createdAt")
        .sort({ createdAt: -1 })
        .limit(10),
      PurchaseInvoiceModel.find({ user: userId })
        .populate("supplier", "name phone createdAt")
        .sort({ createdAt: -1 })
        .limit(10),
    ]);

    // 🧮 Final calculations

    const totalIncome =
      (totalIncomeFromTransactions[0]?.total || 0) +
      (totalInvoicePaid[0]?.total || 0);

    console.log(
      totalIncomeFromTransactions[0]?.total,
      totalInvoicePaid[0]?.total
    );

    const totalExpense =
      (totalExpenseFromTransactions[0]?.total || 0) +
      (totalPurchaseInvoicePaid[0]?.total || 0);

    const balance = totalIncome - totalExpense;

    const todayIncome =
      (todayIncomeFromTransactions[0]?.total || 0) +
      (todayInvoicePaid[0]?.total || 0);

    console.log(
      todayIncomeFromTransactions[0]?.total,
      todayInvoicePaid[0]?.total
    );

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
