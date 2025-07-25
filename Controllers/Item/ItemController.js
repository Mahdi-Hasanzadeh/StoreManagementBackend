import { ItemModel } from "../../Models/Item/ItemModel.js";
import expressAsyncHandler from "express-async-handler";
import { SellInvoiceItemModel } from "../../Models/SellInvoices/SellInvoiceItem/SellInvoiceItemModel.js";

// Create a new item
export const createItem = expressAsyncHandler(async (req, res) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "User is not authorized" });
    }

    const { name, last_price } = req.body;

    // Check if item with the same name exists for this user
    const existingItem = await ItemModel.findOne({
      user: req.user.id,
      name,
    });

    if (existingItem) {
      return res.status(400).json({
        success: false,
        message: "Item with this name already exists for this user",
      });
    }

    const item = await ItemModel.create({
      user: req.user.id,
      name,
      last_price,
    });

    res.status(201).json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update an item by ID
export const updateItem = expressAsyncHandler(async (req, res) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "User is not authorized" });
    }

    const itemId = req.params.id;
    const { name, last_price } = req.body;

    const item = await ItemModel.findOne({
      _id: itemId,
      user: req.user.id,
    });

    if (!item) {
      return res
        .status(404)
        .json({ success: false, message: "Item not found" });
    }

    // Check for duplicate name if name is changing
    if (name && name !== item.name) {
      const duplicate = await ItemModel.findOne({
        _id: { $ne: itemId },
        user: req.user.id,
        name,
      });

      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: "Another item with the same name exists",
        });
      }
    }

    item.name = name ?? item.name;
    item.last_price = last_price ?? item.last_price;

    await item.save();

    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete an item by ID

export const deleteItem = expressAsyncHandler(async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User is not authorized",
      });
    }

    const item = await ItemModel.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    // ❗ Check if this item is used in any invoice
    const isUsedInInvoice = await SellInvoiceItemModel.exists({
      item: item._id,
    });

    if (isUsedInInvoice) {
      return res.status(400).json({
        success: false,
        message: "ItemUsedInInvoice",
      });
    }

    // If not used, proceed to delete
    await item.deleteOne();

    res.json({
      success: true,
      message: "Item deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Get all items for the logged-in user
export const getAllItems = expressAsyncHandler(async (req, res) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "User is not authorized" });
    }

    const items = await ItemModel.find({ user: req.user.id }).sort({
      createdAt: -1,
    });

    res.json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get a single item by ID for the logged-in user
export const getItemById = expressAsyncHandler(async (req, res) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "User is not authorized" });
    }

    const item = await ItemModel.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!item) {
      return res
        .status(404)
        .json({ success: false, message: "Item not found" });
    }

    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
