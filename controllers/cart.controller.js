import CartProduct from "../models/cart.model.js";
import Product from "../models/product.model.js";
import { CustomHttpError } from "../utils/customError.js";
import catchAsyncError from "../middlewares/catchAsyncError.js";

export const addToCart = catchAsyncError(async (req, res, next) => {
  const { productId, quantity = 1 } = req.body;
  const userId = req.user._id;

  const product = await Product.findById(productId);
  if (!product) {
    return next(new CustomHttpError(404, "Product not found."));
  }

  if (product.countInStock < quantity) {
    return next(new CustomHttpError(400, "Insufficient stock"));
  }

  const existingCartItem = await CartProduct.findOne({ userId, productId });

  if (existingCartItem) {
    const newQuantity = existingCartItem.quantity + parseInt(quantity);

    if (product.countInStock < newQuantity) {
      return next(new CustomHttpError(400, "Insufficient stock"));
    }

    existingCartItem.quantity = newQuantity;
    await existingCartItem.save();

    return res.status(200).json({
      success: true,
      message: "Cart updated successfully",
      cartItem: existingCartItem,
    });
  }

  const cartItem = new CartProduct({
    userId,
    productId,
    quantity: parseInt(quantity),
  });

  const savedCartItem = await cartItem.save();

  res.status(201).json({
    success: true,
    message: "Product added to cart",
    cartItem: savedCartItem,
  });
});

export const getCart = catchAsyncError(async (req, res, next) => {
  const userId = req.user._id;
  const cartItems = await CartProduct.find({ userId }).populate(
    "productId",
    "name price images countInStock"
  );
  let totalAmount = 0;
  cartItems.forEach((item) => {
    totalAmount += item.productId.price * item.quantity;
  });

  res.status(200).json({
    success: true,
    cartItems,
    totalAmount,
  });
});

export const removeFromCart = catchAsyncError(async (req, res, next) => {
  const { id: cartItemId } = req.params;
  const userId = req.user._id;
  const cartItem = await CartProduct.findOne({ _id: cartItemId, userId });

  if (!cartItem) {
    return next(new CustomHttpError(404, "Cart item not found."));
  }

  await CartProduct.findByIdAndDelete(cartItemId);
  res.status(200).json({ success: true, message: "Item removed from cart" });
});

export const clearCart = catchAsyncError(async (req, res, next) => {
  const userId = req.user._id;

  await CartProduct.deleteMany({ userId });

  res.status(200).json({ success: true, message: "Cart cleared successfully" });
});
