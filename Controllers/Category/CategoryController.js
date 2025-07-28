import { CategoryModel } from "../../Models/Category/CategoryModel.js"; // adjust path
import expressAsyncHandler from "express-async-handler";
import { TransactionModel } from "../../Models/Transaction/TransactionsModel.js";
import mongoose from "mongoose";

// Create a new category
export const createCategory = expressAsyncHandler(async (req, res) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "User is not authorized" });
    }

    const { name, type, description } = req.body;

    // Check if category with same name, type exists for this user (unique constraint)
    const existingCategory = await CategoryModel.findOne({
      user: req.user.id,
      name,
      type,
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: "Category already exists for this user and type",
      });
    }

    const category = await CategoryModel.create({
      user: req.user.id,
      name,
      type,
      description,
    });

    res.status(201).json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update category by id
export const updateCategory = expressAsyncHandler(async (req, res) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "User is not authorized" });
    }

    const categoryId = req.params.id;
    const { name, type, description } = req.body;

    const category = await CategoryModel.findOne({
      _id: categoryId,
      user: req.user.id,
    });
    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }

    // Optional: Check if new name/type conflicts with another category
    if (name && type) {
      const duplicate = await CategoryModel.findOne({
        _id: { $ne: categoryId },
        user: req.user.id,
        name,
        type,
      });
      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: "Another category with same name and type exists",
        });
      }
    }

    // Detect if type is changing
    const oldType = category.type;

    category.name = name ?? category.name;
    category.type = type ?? category.type;
    category.description = description ?? category.description;

    await category.save();

    // Update transactions only if type changed
    if (type && type !== oldType) {
      const res = await TransactionModel.collection.updateMany(
        {
          category_id: new mongoose.Types.ObjectId(category._id),
          user: new mongoose.Types.ObjectId(req.user.id),
        },
        {
          $set: { type: type },
        }
      );
    }

    res.json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete category by id
export const deleteCategory = async (req, res) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "User is not authorized" });
    }

    const categoryId = req.params.id;

    const category = await CategoryModel.findOne({
      _id: categoryId,
      user: req.user.id,
    });

    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }

    // ❗ Check if the category is used in any transaction
    const isUsedInTransaction = await TransactionModel.exists({
      category_id: category._id,
    });

    if (isUsedInTransaction) {
      return res.status(400).json({
        success: false,
        message: "CategoryUsedInTransaction",
      });
    }

    // If not used, proceed to delete
    await category.deleteOne();

    res.json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all categories for logged-in user
export const getAllCategories = expressAsyncHandler(async (req, res) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "User is not authorized" });
    }

    const categories = await CategoryModel.find({ user: req.user.id }).sort({
      createdAt: -1,
    });

    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get category by id for logged-in user
export const getCategoryById = expressAsyncHandler(async (req, res) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "User is not authorized" });
    }

    const category = await CategoryModel.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }

    res.json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
