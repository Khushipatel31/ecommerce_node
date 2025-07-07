import jwt from "jsonwebtoken";
import UserModel from "../models/user.model.js";
import catchAsyncError from "./catchAsyncError.js";
import { CustomHttpError } from "../utils/customError.js";

export const isAuthenticated = catchAsyncError(async (req, res, next) => {
  const accessToken =
    req.cookies?.accessToken || req.headers?.authorization || "";

  if (!accessToken) {
    return next(new CustomHttpError(401, "Unauthorized - No Token Provided"));
  }

  try {
    const decoded = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET);
    req.user = await UserModel.findById(decoded.id).select("-password");
    next();
  } catch (error) {
    return next(new CustomHttpError(401, "Unauthorized - Invalid Token"));
  }
});

export const authorizeRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new CustomHttpError(403, "Access Denied"));
    }
    next();
  };
};
