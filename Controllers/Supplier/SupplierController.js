import { SupplierModel } from "../../Models/Supplier/SupplierModel.js";
import { SellInvoiceModel } from "../../Models/SellInvoices/SellInvoice/SellInvoiceModel.js";

// Create a new supplier
export const createSupplier = async (req, res) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "User is not authorized" });
    }

    const { name, phone, address, description } = req.body;

    const existingSupplier = await SupplierModel.findOne({
      user: req.user.id,
      name,
    });

    if (existingSupplier) {
      return res.status(400).json({
        success: false,
        message: "Supplier with this name already exists for this user",
      });
    }

    const supplier = await SupplierModel.create({
      user: req.user.id,
      name,
      phone,
      address,
      description,
    });

    res.status(201).json({ success: true, data: supplier });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update a supplier by ID
export const updateSupplier = async (req, res) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "User is not authorized" });
    }

    const supplierId = req.params.id;
    const { name, phone, address, description } = req.body;

    const supplier = await SupplierModel.findOne({
      _id: supplierId,
      user: req.user.id,
    });

    if (!supplier) {
      return res
        .status(404)
        .json({ success: false, message: "Supplier not found" });
    }

    if (name && name !== supplier.name) {
      const duplicate = await SupplierModel.findOne({
        _id: { $ne: supplierId },
        user: req.user.id,
        name,
      });

      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: "Another supplier with the same name exists",
        });
      }
    }

    supplier.name = name ?? supplier.name;
    supplier.phone = phone ?? supplier.phone;
    supplier.address = address ?? supplier.address;
    supplier.description = description ?? supplier.description;

    await supplier.save();

    res.json({ success: true, data: supplier });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete a supplier by ID
export const deleteSupplier = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User is not authorized",
      });
    }

    const supplier = await SupplierModel.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found",
      });
    }

    const isUsedInInvoice = await SellInvoiceModel.exists({
      supplier: supplier._id,
    });

    if (isUsedInInvoice) {
      return res.status(400).json({
        success: false,
        message: "SupplierUsedInInvoice",
      });
    }

    await supplier.deleteOne();

    res.json({
      success: true,
      message: "Supplier deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all suppliers for the logged-in user
export const getAllSuppliers = async (req, res) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "User is not authorized" });
    }

    const suppliers = await SupplierModel.find({ user: req.user.id }).sort({
      createdAt: -1,
    });

    res.json({ success: true, data: suppliers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get a single supplier by ID
export const getSupplierById = async (req, res) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "User is not authorized" });
    }

    const supplier = await SupplierModel.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!supplier) {
      return res
        .status(404)
        .json({ success: false, message: "Supplier not found" });
    }

    res.json({ success: true, data: supplier });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
