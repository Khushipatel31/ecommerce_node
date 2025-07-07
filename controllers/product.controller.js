import Product from "../models/product.model.js";
import Category from "../models/category.model.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import mongoose from "mongoose";
import fs from "fs";
import catchAsyncError from "../middlewares/catchAsyncError.js";
import { CustomHttpError } from "../utils/customError.js";

export const getAllProducts = catchAsyncError(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const products = await Product.find()
    .populate("category")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Product.countDocuments();

  res.status(200).json({
    success: true,
    products,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    totalProducts: total,
  });
});

export const getProductsByCategory = catchAsyncError(async (req, res, next) => {
  const { id: categoryId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(categoryId)) {
    return next(new CustomHttpError(400, "Invalid category ID"));
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const products = await Product.find({ category: categoryId })
    .populate("category")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Product.countDocuments({ category: categoryId });

  res.status(200).json({
    success: true,
    products,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    totalProducts: total,
  });
});

export const getProductById = catchAsyncError(async (req, res, next) => {
  const { id: productId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return next(new CustomHttpError(400, "Invalid product ID"));
  }

  const product = await Product.findById(productId).populate("category");

  if (!product) {
    return next(new CustomHttpError(404, "Product not found"));
  }

  res.status(200).json({
    success: true,
    product,
  });
});

export const createProduct = catchAsyncError(async (req, res, next) => {
  const { name, description, brand } = req.body;
  const price = parseFloat(req.body.price);
  const countInStock = parseInt(req.body.countInStock, 10);

  let category = req.body.category;
  let categoryIds = Array.isArray(category) ? category : [category];
  const categoriesLength = categoryIds.length;

  // Validate ObjectId format
  categoryIds = categoryIds.filter((id) => mongoose.Types.ObjectId.isValid(id));
  if (categoriesLength !== categoryIds.length) {
    for (const file of req.files) {
      fs.unlinkSync(file.path);
    }
    return next(new CustomHttpError(400, "Invalid categories provided."));
  }

  // Check for duplicates
  const hasDuplicates = new Set(categoryIds).size !== categoryIds.length;
  if (hasDuplicates) {
    for (const file of req.files) {
      fs.unlinkSync(file.path);
    }
    return next(
      new CustomHttpError(400, "Duplicate category IDs are not allowed.")
    );
  }

  // Validate if all categories exist
  const validCategories = await Category.find({ _id: { $in: categoryIds } });
  if (validCategories.length !== categoryIds.length) {
    for (const file of req.files) {
      fs.unlinkSync(file.path);
    }
    return next(new CustomHttpError(400, "Some categories do not exist."));
  }

  let uploadedImages = [];
  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      const imageUrl = await uploadToCloudinary(file);
      uploadedImages.push(imageUrl);
    }
  }

  const product = new Product({
    name,
    description,
    category: categoryIds,
    brand,
    price,
    countInStock,
    images: uploadedImages,
  });

  const savedProduct = await product.save();

  res.status(201).json({
    success: true,
    message: "Product created successfully",
    product: savedProduct,
  });
});

export const updateProduct = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const { name, description, brand, images = [] } = req.body;
  const price = parseFloat(req.body.price);
  const countInStock = parseInt(req.body.countInStock, 10);

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    for (const file of req.files) {
      fs.unlinkSync(file.path);
    }
    return next(new CustomHttpError(400, "Invalid product ID."));
  }

  // Validate category
  let category = req.body.category;
  let categoryIds = Array.isArray(category) ? category : [category];
  const originalLength = categoryIds.length;
  categoryIds = categoryIds.filter((id) => mongoose.Types.ObjectId.isValid(id));

  if (categoryIds.length !== originalLength) {
    for (const file of req.files) {
      fs.unlinkSync(file.path);
    }
    return next(new CustomHttpError(400, "Invalid category IDs provided."));
  }

  const validCategories = await Category.find({ _id: { $in: categoryIds } });
  if (validCategories.length !== categoryIds.length) {
    for (const file of req.files) {
      fs.unlinkSync(file.path);
    }
    return next(new CustomHttpError(400, "Some categories do not exist."));
  }

  // Upload new images
  let uploadedImages = [];
  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      const imageUrl = await uploadToCloudinary(file);
      uploadedImages.push(imageUrl);
    }
  }

  // Combine existing + new images
  const combinedImages = [...images, ...uploadedImages];
  if (combinedImages.length === 0) {
    for (const file of req.files) {
      fs.unlinkSync(file.path);
    }
    return next(new CustomHttpError(400, "At least one image is required."));
  }

  // Update product
  const updatedProduct = await Product.findByIdAndUpdate(
    id,
    {
      name,
      description,
      brand,
      price,
      countInStock,
      category: categoryIds,
      images: combinedImages,
    },
    { new: true, runValidators: true }
  );

  if (!updatedProduct) {
    for (const file of req.files) {
      fs.unlinkSync(file.path);
    }
    return next(new CustomHttpError(404, "Product not found."));
  }

  res.status(200).json({
    success: true,
    message: "Product updated successfully",
    product: updatedProduct,
  });
});

export const deleteProduct = catchAsyncError(async (req, res, next) => {
  const { id: productId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return next(new CustomHttpError(400, "Invalid product ID"));
  }

  const product = await Product.findById(productId);

  if (!product) {
    return next(new CustomHttpError(404, "Product not found"));
  }

  await Product.findByIdAndDelete(productId);

  res
    .status(200)
    .json({ success: true, message: "Product deleted successfully" });
});

export const updateProductStock = catchAsyncError(async (req, res, next) => {
  const { id: productId } = req.params;
  const { countInStock } = req.body;

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return next(new CustomHttpError(400, "Invalid product ID."));
  }

  if (countInStock === undefined || countInStock < 0) {
    return next(new CustomHttpError(400, "Valid stock count is required."));
  }

  const product = await Product.findById(productId);

  if (!product) {
    return next(new CustomHttpError(404, "Product not found."));
  }

  product.countInStock = countInStock;
  await product.save();

  res.status(200).json({
    success: true,
    message: "Product stock updated successfully",
    product,
  });
});
