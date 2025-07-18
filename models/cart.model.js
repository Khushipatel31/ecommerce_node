import { model, Schema } from "mongoose";

const cartProductSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    quantity: {
      type: Number,
      default: 1,
      min: [1, "Quantity must be at least 1"],
    },
  },
  { timestamps: true }
);

const CartProduct = model("CartProduct", cartProductSchema);
export default CartProduct;
