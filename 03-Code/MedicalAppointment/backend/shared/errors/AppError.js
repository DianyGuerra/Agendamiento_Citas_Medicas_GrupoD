/**
 * Custom Application Error
 * Base error class for application-specific errors
 * 
 * @module shared/errors/AppError
 */

const { HttpStatus } = require('../constants/http.constants');

class AppError extends Error {
  /**
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   * @param {string} [code] - Application-specific error code
   * @param {Object} [details] - Additional error details
   */
  constructor(message, statusCode = HttpStatus.INTERNAL_SERVER_ERROR, code = null, details = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Converts error to JSON response format
   * @returns {Object}
   */
  toJSON() {
    return {
      error: this.message,
      code: this.code,
      details: this.details
    };
  }
}

module.exports = AppError;
