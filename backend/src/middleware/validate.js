import { body, param, validationResult } from 'express-validator';

/**
 * Middleware to check validation results and return errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array().map((e) => ({
        field: e.path,
        message: e.msg,
      })),
    });
  }
  next();
};

/**
 * Validation rules for creating a highlight
 */
export const validateHighlight = [
  body('text')
    .trim()
    .notEmpty()
    .withMessage('Highlighted text is required')
    .isLength({ max: 10000 })
    .withMessage('Text must be under 10,000 characters')
    .escape(),
  body('sourceUrl')
    .trim()
    .notEmpty()
    .withMessage('Source URL is required')
    .isURL({ require_protocol: true })
    .withMessage('Must be a valid URL with protocol'),
  body('pageTitle')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Page title must be under 500 characters'),
  handleValidationErrors,
];

/**
 * Validation for MongoDB ObjectId params
 */
export const validateObjectId = [
  param('id').isMongoId().withMessage('Invalid ID format'),
  handleValidationErrors,
];
