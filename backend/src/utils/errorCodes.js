/**
 * Rewise AI — Error Code System
 * Provides standardized error codes for API responses
 * Makes error handling consistent, debuggable, and frontend-friendly
 */

export const ERROR_CODES = {
  // Authentication Errors (401-499)
  AUTH_INVALID_TOKEN: 'AUTH_001',
  AUTH_TOKEN_EXPIRED: 'AUTH_002',
  AUTH_MISSING_TOKEN: 'AUTH_003',
  AUTH_USER_NOT_FOUND: 'AUTH_004',
  AUTH_INVALID_CREDENTIALS: 'AUTH_005',

  // Validation Errors (400)
  VALIDATION_FAILED: 'VAL_001',
  INVALID_OBJECT_ID: 'VAL_002',
  INVALID_EMAIL: 'VAL_003',
  INVALID_URL: 'VAL_004',
  MISSING_REQUIRED_FIELD: 'VAL_005',

  // Resource Errors (404)
  RESOURCE_NOT_FOUND: 'RES_001',
  HIGHLIGHT_NOT_FOUND: 'RES_002',
  USER_NOT_FOUND: 'RES_003',

  // Conflict Errors (409)
  DUPLICATE_ENTRY: 'CONF_001',
  RESOURCE_ALREADY_EXISTS: 'CONF_002',

  // Rate Limiting Errors (429)
  RATE_LIMIT_EXCEEDED: 'RATE_001',
  AUTH_RATE_LIMIT_EXCEEDED: 'RATE_002',

  // AI Processing Errors (500)
  AI_PROCESSING_FAILED: 'AI_001',
  AI_PROVIDER_UNAVAILABLE: 'AI_002',
  AI_QUOTA_EXCEEDED: 'AI_003',

  // External Service Errors (503)
  MONGODB_CONNECTION_FAILED: 'EXT_001',
  REDIS_CONNECTION_FAILED: 'EXT_002',
  EMAIL_SERVICE_FAILED: 'EXT_003',
  GOOGLE_OAUTH_FAILED: 'EXT_004',

  // General Errors (500)
  INTERNAL_SERVER_ERROR: 'ERR_001',
  UNKNOWN_ERROR: 'ERR_999',
};

/**
 * Error messages mapping for user-facing responses
 */
export const ERROR_MESSAGES = {
  [ERROR_CODES.AUTH_INVALID_TOKEN]: 'Invalid authentication token.',
  [ERROR_CODES.AUTH_TOKEN_EXPIRED]: 'Your session has expired. Please log in again.',
  [ERROR_CODES.AUTH_MISSING_TOKEN]: 'Authentication token is required.',
  [ERROR_CODES.AUTH_USER_NOT_FOUND]: 'User not found.',
  [ERROR_CODES.AUTH_INVALID_CREDENTIALS]: 'Invalid email or password.',

  [ERROR_CODES.VALIDATION_FAILED]: 'The provided data failed validation.',
  [ERROR_CODES.INVALID_OBJECT_ID]: 'Invalid resource ID format.',
  [ERROR_CODES.INVALID_EMAIL]: 'Invalid email address.',
  [ERROR_CODES.INVALID_URL]: 'Invalid URL provided.',
  [ERROR_CODES.MISSING_REQUIRED_FIELD]: 'Required field is missing.',

  [ERROR_CODES.RESOURCE_NOT_FOUND]: 'Resource not found.',
  [ERROR_CODES.HIGHLIGHT_NOT_FOUND]: 'Highlight not found.',
  [ERROR_CODES.USER_NOT_FOUND]: 'User not found.',

  [ERROR_CODES.DUPLICATE_ENTRY]: 'This entry already exists.',
  [ERROR_CODES.RESOURCE_ALREADY_EXISTS]: 'Resource already exists.',

  [ERROR_CODES.RATE_LIMIT_EXCEEDED]: 'Too many requests. Please try again later.',
  [ERROR_CODES.AUTH_RATE_LIMIT_EXCEEDED]: 'Too many login attempts. Please try again later.',

  [ERROR_CODES.AI_PROCESSING_FAILED]: 'AI processing failed. Please try again.',
  [ERROR_CODES.AI_PROVIDER_UNAVAILABLE]: 'AI service is temporarily unavailable.',
  [ERROR_CODES.AI_QUOTA_EXCEEDED]: 'AI quota exceeded. Please try again later.',

  [ERROR_CODES.MONGODB_CONNECTION_FAILED]: 'Database connection failed.',
  [ERROR_CODES.REDIS_CONNECTION_FAILED]: 'Cache service failed.',
  [ERROR_CODES.EMAIL_SERVICE_FAILED]: 'Email service failed.',
  [ERROR_CODES.GOOGLE_OAUTH_FAILED]: 'Google authentication failed.',

  [ERROR_CODES.INTERNAL_SERVER_ERROR]: 'Internal server error. Please try again later.',
  [ERROR_CODES.UNKNOWN_ERROR]: 'An unknown error occurred.',
};

/**
 * HTTP Status code mapping for error codes
 */
export const ERROR_STATUS_CODES = {
  [ERROR_CODES.AUTH_INVALID_TOKEN]: 401,
  [ERROR_CODES.AUTH_TOKEN_EXPIRED]: 401,
  [ERROR_CODES.AUTH_MISSING_TOKEN]: 401,
  [ERROR_CODES.AUTH_USER_NOT_FOUND]: 401,
  [ERROR_CODES.AUTH_INVALID_CREDENTIALS]: 401,

  [ERROR_CODES.VALIDATION_FAILED]: 400,
  [ERROR_CODES.INVALID_OBJECT_ID]: 400,
  [ERROR_CODES.INVALID_EMAIL]: 400,
  [ERROR_CODES.INVALID_URL]: 400,
  [ERROR_CODES.MISSING_REQUIRED_FIELD]: 400,

  [ERROR_CODES.RESOURCE_NOT_FOUND]: 404,
  [ERROR_CODES.HIGHLIGHT_NOT_FOUND]: 404,
  [ERROR_CODES.USER_NOT_FOUND]: 404,

  [ERROR_CODES.DUPLICATE_ENTRY]: 409,
  [ERROR_CODES.RESOURCE_ALREADY_EXISTS]: 409,

  [ERROR_CODES.RATE_LIMIT_EXCEEDED]: 429,
  [ERROR_CODES.AUTH_RATE_LIMIT_EXCEEDED]: 429,

  [ERROR_CODES.AI_PROCESSING_FAILED]: 500,
  [ERROR_CODES.AI_PROVIDER_UNAVAILABLE]: 503,
  [ERROR_CODES.AI_QUOTA_EXCEEDED]: 429,

  [ERROR_CODES.MONGODB_CONNECTION_FAILED]: 503,
  [ERROR_CODES.REDIS_CONNECTION_FAILED]: 503,
  [ERROR_CODES.EMAIL_SERVICE_FAILED]: 503,
  [ERROR_CODES.GOOGLE_OAUTH_FAILED]: 500,

  [ERROR_CODES.INTERNAL_SERVER_ERROR]: 500,
  [ERROR_CODES.UNKNOWN_ERROR]: 500,
};

/**
 * Custom AppError class for throwing errors with codes
 */
export class AppError extends Error {
  constructor(code, message = null, statusCode = null, details = null) {
    const finalMessage = message || ERROR_MESSAGES[code];
    super(finalMessage);

    this.code = code;
    this.statusCode = statusCode || ERROR_STATUS_CODES[code] || 500;
    this.details = details;
    this.timestamp = new Date().toISOString();

    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      success: false,
      error: this.message,
      code: this.code,
      timestamp: this.timestamp,
      ...(this.details && { details: this.details }),
    };
  }
}

export default ERROR_CODES;
