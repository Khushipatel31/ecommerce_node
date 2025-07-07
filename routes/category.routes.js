import express from "express";
import {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
} from "../controllers/category.controller.js";
import {
  authorizeRole,
  isAuthenticated,
} from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(isAuthenticated);
router.get("/", getCategories);
router.use(authorizeRole("ADMIN"));
router.put("/:slug", updateCategory);
router.post("/", createCategory);
router.delete("/:slug", deleteCategory);

export default router;
