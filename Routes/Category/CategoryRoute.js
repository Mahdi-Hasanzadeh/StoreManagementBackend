import express from "express";

import { validateToken } from "../../Middleware/validateToken.js";
import {
  createCategory,
  deleteCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
} from "../../Controllers/Category/CategoryController.js";

const Router = express.Router();

//@desc POST api/category

//private routes
Router.post("/create/", validateToken, createCategory);
Router.put("/update/:id", validateToken, updateCategory);
Router.delete("/delete/:id", validateToken, deleteCategory);
Router.get("/getAll", validateToken, getAllCategories);
Router.get("/:id", validateToken, getCategoryById);

export default Router;
