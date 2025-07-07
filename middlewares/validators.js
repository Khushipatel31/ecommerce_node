import { body, check, validationResult } from "express-validator";

export const validateResults = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg,
    });
  }
  next();
};

export const validateRegister = [
  body("fullName").trim().notEmpty().withMessage("Full name is required"),
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail(),
  body("password")
    .trim()
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  body("mobile")
    .trim()
    .notEmpty()
    .withMessage("Mobile number is required")
    .isMobilePhone()
    .withMessage("Invalid mobile number"),
  validateResults,
];

export const validateLogin = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail(),

  body("password").trim().notEmpty().withMessage("Password is required"),

  validateResults,
];

export const validateChangePassword = [
  body("oldPassword").trim().notEmpty().withMessage("Old password is required"),
  body("newPassword")
    .trim()
    .notEmpty()
    .withMessage("New password is required")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters long"),
  validateResults,
];

export const validateAddress = [
  body("addressLine1")
    .trim()
    .notEmpty()
    .withMessage("Address Line 1 is required."),
  body("city").trim().notEmpty().withMessage("City is required."),
  body("state").trim().notEmpty().withMessage("State is required."),
  body("pinCode")
    .trim()
    .notEmpty()
    .withMessage("Pin code is required.")
    .isNumeric()
    .withMessage("Pin code must be a number")
    .isLength({ min: 5, max: 10 })
    .withMessage("Pin code must be between 5 to 10 characters."),
  body("country").trim().notEmpty().withMessage("Country is required."),
  body("mobile")
    .trim()
    .notEmpty()
    .withMessage("Mobile number is required.")
    .isMobilePhone()
    .withMessage("Invalid mobile number format."),
  validateResults,
];

export const validateProduct = [
  check("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 3 })
    .withMessage("Name must be at least 3 characters long"),

  check("description")
    .trim()
    .notEmpty()
    .withMessage("Description is required")
    .isLength({ min: 10 })
    .withMessage("Description must be at least 10 characters long"),

  check("price")
    .notEmpty()
    .withMessage("Price is required")
    .custom((value) => {
      const num = parseFloat(value);
      if (isNaN(num)) throw new Error("Price must be a number");
      if (num < 0) throw new Error("Price cannot be negative");
      return true;
    }),

  check("countInStock")
    .notEmpty()
    .withMessage("Count in stock is required")
    .custom((value) => {
      const num = parseInt(value, 10);
      if (isNaN(num)) throw new Error("Count in stock must be an integer");
      if (num < 0) throw new Error("Count in stock cannot be negative");
      return true;
    }),

  validateResults,
];

export const validateOrder = [
  body("paymentIntentId")
    .notEmpty()
    .withMessage("Payment Intent ID is required")
    .isString()
    .withMessage("Payment Intent ID must be a string"),

  body("addressId")
    .notEmpty()
    .withMessage("Address ID is required")
    .isMongoId()
    .withMessage("Invalid Address ID format"),

  validateResults,
];

export const validateReview = [
  body("product")
    .notEmpty()
    .withMessage("Product ID is required")
    .isMongoId()
    .withMessage("Invalid product ID"),

  body("rating")
    .notEmpty()
    .withMessage("Rating is required")
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be an integer between 1 and 5"),

  body("comment")
    .trim()
    .notEmpty()
    .withMessage("Comment is required")
    .isLength({ min: 3 })
    .withMessage("Comment must be at least 3 characters long"),

  validateResults,
];

export const validateUpdateReview = [
  body("rating")
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be an integer between 1 and 5"),

  body("comment")
    .optional()
    .isString()
    .isLength({ min: 3 })
    .withMessage("Comment must be at least 3 characters long"),

  validateResults,
];
