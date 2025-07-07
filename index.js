import express from "express";
import cors from "cors";
import { config } from "dotenv";
import dbConfig from "./config/dbConfig.js";
import errorHandler from "./middlewares/errorHandling.js";
import authRoutes from "./routes/auth.routes.js";
import addressRoutes from "./routes/address.routes.js";
import productRoutes from "./routes/product.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import orderRoutes from "./routes/order.routes.js";
import reviewRoutes from "./routes/review.routes.js";
import reqLogs from "./utils/req.logs.js";
import "./config/cron.job.js";
config();

const port = process.env.PORT || 3001;
const app = express();

app.use(express.json());
app.use(cors());
app.use(reqLogs);

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/address", addressRoutes);
app.use("/api/v1/product", productRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/cart", cartRoutes);
app.use("/api/v1/order", orderRoutes);
app.use("/api/v1/review", reviewRoutes);

dbConfig();

app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server is running at port ${port} `);
});
