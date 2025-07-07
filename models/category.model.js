import { model, Schema } from "mongoose";

const categorySchema = new Schema(
  {
    category: {
      type: String,
      required: [true, "Category name is required."],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, "Category slug is required."],
      trim: true,
      unique: true,
      lowercase: true,
    },
  },
  { timestamps: true }
);

const Category = model("Category", categorySchema);
export default Category;
