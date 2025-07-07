import { model, Schema } from "mongoose";
import Review from "./review.model.js";

const productSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Provide product name!"],
    },
    description: {
      type: String,
      required: [true, "Provide product description!"],
    },
    category: [
      {
        type: Schema.Types.ObjectId,
        ref: "Category",
      },
    ],
    brand: {
      type: String,
      default: "",
    },
    images: [
      {
        type: String,
        required: [true, "Provide product images!"],
      },
    ],
    price: {
      type: Number,
      required: true,
    },
    countInStock: {
      type: Number,
      required: true,
      default: 0,
    },
    rating: {
      type: Number,
      default: 0,
    },
    numReviews: { type: Number, default: 0 },
  },
  { timestamps: true }
);

productSchema.post("findOneAndDelete", async function (doc) {
  if (doc) {
    await Review.deleteMany({ product: doc._id });
  }
});

const Product = model("Product", productSchema);
export default Product;
