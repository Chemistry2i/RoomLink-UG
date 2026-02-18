const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const logger = require("../config/logger");

/**
 * Centralized Error Handling Middleware
 * Must be the last middleware in the app
 */
const errorHandler = (err, req, res, next) => {
  // Default error
  let error = err;

  // Log error
  logger.error(`Error: ${error.message}`);

  // Handle specific error types
  if (err.name === "CastError") {
    const message = "Resource not found";
    error = new ApiError(404, message);
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    const message = `${field} already exists`;
    error = new ApiError(409, message);
  }

  if (err.name === "ValidationError") {
    const message = Object.values(err.errors)
      .map((val) => val.message)
      .join(", ");
    error = new ApiError(400, message);
  }

  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || "Internal Server Error";
    error = new ApiError(statusCode, message);
  }

  // Send response
  res.status(error.statusCode).json(
    new ApiResponse(error.statusCode, null, error.message)
  );
};

module.exports = errorHandler;
