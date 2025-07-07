import { schedule } from "node-cron";
import User from "../models/user.model.js";
import Product from "../models/product.model.js";
import sendMail from "../utils/sendMail.js";

const BUFFER_LIMIT = process.env.BUFFER_LIMIT;
const generateProductTable = (products) => {
  return `
    <style>
      table { width: 100%; border-collapse: collapse; font-family: Arial, sans-serif; }
      th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
      th { background-color: #d9534f; color: white; }
    </style>
    <h2>⚠️ Low Stock Warning!</h2>
    <p>The following products are below buffer stock limit:</p>
    <table>
      <thead>
        <tr><th>Product</th><th>Stock</th><th>Buffer Limit</th></tr>
      </thead>
      <tbody>
        ${products
          .map(
            ({ name, countInStock }) => `
          <tr>
            <td>${name}</td>
            <td>${countInStock}</td>
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>
    <p>Ensure timely restocking.</p>
  `;
};

const notifyAdminsOfLowStock = async () => {
  try {
    const lowStockProducts = await Product.find({
      countInStock: { $lt: BUFFER_LIMIT },
    });
    if (!lowStockProducts.length)
      return console.log("No low-stock items detected.");

    const admin = await User.findOne({ role: "ADMIN" });
    if (!admin) return console.log("No admin user available for notification.");
    const emailContent = generateProductTable(lowStockProducts);

    sendMail({
      email: admin.email,
      subject: "Low Stock Alert",
      message: emailContent,
    });

    console.log("Low stock notification sent successfully.");
  } catch (err) {
    console.error("Error during low stock email notification:", err);
  }
};

schedule("0 21 * * *", notifyAdminsOfLowStock, { timezone: "Asia/Kolkata" });

console.log("Scheduled task set for 9:00 PM daily.");
