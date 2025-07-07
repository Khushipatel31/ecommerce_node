import express from "express";
import {
  addToCart,
  getCart,
  removeFromCart,
  clearCart,
} from "../controllers/cart.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(isAuthenticated);
router.post("/", addToCart);
router.get("/", getCart);
router.delete("/", clearCart);
router.put("/:id", removeFromCart);

export default router;
