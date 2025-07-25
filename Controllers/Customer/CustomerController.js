import { CustomerModel } from "../../Models/Customer/CustomerModel.js";
import expressAsyncHandler from "express-async-handler";
import { SellInvoiceModel } from "../../Models/SellInvoices/SellInvoice/SellInvoiceModel.js";

// Create a new customer
export const createCustomer = expressAsyncHandler(async (req, res) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "User is not authorized" });
    }

    const { name, shopName, number, address, description } = req.body;

    // Check if a customer with the same name already exists for this user
    const existingCustomer = await CustomerModel.findOne({
      user: req.user.id,
      name,
    });

    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        message: "Customer with this name already exists for this user",
      });
    }

    const customer = await CustomerModel.create({
      user: req.user.id,
      name,
      shopName,
      number,
      address,
      description,
    });

    res.status(201).json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update a customer by ID
export const updateCustomer = expressAsyncHandler(async (req, res) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "User is not authorized" });
    }

    const customerId = req.params.id;
    const { name, shopName, number, address, description } = req.body;

    const customer = await CustomerModel.findOne({
      _id: customerId,
      user: req.user.id,
    });

    if (!customer) {
      return res
        .status(404)
        .json({ success: false, message: "Customer not found" });
    }

    // Check for duplicate name if name is changing
    if (name && name !== customer.name) {
      const duplicate = await CustomerModel.findOne({
        _id: { $ne: customerId },
        user: req.user.id,
        name,
      });

      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: "Another customer with the same name exists",
        });
      }
    }

    customer.name = name ?? customer.name;
    customer.shopName = shopName ?? customer.shopName;
    customer.number = number ?? customer.number;
    customer.address = address ?? customer.address;
    customer.description = description ?? customer.description;

    await customer.save();

    res.json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete a customer by ID
export const deleteCustomer = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User is not authorized",
      });
    }

    const customer = await CustomerModel.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // ❗ Check if customer is used in any sell invoice
    const isUsedInInvoice = await SellInvoiceModel.exists({
      customer: customer._id,
    });

    if (isUsedInInvoice) {
      return res.status(400).json({
        success: false,
        message: "CustomerUsedInInvoice",
      });
    }

    // Proceed with deletion
    await customer.deleteOne();

    res.json({
      success: true,
      message: "Customer deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all customers for the logged-in user
export const getAllCustomers = expressAsyncHandler(async (req, res) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "User is not authorized" });
    }

    const customers = await CustomerModel.find({ user: req.user.id }).sort({
      createdAt: -1,
    });

    res.json({ success: true, data: customers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get a single customer by ID for the logged-in user
export const getCustomerById = expressAsyncHandler(async (req, res) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "User is not authorized" });
    }

    const customer = await CustomerModel.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!customer) {
      return res
        .status(404)
        .json({ success: false, message: "Customer not found" });
    }

    res.json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
