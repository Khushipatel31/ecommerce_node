import Address from "../models/address.model.js";
import catchAsyncError from "../middlewares/catchAsyncError.js";
import { CustomHttpError } from "../utils/customError.js";

export const createAddress = catchAsyncError(async (req, res, next) => {
  const { _id: userId } = req.user;
  const addressData = req.body;

  const address = new Address({ ...addressData, userId });
  await address.save();

  res
    .status(201)
    .json({ success: true, message: "Address added successfully" });
});

export const getUserAddresses = catchAsyncError(async (req, res, next) => {
  const { _id: userId } = req.user;
  const addresses = await Address.find({ userId });
  res.json({ success: true, addresses });
});

export const getAddressById = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const address = await Address.findById(id);

  if (!address) {
    return next(new CustomHttpError(404, "Address not found"));
  }

  res.json({ success: true, address });
});

export const updateAddress = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const updateData = req.body;

  const updatedAddress = await Address.findByIdAndUpdate(id, updateData, {
    new: true,
  });

  if (!updatedAddress) {
    return next(new CustomHttpError(404, "Address not found"));
  }

  res.json({ success: true, message: "Address updated successfully" });
});

export const deleteAddress = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const address = await Address.findByIdAndDelete(id);

  if (!address) {
    return next(new CustomHttpError(404, "Address not found"));
  }

  res.json({ success: true, message: "Address deleted successfully" });
});
