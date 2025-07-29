import { PurchaseInvoiceModel } from "../../Models/PurchaseInvoices/PurchaseInvoiceModel.js";
import { PurchaseInvoiceItemModel } from "../../Models/PurchaseInvoices/PurchaseInvoiceItemModel.js";
import { PurchasePaymentModel } from "../../Models/PurchaseInvoices/PurchasePaymentModel.js";
import { PurchaseItemModel } from "../../Models/Item/PurchaseItemModel.js";
import { ItemModel } from "../../Models/Item/ItemModel.js";
import { SupplierModel } from "../../Models/Supplier/SupplierModel.js";
import mongoose from "mongoose";

// export const getAllPurchaseInvoices = async (req, res) => {
//   try {
//     if (!req.user) {
//       return res.status(401).json({ success: false, message: "Authorized" });
//     }
//     const userId = req.user.id; // Authenticated user

//     // Base query
//     const query = { user: userId };

//     // Filter: by invoice _id
//     if (req.query.invoice_id) {
//       query._id = req.query.invoice_id;
//     }

//     // Filter: by customer name (join via $lookup)
//     let customerMatch = {};
//     if (req.query.customer_name) {
//       customerMatch = {
//         name: { $regex: req.query.customer_name, $options: "i" },
//       };
//     }

//     // Filter: remaining > 0
//     if (req.query.only_remaining === "true") {
//       query.remaining_amount = { $gt: 0 };
//     }

//     // Fetch invoices with customer populated, sorted by date
//     const invoices = await PurchaseInvoiceModel.find(query)
//       .sort({ createdAt: -1 })
//       .populate({
//         path: "supplier",
//         match: customerMatch, // Apply name filter here
//         select: "name phone", // Customize returned fields
//       })
//       .exec();

//     // Filter out invoices with null customer (if match failed)
//     const filteredInvoices = invoices.filter((i) => i.supplier !== null);

//     res.status(200).json({ success: true, data: filteredInvoices });
//   } catch (error) {
//     console.error("Error fetching invoices:", error);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// };

export const getAllPurchaseInvoices = async (req, res) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "User is not authorized" });
    }

    const userId = req.user.id;
    const query = { user: userId };

    // Filter: invoice ID
    if (req.query.invoice_id) {
      query._id = req.query.invoice_id;
    }

    // Filter: remaining amount > 0
    if (req.query.only_remaining === "true") {
      query.remaining_amount = { $gt: 0 };
    }

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Filter by customer name
    if (req.query.customer_name) {
      const matchingCustomers = await SupplierModel.find({
        user: userId,
        name: { $regex: req.query.customer_name, $options: "i" },
      }).select("_id");

      const customerIds = matchingCustomers.map((c) => c._id);
      if (customerIds.length === 0) {
        return res.status(200).json({
          success: true,
          data: [],
          total: 0,
        });
      }

      query.customer = { $in: customerIds };
    }

    // Count total invoices matching query
    const totalInvoices = await PurchaseInvoiceModel.countDocuments(query);

    // Fetch paginated invoices
    const invoices = await PurchaseInvoiceModel.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("supplier", "name")
      .exec();

    res.status(200).json({
      success: true,
      data: invoices,
      total: totalInvoices,
    });
  } catch (error) {
    console.error("Error fetching invoices:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const createPurchaseInvoice = async (req, res) => {
  if (!req.user) {
    return res
      .status(401)
      .json({ success: false, message: "User is not authorized" });
  }
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { customer_id, date, description, items, total, paid_amount } =
      req.body;
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
    // let total = 0;
    // for (const item of items) {
    //   const qty = Number(item.quantity);
    //   const price = Number(item.unit_price);
    //   if (qty <= 0) throw new Error("Quantity must be greater than zero");
    //   if (price < 0) throw new Error("Unit price must be zero or greater");
    //   total += qty * price;
    // }

    if (paid_amount > total) {
      throw new Error("Paid amount cannot exceed total");
    }

    const remaining_amount = total - paid_amount;

    // 1. Create the invoice document
    const invoice = await PurchaseInvoiceModel.create(
      [
        {
          supplier: customer_id,
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
      // total: Number(item.quantity) * Number(item.unit_price),
      total: item.total,
      description: item.description || "",
      user: user_id,
    }));

    // Store the items in Purchase Invoice Item table
    await PurchaseInvoiceItemModel.insertMany(invoiceItems, { session });

    // Store the items in Purchase Item table that act as Inventory
    await PurchaseItemModel.insertMany(invoiceItems, { session });

    // Update last_price in ItemModel
    await Promise.all(
      items.map((item) =>
        ItemModel.findOneAndUpdate(
          { _id: item.item_id, user: user_id },
          { $set: { last_price: Number(item.unit_price) } },
          { session, new: true }
        )
      )
    );

    // Create payment document (if paid_amount > 0)
    if (paid_amount > 0) {
      await PurchasePaymentModel.create(
        [
          {
            invoice: invoice[0]._id,
            amount: paid_amount,
            user: user_id,
            // description: "",
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

export const getPurchaseInvoiceById = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const userId = req.user.id;
    const invoiceId = req.params.id;

    // Fetch the invoice
    const invoice = await PurchaseInvoiceModel.findOne({
      _id: invoiceId,
      user: userId,
    }).populate({
      path: "supplier",
      select: "name phone",
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    // Fetch invoice items separately
    const items = await PurchaseInvoiceItemModel.find({
      invoice: invoice._id,
      user: userId,
    }).populate({
      path: "item",
      select: "name unit_price",
    });

    res.status(200).json({
      success: true,
      data: {
        invoice,
        items,
      },
    });
  } catch (error) {
    console.error("Error fetching invoice by ID:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const updatePurchaseInvoice = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const user_id = req.user.id;
    const invoiceId = req.params.id;
    const { customer_id, date, description, total, items = [] } = req.body;

    if (!customer_id || !date || items.length === 0) {
      return res
        .status(400)
        .json({ message: "All required fields must be provided." });
    }

    // Start Transaction
    session.startTransaction();

    const invoice = await PurchaseInvoiceModel.findById(invoiceId).session(
      session
    );
    if (!invoice) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Invoice not found." });
    }

    // Calculate new total
    // const total = items.reduce((sum, item) => {
    //   if (!item.item_id || !item.quantity || !item.unit_price) {
    //     throw new Error("Invalid item in the list.");
    //   }
    //   return sum + item.quantity * item.unit_price;
    // }, 0);

    // Get total paid from CustomerPayment
    const payments = await PurchasePaymentModel.find({
      invoice: invoiceId,
    }).session(session);

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

    if (total < totalPaid) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        message: `Total (${total}) cannot be less than already paid (${totalPaid})`,
      });
    }

    // Update invoice fields
    invoice.supplier = customer_id;
    invoice.date = date;
    invoice.description = description || "";
    invoice.total = total;
    invoice.paid_amount = totalPaid;
    invoice.remaining_amount = total - totalPaid;

    await invoice.save({ session });

    // Delete existing invoice items linked to this invoice
    await PurchaseInvoiceItemModel.deleteMany(
      { invoice: invoiceId, user: req.user.id },
      { session }
    );

    await PurchaseItemModel.deleteMany(
      { invoice: invoiceId, user: req.user.id },
      { session }
    );

    // Prepare new invoice items array
    const invoiceItems = items.map((item) => ({
      invoice: invoiceId,
      item: item.item_id,
      quantity: Number(item.quantity),
      unit_price: Number(item.unit_price),
      // total: Number(item.quantity) * Number(item.unit_price),
      total: item.total,
      description: item.description || "",
      user: req.user.id,
    }));

    // Insert new items
    await PurchaseInvoiceItemModel.insertMany(invoiceItems, { session });

    await PurchaseItemModel.insertMany(invoiceItems, { session });

    // Update last_price in ItemModel
    await Promise.all(
      items.map((item) =>
        ItemModel.findOneAndUpdate(
          { _id: item.item_id, user: user_id },
          { $set: { last_price: Number(item.unit_price) } },
          { session, new: true }
        )
      )
    );

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      message: "Invoice updated successfully",
      invoice,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Update Sell Invoice Error:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

export const deletePurchaseInvoice = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const invoiceId = req.params.id;
    const userId = req.user.id;

    session.startTransaction();

    // Find invoice with user check
    const invoice = await PurchaseInvoiceModel.findOne({
      _id: invoiceId,
      user: userId,
    }).session(session);
    if (!invoice) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(404)
        .json({ success: false, message: "Invoice not found" });
    }

    // Delete related invoice items
    await PurchaseInvoiceItemModel.deleteMany({
      invoice: invoiceId,
      user: userId,
    }).session(session);

    await PurchaseItemModel.deleteMany({
      invoice: invoiceId,
      user: userId,
    }).session(session);

    // Delete related payments
    await PurchasePaymentModel.deleteMany({
      invoice: invoiceId,
      user: userId,
    }).session(session);

    // Delete the invoice itself
    await PurchaseInvoiceModel.deleteOne({
      _id: invoiceId,
      user: userId,
    }).session(session);

    await session.commitTransaction();
    session.endSession();

    res
      .status(200)
      .json({ success: true, message: "Invoice deleted successfully" });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Delete invoice error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete invoice",
      error: error.message,
    });
  }
};

export const payPurchaseRemaining = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { invoice_id, pay_amount, description } = req.body;

    // Basic validation
    if (!invoice_id) {
      return res
        .status(400)
        .json({ success: false, message: "InvoiceIdRequired" });
    }
    if (typeof pay_amount !== "number" || pay_amount === 0) {
      return res.status(400).json({
        success: false,
        message: "PayAmountNonZero",
      });
    }

    // Find invoice
    const invoice = await PurchaseInvoiceModel.findById(invoice_id).session(
      session
    );
    if (!invoice) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(404)
        .json({ success: false, message: "InvoiceNotFound" });
    }

    // Sum total paid so far from payments collection
    const payments = await PurchasePaymentModel.find({
      invoice: invoice_id,
    }).session(session);

    const paidSoFar = payments.reduce((sum, p) => sum + p.amount, 0);

    const newPaid = paidSoFar + pay_amount;

    // Prevent overpayment
    if (newPaid > invoice.total) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: "PaymentExceedsRemaining",
      });
    }

    // Prevent refund exceeding total paid amount
    if (newPaid < 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: "RefundExceedsPaidAmount",
      });
    }

    // Save the payment (positive or negative)
    await PurchasePaymentModel.create(
      [
        {
          invoice: invoice_id,
          amount: pay_amount,
          description: description || "",
          user: req.user.id,
        },
      ],
      { session }
    );

    // Update invoice summary fields
    invoice.paid_amount = newPaid;
    invoice.remaining_amount = invoice.total - newPaid;

    await invoice.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res
      .status(200)
      .json({ success: true, message: "Payment added successfully", invoice });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Pay Remaining Error:", error);
    return res.status(500).json({
      success: false,
      message: "PaymentFailed",
      error: error.message,
    });
  }
};

export const PaymentHistoryByPurchaseInvoiceId = async (req, res) => {
  try {
    // Check authentication
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const invoiceId = req.params.id;

    if (!invoiceId) {
      return res
        .status(400)
        .json({ success: false, message: "InvoiceIdRequired" });
    }

    // Fetch payments related to the invoice
    const payments = await PurchasePaymentModel.find({
      invoice: invoiceId,
    }).sort({ date: -1 }); // Optional: show latest first

    return res.status(200).json({
      success: true,
      data: payments,
    });
  } catch (error) {
    console.error("Error fetching payment history:", error);
    return res.status(500).json({
      success: false,
      message: "SomethingWentWrong",
    });
  }
};

export const getPurchaseInvoiceDetailById = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const userId = req.user.id;
    const invoiceId = req.params.id;

    // Get invoice with customer
    const invoice = await PurchaseInvoiceModel.findOne({
      _id: invoiceId,
      user: userId,
    }).populate({
      path: "supplier",
      select: "name phone",
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    // Get invoice items with product details
    const items = await PurchaseInvoiceItemModel.find({
      invoice: invoice._id,
      user: userId,
    }).populate({
      path: "item",
      select: "name unit_price",
    });

    // Get payments made on this invoice
    const payments = await PurchasePaymentModel.find({
      invoice: invoice._id,
      user: userId,
    }).sort({ date: -1 });

    // Calculate total paid
    const totalPaid = payments.reduce(
      (sum, payment) => sum + payment.amount,
      0
    );

    // Calculate balance
    const balance = invoice.total_amount - totalPaid;

    res.status(200).json({
      success: true,
      data: {
        invoice,
        items,
        payments,
        totalPaid,
        balance,
      },
    });
  } catch (error) {
    console.error("Error fetching invoice detail:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const getUnpaidPurchaseInvoices = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const userId = req.user.id;
    const { customerId } = req.params;

    // console.log(customerId);

    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: "customerId is required",
      });
    }

    const unpaidInvoices = await PurchaseInvoiceModel.find({
      user: userId,
      supplier: customerId,
      remaining_amount: { $gt: 0 },
    })
      .select("remaining_amount supplier")
      .populate({
        path: "supplier",
        select: "name",
      });

    const totalRemainingAmount = unpaidInvoices.reduce(
      (sum, invoice) => sum + invoice.remaining_amount,
      0
    );

    res.status(200).json({
      success: true,
      data: {
        // invoices: unpaidInvoices,
        totalUnpaidCount: unpaidInvoices.length,
        totalRemainingAmount,
      },
    });
  } catch (error) {
    console.error("Error fetching unpaid invoices:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const payRemainingPurchaseForAll = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const userId = req.user.id;
    const { customer_id, pay_amount, description } = req.body;

    if (!customer_id) {
      return res
        .status(400)
        .json({ success: false, message: "CustomerIdRequired" });
    }

    if (typeof pay_amount !== "number" || pay_amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "PayAmountNonZero",
      });
    }

    let remainingToPay = pay_amount;

    // Get all unpaid invoices for this customer sorted oldest to newest
    const invoices = await PurchaseInvoiceModel.find({
      user: userId,
      supplier: customer_id,
      remaining_amount: { $gt: 0 },
    })
      .sort({ createdAt: 1 }) // Oldest first
      .session(session);

    // 👉 Calculate the total remaining across all invoices
    const totalRemaining = invoices.reduce(
      (sum, invoice) => sum + invoice.remaining_amount,
      0
    );

    // 👉 Validate
    if (pay_amount > totalRemaining) {
      await session.abortTransaction();
      return res.status(400).json({
        message:
          "Paid amount cannot exceed the customer's total remaining debt",
      });
    }

    const paymentsToInsert = [];

    for (const invoice of invoices) {
      if (remainingToPay <= 0) break;

      const remaining = invoice.remaining_amount;
      const amountToPay = Math.min(remaining, remainingToPay);

      // Prepare payment entry
      paymentsToInsert.push({
        invoice: invoice._id,
        amount: amountToPay,
        description: description || "",
        user: req.user.id,
      });

      // Update invoice
      invoice.paid_amount += amountToPay;
      invoice.remaining_amount -= amountToPay;
      await invoice.save({ session });

      remainingToPay -= amountToPay;
    }

    if (paymentsToInsert.length > 0) {
      await PurchasePaymentModel.insertMany(paymentsToInsert, { session });
    }

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      success: true,
      message: "Payments applied successfully",
      remainingUnpaid: remainingToPay,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Batch Pay Error:", error);
    return res.status(500).json({
      success: false,
      message: "PaymentFailed",
      error: error.message,
    });
  }
};
