import Category from "../models/category.model.js";
import Product from "../models/product.model.js";
import slugify from "slugify";
import catchAsyncError from "../middlewares/catchAsyncError.js";
import { CustomHttpError } from "../utils/customError.js";

export const createCategory = catchAsyncError(async (req, res, next) => {
  const { category } = req.body;

  if (!category) {
    return next(new CustomHttpError(400, "Category name is required."));
  }

  const slug = slugify(category, { lower: true });

  const existingCategory = await Category.findOne({ slug });
  if (existingCategory) {
    return next(new CustomHttpError(400, "Category already exists."));
  }

  const newCategory = new Category({ category, slug });
  await newCategory.save();

  res.status(201).json({
    success: true,
    message: "Category created successfully!",
    category: newCategory,
  });
});

export const getCategories = catchAsyncError(async (req, res) => {
  const categories = await Category.find();
  res.status(200).json({ success: true, categories });
});

export const updateCategory = catchAsyncError(async (req, res, next) => {
  const { slug: id } = req.params;
  const { category } = req.body;

  if (!category) {
    return next(new CustomHttpError(400, "Category name is required."));
  }

  const slug = slugify(category, { lower: true });

  const updatedCategory = await Category.findOneAndUpdate(
    { slug: id },
    { category, slug },
    { new: true }
  );

  if (!updatedCategory) {
    return next(new CustomHttpError(404, "Category not found"));
  }

  res.status(200).json({
    success: true,
    message: "Category updated successfully",
    category: updatedCategory,
  });
});

export const deleteCategory = catchAsyncError(async (req, res, next) => {
  const { slug } = req.params;
  const category = await Category.findOne({ slug });

  if (!category) {
    return next(new CustomHttpError(404, "Category not found"));
  }

  await Product.updateMany(
    { category: category._id },
    { $pull: { category: category._id } },
    { multi: true }
  );
  await Category.findOneAndDelete({ slug });

  res
    .status(200)
    .json({ success: true, message: "Category deleted successfully" });
});
