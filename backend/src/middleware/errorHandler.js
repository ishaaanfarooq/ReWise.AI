import logger from '../utils/logger.js';
import config from '../config/index.js';

/**
 * Global Error Handler Middleware
 * Catches all errors and returns structured JSON responses
 */
const errorHandler = (err, req, res, _next) => {
  // Log the full error in development, sanitized in production
  logger.error(`${err.message}`, {
    stack: config.isDev ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: messages,
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({
      success: false,
      error: `Duplicate value for ${field}`,
    });
  }

  // Mongoose cast error (bad ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: 'Invalid resource ID format',
    });
  }

  // Default
  const statusCode = err.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    error: config.isDev ? err.message : 'Internal server error',
  });
};

export default errorHandler;
