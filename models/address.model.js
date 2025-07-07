import { model, Schema } from "mongoose";

const addressSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    addressLine1: {
      type: String,
      required: [true, "Address Line 1 is required."],
    },
    city: {
      type: String,
      required: [true, "City is required."],
    },
    state: {
      type: String,
      required: [true, "State is required."],
    },
    pinCode: {
      type: String,
      required: [true, "Pin code is required."],
    },
    country: {
      type: String,
      required: [true, "Country is required."],
      default: "India",
    },
    mobile: {
      type: String,
      required: [true, "Mobile number is required."],
    },
  },
  { timestamps: true }
);

const Address = model("Address", addressSchema);
export default Address;
