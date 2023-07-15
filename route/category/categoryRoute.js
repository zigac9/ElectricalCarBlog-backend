const express = require("express");
const authMiddleware = require("../../middlewares/auth/authMiddleware");
const categoryRoute = express.Router();

const {
  createCategoryController,
  fetchAllCategoriesController,
  fetchCategoryController,
  updateCategoryController,
  deleteCategoryController,
} = require("../../controllers/category/categoryController");

categoryRoute.post("/", authMiddleware, createCategoryController);
categoryRoute.get("/", fetchAllCategoriesController);
categoryRoute.get("/:id", authMiddleware, fetchCategoryController);
categoryRoute.put("/:id", authMiddleware, updateCategoryController);
categoryRoute.delete("/:id", authMiddleware, deleteCategoryController);

module.exports = categoryRoute;
