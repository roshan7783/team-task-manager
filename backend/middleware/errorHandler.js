/**
 * Centralized error handling middleware.
 * All errors thrown with next(err) land here.
 * Returns a consistent JSON error shape to the client.
 */
const errorHandler = (err, req, res, next) => {
  // Log the error in production for debugging
  console.error(`❌ API Error [${req.method} ${req.path}]:`, err.message);
  if (process.env.NODE_ENV === "development") {
    console.error(err.stack);
  }

  // Mongoose duplicate key error (e.g. duplicate email)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `${field} already exists`,
    });
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      message: messages.join(", "),
    });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Token expired, please log in again",
    });
  }

  // Default to 500 if no status code was set
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
};

module.exports = errorHandler;
