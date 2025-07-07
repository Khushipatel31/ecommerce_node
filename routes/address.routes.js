import express from "express";
import {
  createAddress,
  getUserAddresses,
  getAddressById,
  updateAddress,
  deleteAddress,
} from "../controllers/address.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import { validateAddress } from "../middlewares/validators.js";

const router = express.Router();

router.use(isAuthenticated);

router.post("/", validateAddress, createAddress);
router.get("/", getUserAddresses);
router.get("/:id", getAddressById);
router.put("/:id", validateAddress, updateAddress);
router.delete("/:id", deleteAddress);

export default router;
