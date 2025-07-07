import UserModel from "../models/user.model.js";
import bcrypt from "bcryptjs";
import sendEmail from "../utils/sendMail.js";
import catchAsyncError from "../middlewares/catchAsyncError.js";
import { CustomHttpError } from "../utils/customError.js";
import { generateToken, verifyToken } from "../utils/generate.verify.token.js";
export const registerUser = catchAsyncError(async (req, res, next) => {
  const { fullName, email, password, mobile } = req.body;

  const existingUser = await UserModel.findOne({ email });
  if (existingUser) {
    return next(new CustomHttpError(400, "User already exists"));
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const verificationToken = generateToken(
    { email },
    process.env.JWT_VERIFY_SECRET,
    "1h"
  );

  const newUser = new UserModel({
    fullName,
    email,
    password: hashedPassword,
    mobile,
    verificationToken,
  });

  await newUser.save();

  const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;
  const message = `
    <h1>Email Verification</h1>
    <p>Please click the link below to verify your email address:</p>
    <a href="${verificationUrl}">Verify Your Email</a>
  `;

  await sendEmail({ email, subject: "Verify Your Email", message });

  res.status(201).json({
    success: true,
    message: "User registered successfully. Check your email for verification.",
  });
});

export const verifyEmail = catchAsyncError(async (req, res, next) => {
  const { token } = req.body;

  if (!token) {
    return next(new CustomHttpError(400, "Verification token is missing"));
  }

  const { decoded, error } = verifyToken(token, process.env.JWT_VERIFY_SECRET);

  if (error) {
    if (error.name === "TokenExpiredError") {
      const { decoded: expiredDecoded } = verifyToken(
        token,
        process.env.JWT_VERIFY_SECRET,
        {
          ignoreExpiration: true,
        }
      );

      if (!expiredDecoded?.email) {
        return next(new CustomHttpError(400, "Invalid or expired token"));
      }

      const user = await UserModel.findOne({ email: expiredDecoded.email });
      if (!user) {
        return next(new CustomHttpError(400, "Invalid or expired token"));
      }

      const newToken = generateToken(
        { email: user.email },
        process.env.JWT_VERIFY_SECRET,
        "1h"
      );

      user.verificationToken = newToken;
      await user.save();

      const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${newToken}`;
      const message = `
        <h1>Email Verification Required</h1>
        <p>Your previous verification link expired. Please verify your email again:</p>
        <a href="${verificationUrl}">Verify Your Email</a>
      `;

      await sendEmail({
        email: user.email,
        subject: "New Email Verification Link",
        message,
      });

      return res.status(400).json({
        success: false,
        message: "Verification link expired. A new email has been sent.",
      });
    }

    return next(new CustomHttpError(400, "Invalid or expired token"));
  }

  const user = await UserModel.findOne({ email: decoded.email });
  if (!user) {
    return next(new CustomHttpError(400, "Invalid or expired token"));
  }

  user.status = "Active";
  user.verificationToken = null;
  await user.save();

  res.status(200).json({
    success: true,
    message: "Email verified successfully! You can now log in.",
  });
});

export const loginUser = catchAsyncError(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await UserModel.findOne({ email });
  if (!user) {
    return next(new CustomHttpError(400, "Invalid email or password"));
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return next(new CustomHttpError(400, "Invalid email or password"));
  }

  if (user.status === "Inactive") {
    user.verificationToken = generateToken(
      { email: user.email },
      process.env.JWT_VERIFY_SECRET,
      "1h"
    );
    await user.save();

    const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${user.verificationToken}`;
    const message = `
      <h1>Email Verification Required</h1>
      <p>Please verify your email to activate your account:</p>
      <a href="${verificationUrl}">Verify Your Email</a>
    `;

    await sendEmail({
      email: user.email,
      subject: "Verify Your Email",
      message,
    });

    return res.status(403).json({
      success: false,
      message: "Your account is inactive. A verification email has been sent.",
    });
  }

  if (user.status === "Suspended") {
    return res.status(403).json({
      success: false,
      message: "Your account has been suspended. Contact support.",
    });
  }

  const accessToken = generateToken(
    { id: user._id, role: user.role },
    process.env.JWT_ACCESS_SECRET,
    "15m"
  );
  const refreshToken = generateToken(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET,
    "7d"
  );

  user.refreshToken = refreshToken;
  await user.save();

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    sameSite: "strict",
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.status(200).json({
    success: true,
    message: "Login successful",
    accessToken,
  });
});

export const refreshAccessToken = catchAsyncError(async (req, res, next) => {
  const refreshToken =
    req.cookies?.refreshToken || req.headers?.refreshtoken || "";
  if (!refreshToken) {
    return next(new CustomHttpError(401, "Unauthorized - No Refresh Token"));
  }

  const { decoded } = verifyToken(refreshToken, process.env.JWT_REFRESH_SECRET);
  if (!decoded) {
    return next(new CustomHttpError(403, "Invalid Refresh Token"));
  }

  const user = await UserModel.findById(decoded.id);
  if (!user || user.refreshToken !== refreshToken) {
    return next(new CustomHttpError(403, "Invalid Refresh Token"));
  }

  const newAccessToken = generateToken(
    { id: user._id, role: user.role },
    process.env.JWT_ACCESS_SECRET,
    "15m"
  );

  res.cookie("accessToken", newAccessToken, {
    httpOnly: true,
    sameSite: "strict",
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  res.status(200).json({
    success: true,
    accessToken: newAccessToken,
  });
});

export const logoutUser = (req, res) => {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

export const changePassword = catchAsyncError(async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.user._id;

  const user = await UserModel.findById(userId);
  if (!user) {
    return next(new CustomHttpError(404, "User not found"));
  }

  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch) {
    return next(new CustomHttpError(400, "Old password is incorrect"));
  }

  const hashedNewPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedNewPassword;
  await user.save();

  res.status(200).json({
    success: true,
    message: "Password changed successfully",
  });
});
