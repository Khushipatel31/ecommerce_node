import Review from "../models/review.model.js";
import Product from "../models/product.model.js";
import catchAsyncError from "../middlewares/catchAsyncError.js";
import { CustomHttpError } from "../utils/customError.js";
import mongoose from "mongoose";

export const createReview = catchAsyncError(async (req, res, next) => {
  const { product, rating, comment } = req.body;

  if (!mongoose.Types.ObjectId.isValid(product)) {
    return next(new CustomHttpError(400, "Invalid product ID"));
  }

  const productDoc = await Product.findById(product);
  if (!productDoc) {
    return next(new CustomHttpError(404, "Product not found"));
  }

  const review = await Review.create({
    product,
    user: req.user._id,
    rating,
    comment,
  });

  const reviews = await Review.find({ product });
  const avgRating = (
    reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
  ).toFixed(2);

  productDoc.rating = avgRating;
  productDoc.numReviews = reviews.length;
  await productDoc.save();

  res.status(201).json({ success: true, review });
});

export const getProductReviews = catchAsyncError(async (req, res, next) => {
  const { productId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return next(new CustomHttpError(400, "Invalid product ID"));
  }

  const reviews = await Review.find({ product: productId })
    .populate("user", "name")
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, reviews });
});

export const updateReview = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const { rating, comment } = req.body;

  const review = await Review.findById(id);
  if (!review) {
    return next(new CustomHttpError(404, "Review not found"));
  }

  if (!review.user.equals(req.user._id)) {
    return next(
      new CustomHttpError(403, "Not authorized to update this review")
    );
  }

  review.rating = rating || review.rating;
  review.comment = comment || review.comment;
  await review.save();

  const reviews = await Review.find({ product: review.product });
  const avgRating =
    reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;

  await Product.findByIdAndUpdate(review.product, {
    rating: avgRating,
    numReviews: reviews.length,
  });

  res.status(200).json({ success: true, review });
});

export const deleteReview = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  const review = await Review.findById(id);
  if (!review) {
    return next(new CustomHttpError(404, "Review not found"));
  }

  if (!review.user.equals(req.user._id)) {
    return next(
      new CustomHttpError(403, "Not authorized to delete this review")
    );
  }

  const productId = review.product;
  await review.deleteOne();

  const reviews = await Review.find({ product: productId });
  const avgRating =
    reviews.length > 0
      ? (
          reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
        ).toFixed(2)
      : 0;

  await Product.findByIdAndUpdate(productId, {
    rating: avgRating,
    numReviews: reviews.length,
  });

  res
    .status(200)
    .json({ success: true, message: "Review deleted successfully" });
});
