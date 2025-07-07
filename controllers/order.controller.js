import Address from "../models/address.model.js";
import CartProduct from "../models/cart.model.js";
import Order from "../models/order.model.js";
import User from "../models/user.model.js";
import Product from "../models/product.model.js";
import stripe from "../utils/stripe.js";
import { v4 as uuidv4 } from "uuid";
import mongoose from "mongoose";
import { CustomHttpError } from "../utils/customError.js";
import catchAsyncError from "../middlewares/catchAsyncError.js";

const ORDER_STATUSES = [
  "Pending",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
];

export const createPaymentIntent = catchAsyncError(async (req, res, next) => {
  const userId = req.user._id;
  const { addressId, paymentMethodId } = req.body;

  const address = await Address.findOne({ _id: addressId, userId });
  if (!address) return next(new CustomHttpError(404, "Address not found."));

  const cartItems = await CartProduct.find({ userId }).populate(
    "productId",
    "name price countInStock"
  );
  if (cartItems.length === 0)
    return next(new CustomHttpError(400, "Cart is empty."));

  for (const item of cartItems) {
    if (item.productId.countInStock < item.quantity) {
      return next(
        new CustomHttpError(
          400,
          `Insufficient stock for product: ${item.productId.name}`
        )
      );
    }
  }

  let totalAmount = cartItems.reduce(
    (total, item) => total + item.productId.price * item.quantity,
    0
  );

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(totalAmount * 100),
    currency: "inr",
    payment_method: paymentMethodId,
    confirm: true,
    return_url: "https://frontend.com/payment-success",
    metadata: {
      userId: userId.toString(),
      addressId: addressId.toString(),
    },
  });
  res.status(200).json({
    paymentIntentId: paymentIntent.id,
    clientSecret: paymentIntent.client_secret,
    totalAmount,
  });
});

export const createOrder = catchAsyncError(async (req, res, next) => {
  const userId = req.user._id;
  const { paymentIntentId, addressId } = req.body;

  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  if (paymentIntent.status !== "succeeded") {
    return next(new CustomHttpError(400, "Payment not successful."));
  }

  const existingOrder = await Order.findOne({ paymentId: paymentIntentId });
  if (existingOrder) {
    return next(
      new CustomHttpError(400, "This payment has already been processed.")
    );
  }

  const address = await Address.findOne({ _id: addressId, userId });
  if (!address) return next(new CustomHttpError(404, "Address not found."));

  const cartItems = await CartProduct.find({ userId }).populate(
    "productId",
    "name price countInStock"
  );
  if (cartItems.length === 0)
    return next(new CustomHttpError(400, "Cart is empty."));

  const products = cartItems.map((item) => ({
    productId: item.productId._id,
    quantity: item.quantity,
    priceAtPurchase: item.productId.price,
  }));

  let totalAmount = cartItems.reduce(
    (total, item) => total + item.productId.price * item.quantity,
    0
  );

  const orderId = `ORD-${uuidv4().substring(0, 8)}`;

  const newOrder = new Order({
    userId,
    orderId,
    products,
    paymentId: paymentIntentId,
    paymentStatus: "Completed",
    deliveryAddress: addressId,
    totalAmount,
    orderStatus: "Processing",
  });

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const savedOrder = await newOrder.save({ session });

    for (const item of cartItems) {
      await Product.findByIdAndUpdate(
        item.productId._id,
        { $inc: { countInStock: -item.quantity } },
        { session }
      );
    }

    await User.findByIdAndUpdate(
      userId,
      { $push: { orderHistory: savedOrder._id } },
      { session }
    );

    await CartProduct.deleteMany({ userId }, { session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      message: "Order placed successfully",
      order: savedOrder,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return next(new CustomHttpError(500, error.message));
  }
});

export const updateOrderStatus = catchAsyncError(async (req, res, next) => {
  if (req.user.role !== "ADMIN") {
    return next(new CustomHttpError(403, "Not authorized"));
  }

  const { id: orderId } = req.params;

  const order = await Order.findOne({ orderId });
  if (!order) {
    return next(new CustomHttpError(404, "Order not found"));
  }

  const currentStatusIndex = ORDER_STATUSES.indexOf(order.orderStatus);
  if (
    currentStatusIndex === -1 ||
    currentStatusIndex === ORDER_STATUSES.length - 1
  ) {
    return next(new CustomHttpError(400, "Invalid or final order status"));
  }

  order.orderStatus = ORDER_STATUSES[currentStatusIndex + 1];
  await order.save();

  if (order.orderStatus === "Cancelled") {
    for (const item of order.products) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { countInStock: item.quantity },
      });
    }
  }

  res.status(200).json({
    message: "Order status updated successfully",
    order,
  });
});

export const getAllOrders = catchAsyncError(async (req, res, next) => {
  const orders = await Order.find().populate("userId", "fullName email");
  res.status(200).json({ orders });
});

export const getOrderById = catchAsyncError(async (req, res, next) => {
  const { id: orderId } = req.params;
  const order = await Order.findOne({ orderId }).populate(
    "products.productId",
    "name price"
  );
  if (!order) return next(new CustomHttpError(404, "Order not found"));
  res.status(200).json(order);
});

export const getUserOrders = catchAsyncError(async (req, res, next) => {
  const userId = req.user._id;
  const orders = await Order.find({ userId }).populate(
    "products.productId",
    "name price"
  );
  res.status(200).json({ orders });
});
