import mongoose from "mongoose";
import { SellInvoiceModel } from "../../Models/SellInvoices/SellInvoice/SellInvoiceModel.js";
import { SellInvoiceItemModel } from "../../Models/SellInvoices/SellInvoiceItem/SellInvoiceItemModel.js";
import { CustomerPaymentModel } from "../../Models/SellInvoices/CustomerPayment/CustomerPayment.js";
export const getAllInvoices = async (req, res) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "User is not authorized" });
    }
    const userId = req.user.id; // Authenticated user

    // Base query
    const query = { user: userId };

    // Filter: by invoice _id
    if (req.query.invoice_id) {
      query._id = req.query.invoice_id;
    }

    // Filter: by customer name (join via $lookup)
    let customerMatch = {};
    if (req.query.customer_name) {
      customerMatch = {
        name: { $regex: req.query.customer_name, $options: "i" },
      };
    }

    // Filter: remaining > 0
    if (req.query.only_remaining === "true") {
      query.remaining_amount = { $gt: 0 };
    }

    // Fetch invoices with customer populated, sorted by date
    const invoices = await SellInvoiceModel.find(query)
      .sort({ date: -1 })
      .populate({
        path: "customer",
        match: customerMatch, // Apply name filter here
        select: "name phone", // Customize returned fields
      })
      .exec();

    // Filter out invoices with null customer (if match failed)
    const filteredInvoices = invoices.filter((i) => i.customer !== null);

    res.status(200).json({ success: true, data: filteredInvoices });
  } catch (error) {
    console.error("Error fetching invoices:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const createSellInvoice = async (req, res) => {
  if (!req.user) {
    return res
      .status(401)
      .json({ success: false, message: "User is not authorized" });
  }
  console.log(req.user);
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { customer_id, date, description, items, paid_amount } = req.body;
    const user_id = req.user.id;

    // Validate minimal fields (you can do more validations if you want)
    if (
      !customer_id ||
      !date ||
      !items ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      throw new Error("Missing required fields or empty items");
    }

    // Calculate total
    let total = 0;
    for (const item of items) {
      const qty = Number(item.quantity);
      const price = Number(item.unit_price);
      if (qty <= 0) throw new Error("Quantity must be greater than zero");
      if (price < 0) throw new Error("Unit price must be zero or greater");
      total += qty * price;
    }

    if (paid_amount > total) {
      throw new Error("Paid amount cannot exceed total");
    }

    const remaining_amount = total - paid_amount;

    // 1. Create the invoice document
    const invoice = await SellInvoiceModel.create(
      [
        {
          customer: customer_id,
          total,
          paid_amount,
          remaining_amount,
          date,
          description: description || "",
          user: user_id,
        },
      ],
      { session }
    );

    // 2. Create invoice items documents
    const invoiceItems = items.map((item) => ({
      invoice: invoice[0]._id,
      item: item.item_id,
      quantity: Number(item.quantity),
      unit_price: Number(item.unit_price),
      total: Number(item.quantity) * Number(item.unit_price),
      description: item.description || "",
      user: user_id,
    }));

    await SellInvoiceItemModel.insertMany(invoiceItems, { session });

    // 3. Create payment document (if paid_amount > 0)
    if (paid_amount > 0) {
      await CustomerPaymentModel.create(
        [
          {
            invoice: invoice[0]._id,
            amount: paid_amount,
            user: user_id,
            description: "Initial payment",
          },
        ],
        { session }
      );
    }

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: "Invoice created successfully",
      invoice: invoice[0],
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error(error);
    res.status(400).json({
      success: false,
      message: error.message || "Error creating invoice",
    });
  }
};
