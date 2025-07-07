import { model, Schema } from "mongoose";

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required."],
      unique: true,
    },
    password: {
      type: String,
      required: [true, "Password is required."],
    },
    fullName: {
      type: String,
      required: [true, "Full name is required."],
    },
    mobile: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      enum: ["ADMIN", "CUSTOMER"],
      default: "CUSTOMER",
    },
    status: {
      type: String,
      enum: ["Active", "Inactive", "Suspended"],
      default: "Inactive",
    },
    verificationToken: { type: String, default: null },
    refreshToken: { type: String, default: null },
  },
  { timestamps: true }
);

const User = model("User", userSchema);
export default User;
