import express from "express";
import {
  createPaymentIntent,
  createOrder,
  getUserOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
} from "../controllers/order.controller.js";
import {
  authorizeRole,
  isAuthenticated,
} from "../middlewares/auth.middleware.js";
import { validateOrder } from "../middlewares/validators.js";

const router = express.Router();

router.use(isAuthenticated);

router.post("/payment-intent", createPaymentIntent);

router.post("/", validateOrder, createOrder);

router.get("/", getUserOrders);

router.get("/:id", getOrderById);

router.use(authorizeRole("ADMIN"));

router.get("/admin/all", getAllOrders);

router.put("/admin/:id/status", updateOrderStatus);

export default router;
