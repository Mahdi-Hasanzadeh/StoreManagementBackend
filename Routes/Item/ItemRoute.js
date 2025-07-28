import express from "express";

import { validateToken } from "../../Middleware/validateToken.js";

import {
  createItem,
  deleteItem,
  getAllItems,
  getItemById,
  searchItems,
  updateItem,
} from "../../Controllers/Item/ItemController.js";

const Router = express.Router();

//@desc POST api/category

//private routes
Router.get("/search", validateToken, searchItems);
Router.post("/create/", validateToken, createItem);
Router.put("/update/:id", validateToken, updateItem);
Router.delete("/delete/:id", validateToken, deleteItem);
Router.get("/getAll", validateToken, getAllItems);
Router.get("/:id", validateToken, getItemById);

export default Router;
