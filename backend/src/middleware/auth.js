import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';

/**
 * JWT Authentication Middleware
 * Extracts Bearer token from Authorization header, verifies it,
 * and attaches the user document to req.user
 */
const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Please provide a valid token.',
      });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication token is missing.',
      });
    }

    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret);

    // Find user
    const user = await User.findById(decoded.userId).lean();

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found. Token may be invalid.',
      });
    }

    req.user = user;
    req.userId = user._id.toString();
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token has expired. Please log in again.',
      });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token.',
      });
    }

    logger.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication failed.',
    });
  }
};

export default auth;
