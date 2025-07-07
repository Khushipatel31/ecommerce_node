import express from "express";
import {
  createReview,
  getProductReviews,
  updateReview,
  deleteReview,
} from "../controllers/review.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import {
  validateReview,
  validateUpdateReview,
} from "../middlewares/validators.js";

const router = express.Router();

router.get("/:productId", getProductReviews);

router.use(isAuthenticated);
router.post("/", validateReview, createReview);

router.put("/:id", validateUpdateReview, updateReview);

router.delete("/:id", deleteReview);

export default router;
