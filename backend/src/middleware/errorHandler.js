import logger from '../utils/logger.js';
import config from '../config/index.js';
import { ERROR_CODES, ERROR_STATUS_CODES, ERROR_MESSAGES, AppError } from '../utils/errorCodes.js';

/**
 * Global Error Handler Middleware
 * Catches all errors and returns standardized JSON responses with error codes
 * 
 * Error Code Format: [CATEGORY]_[NUMBER]
 * - AUTH_001: Invalid token
 * - VAL_001: Validation failed
 * - RES_001: Resource not found
 * - AI_001: AI processing failed
 * - EXT_001: External service failed
 * - ERR_001: Internal server error
 */
const errorHandler = (err, req, res, _next) => {
  let errorCode = ERROR_CODES.INTERNAL_SERVER_ERROR;
  let statusCode = 500;
  let message = ERROR_MESSAGES[errorCode];
  let details = null;

  // Log the full error in development, sanitized in production
  logger.error(`Error: ${err.message}`, {
    code: errorCode,
    stack: config.isDev ? err.stack : undefined,
    path: req.path,
    method: req.method,
    userId: req.userId || 'anonymous',
    timestamp: new Date().toISOString(),
  });

  // ─── Handle Custom AppError ───────────────────────────────────
  if (err instanceof AppError) {
    errorCode = err.code;
    statusCode = err.statusCode;
    message = err.message;
    details = err.details;
    return res.status(statusCode).json({
      success: false,
      error: message,
      code: errorCode,
      ...(details && { details }),
    });
  }

  // ─── Handle Mongoose Validation Error ─────────────────────────
  if (err.name === 'ValidationError') {
    errorCode = ERROR_CODES.VALIDATION_FAILED;
    statusCode = 400;
    const validationDetails = Object.entries(err.errors).map(([field, error]) => ({
      field,
      message: error.message,
    }));
    
    return res.status(statusCode).json({
      success: false,
      error: ERROR_MESSAGES[errorCode],
      code: errorCode,
      details: validationDetails,
    });
  }

  // ─── Handle Mongoose Duplicate Key Error ──────────────────────
  if (err.code === 11000) {
    errorCode = ERROR_CODES.DUPLICATE_ENTRY;
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    
    return res.status(statusCode).json({
      success: false,
      error: `${ERROR_MESSAGES[errorCode]} (Duplicate: ${field})`,
      code: errorCode,
      details: { field, value: err.keyValue[field] },
    });
  }

  // ─── Handle Mongoose Cast Error (Bad ObjectId) ────────────────
  if (err.name === 'CastError') {
    errorCode = ERROR_CODES.INVALID_OBJECT_ID;
    statusCode = 400;
    
    return res.status(statusCode).json({
      success: false,
      error: ERROR_MESSAGES[errorCode],
      code: errorCode,
      details: { field: err.path, value: err.value },
    });
  }

  // ─── Handle JWT Errors ────────────────────────────────────────
  if (err.name === 'TokenExpiredError') {
    errorCode = ERROR_CODES.AUTH_TOKEN_EXPIRED;
    statusCode = 401;
    
    return res.status(statusCode).json({
      success: false,
      error: ERROR_MESSAGES[errorCode],
      code: errorCode,
    });
  }

  if (err.name === 'JsonWebTokenError') {
    errorCode = ERROR_CODES.AUTH_INVALID_TOKEN;
    statusCode = 401;
    
    return res.status(statusCode).json({
      success: false,
      error: ERROR_MESSAGES[errorCode],
      code: errorCode,
    });
  }

  // ─── Handle External Service Errors ───────────────────────────
  if (err.message?.includes('MongoDB')) {
    errorCode = ERROR_CODES.MONGODB_CONNECTION_FAILED;
    statusCode = 503;
    message = ERROR_MESSAGES[errorCode];
  } else if (err.message?.includes('Redis')) {
    errorCode = ERROR_CODES.REDIS_CONNECTION_FAILED;
    statusCode = 503;
    message = ERROR_MESSAGES[errorCode];
  } else if (err.message?.includes('email')) {
    errorCode = ERROR_CODES.EMAIL_SERVICE_FAILED;
    statusCode = 503;
    message = ERROR_MESSAGES[errorCode];
  } else if (err.message?.includes('OAuth') || err.message?.includes('Google')) {
    errorCode = ERROR_CODES.GOOGLE_OAUTH_FAILED;
    statusCode = 500;
    message = ERROR_MESSAGES[errorCode];
  }

  // ─── Default Response ─────────────────────────────────────────
  const finalStatusCode = err.statusCode || statusCode;
  
  return res.status(finalStatusCode).json({
    success: false,
    error: config.isDev ? err.message : (message || ERROR_MESSAGES[errorCode]),
    code: errorCode,
    ...(config.isDev && { details: { message: err.message, stack: err.stack } }),
  });
};

export default errorHandler;
