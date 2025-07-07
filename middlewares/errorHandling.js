import { CustomHttpError } from "../utils/customError.js";

function errorHandler(err, req, res, next) {
  err.httpStatusCode = err.httpStatusCode || 500;
  err.message = err.message || "Internal error";
  if (err.name == "CastError") {
    const message = `Resource not found. Invalid: ${err.path} `;
    err = new CustomHttpError(400, message);
  }

  res.status(err.httpStatusCode).json({
    success: false,
    message: err.message,
    error: err,
  });
}

export default errorHandler;
