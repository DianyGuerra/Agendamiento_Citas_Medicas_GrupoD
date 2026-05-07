/**
 * Error Handler Middleware
 * Global error handling for consistent error responses
 * 
 * @module shared/middleware/errorHandler.middleware
 */

const { AppError } = require('../errors');
const { HttpStatus } = require('../constants/http.constants');
const { ErrorMessages } = require('../constants/error-messages.constants');

/**
 * Global error handler middleware
 * @param {Error} err - Error object
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {Function} next - Next middleware
 */
const errorHandler = (err, req, res, next) => {
  // Log error for debugging
  console.error(`[ERROR] ${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  console.error('Message:', err.message);
  console.error('Stack:', err.stack);

  // Handle operational errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json(err.toJSON());
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(HttpStatus.UNAUTHORIZED).json({
      error: ErrorMessages.INVALID_TOKEN,
      code: 'JWT_ERROR'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(HttpStatus.UNAUTHORIZED).json({
      error: 'Token expirado',
      code: 'TOKEN_EXPIRED'
    });
  }

  // Handle Supabase errors
  if (err.code && err.code.startsWith('PGRST')) {
    const statusCode = err.code === 'PGRST116' ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
    return res.status(statusCode).json({
      error: err.message || ErrorMessages.DATABASE_ERROR,
      code: err.code
    });
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    return res.status(HttpStatus.BAD_REQUEST).json({
      error: err.message,
      code: 'VALIDATION_ERROR',
      details: err.details
    });
  }

  // Default to 500 Internal Server Error
  const statusCode = err.statusCode || HttpStatus.INTERNAL_SERVER_ERROR;
  const message = process.env.NODE_ENV === 'production' 
    ? ErrorMessages.INTERNAL_ERROR 
    : err.message;

  res.status(statusCode).json({
    error: message,
    code: 'INTERNAL_ERROR'
  });
};

/**
 * 404 Not Found handler
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
const notFoundHandler = (req, res) => {
  console.warn(`[404] Route not found: ${req.method} ${req.originalUrl}`);
  res.status(HttpStatus.NOT_FOUND).json({
    error: `Ruta no encontrada: ${req.originalUrl}`,
    code: 'ROUTE_NOT_FOUND'
  });
};

/**
 * Async handler wrapper to catch promise rejections
 * @param {Function} fn - Async function
 * @returns {Function} Express middleware
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler
};
