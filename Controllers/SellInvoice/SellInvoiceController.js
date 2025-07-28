import mongoose from "mongoose";
import { SellInvoiceModel } from "../../Models/SellInvoices/SellInvoice/SellInvoiceModel.js";
import { SellInvoiceItemModel } from "../../Models/SellInvoices/SellInvoiceItem/SellInvoiceItemModel.js";
import { CustomerPaymentModel } from "../../Models/SellInvoices/CustomerPayment/CustomerPayment.js";
import { CustomerModel } from "../../Models/Customer/CustomerModel.js";

// export const getAllInvoices = async (req, res) => {
//   try {
//     if (!req.user) {
//       return res
//         .status(401)
//         .json({ success: false, message: "User is not authorized" });
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
//     const invoices = await SellInvoiceModel.find(query)
//       .sort({ createdAt: -1 })
//       .populate({
//         path: "customer",
//         match: customerMatch, // Apply name filter here
//         select: "name phone", // Customize returned fields
//       })
//       .exec();

//     // Filter out invoices with null customer (if match failed)
//     const filteredInvoices = invoices.filter((i) => i.customer !== null);

//     res.status(200).json({ success: true, data: filteredInvoices });
//   } catch (error) {
//     console.error("Error fetching invoices:", error);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// };

export const getAllInvoices = async (req, res) => {
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
      const matchingCustomers = await CustomerModel.find({
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
    const totalInvoices = await SellInvoiceModel.countDocuments(query);

    // Fetch paginated invoices
    const invoices = await SellInvoiceModel.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("customer", "name")
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

export const createSellInvoice = async (req, res) => {
  if (!req.user) {
    return res
      .status(401)
      .json({ success: false, message: "User is not authorized" });
  }
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { customer_id, date, description, items, paid_amount, total } =
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
          createdAt: date,
          updatedAt: date,
        },
      ],
      { session }
    );

    // console.log(invoice);

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

    await SellInvoiceItemModel.insertMany(invoiceItems, { session });

    // 3. Create payment document (if paid_amount > 0)
    if (paid_amount > 0) {
      await CustomerPaymentModel.create(
        [
          {
            invoice: invoice[0]._id,
            amount: paid_amount,
            user: user_id,
            // description: "Initial payment",
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

export const getSellInvoiceById = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const userId = req.user.id;
    const invoiceId = req.params.id;

    // Fetch the invoice
    const invoice = await SellInvoiceModel.findOne({
      _id: invoiceId,
      user: userId,
    }).populate({
      path: "customer",
      select: "name phone",
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    // Fetch invoice items separately
    const items = await SellInvoiceItemModel.find({
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

export const updateSellInvoice = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const invoiceId = req.params.id;
    const { customer_id, date, description, total, items = [] } = req.body;
    console.log(req.body);

    if (!customer_id || !date || items.length === 0) {
      return res
        .status(400)
        .json({ message: "All required fields must be provided." });
    }

    // Start Transaction
    session.startTransaction();

    const invoice = await SellInvoiceModel.findById(invoiceId).session(session);
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
    const payments = await CustomerPaymentModel.find({
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
    invoice.customer = customer_id;
    invoice.date = date;
    invoice.description = description || "";
    invoice.total = total;
    invoice.paid_amount = totalPaid;
    invoice.remaining_amount = total - totalPaid;

    await invoice.save({ session });

    // Delete existing invoice items linked to this invoice
    await SellInvoiceItemModel.deleteMany(
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
    await SellInvoiceItemModel.insertMany(invoiceItems, { session });

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

export const deleteSellInvoice = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const invoiceId = req.params.id;
    const userId = req.user.id;

    session.startTransaction();

    // Find invoice with user check
    const invoice = await SellInvoiceModel.findOne({
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
    await SellInvoiceItemModel.deleteMany({
      invoice: invoiceId,
      user: userId,
    }).session(session);

    // Delete related payments
    await CustomerPaymentModel.deleteMany({
      invoice: invoiceId,
      user: userId,
    }).session(session);

    // Delete the invoice itself
    await SellInvoiceModel.deleteOne({ _id: invoiceId, user: userId }).session(
      session
    );

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

export const payRemaining = async (req, res) => {
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
    const invoice = await SellInvoiceModel.findById(invoice_id).session(
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
    const payments = await CustomerPaymentModel.find({
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
    await CustomerPaymentModel.create(
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

export const PaymentHistoryByInvoiceId = async (req, res) => {
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
    const payments = await CustomerPaymentModel.find({
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

export const getInvoiceDetailById = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const userId = req.user.id;
    const invoiceId = req.params.id;

    // Get invoice with customer
    const invoice = await SellInvoiceModel.findOne({
      _id: invoiceId,
      user: userId,
    }).populate({
      path: "customer",
      select: "name phone",
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    // Get invoice items with product details
    const items = await SellInvoiceItemModel.find({
      invoice: invoice._id,
      user: userId,
    }).populate({
      path: "item",
      select: "name unit_price",
    });

    // Get payments made on this invoice
    const payments = await CustomerPaymentModel.find({
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
