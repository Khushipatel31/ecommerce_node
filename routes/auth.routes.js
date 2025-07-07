import express from "express";
import {
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  verifyEmail,
  changePassword,
} from "../controllers/auth.controller.js";
import {
  validateRegister,
  validateLogin,
  validateChangePassword,
} from "../middlewares/validators.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/register", validateRegister, registerUser);
router.post("/verify-email", verifyEmail);
router.post("/login", validateLogin, loginUser);
router.get("/refresh-token", refreshAccessToken);
router.post(
  "/change-password",
  isAuthenticated,
  validateChangePassword,
  changePassword
);
router.get("/logout", isAuthenticated, logoutUser);

export default router;
