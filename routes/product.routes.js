import express from "express";
import {
  createProduct,
  getAllProducts,
  getProductsByCategory,
  getProductById,
  updateProduct,
  updateProductStock,
  deleteProduct,
} from "../controllers/product.controller.js";
import { validateProduct } from "../middlewares/validators.js";
import upload from "../utils/multer.js";
import {
  authorizeRole,
  isAuthenticated,
} from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", getAllProducts);
router.get("/category/:id", getProductsByCategory);
router.get("/:id", getProductById);

router.use(isAuthenticated, authorizeRole("ADMIN"));

router.post("/", upload.array("images", 10), validateProduct, createProduct);
router.put("/:id", upload.array("images", 10), validateProduct, updateProduct);
router.put("/stock/:id", updateProductStock);
router.delete("/:id", deleteProduct);

export default router;
