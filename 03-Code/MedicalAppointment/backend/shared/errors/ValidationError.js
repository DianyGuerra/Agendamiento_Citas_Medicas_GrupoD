/**
 * Validation Error
 * Error class for validation failures
 * 
 * @module shared/errors/ValidationError
 */

const AppError = require('./AppError');
const { HttpStatus } = require('../constants/http.constants');

class ValidationError extends AppError {
  /**
   * @param {string} message - Error message
   * @param {Array|Object} [errors] - Validation errors
   */
  constructor(message, errors = null) {
    super(message, HttpStatus.BAD_REQUEST, 'VALIDATION_ERROR', { errors });
    this.name = 'ValidationError';
  }
}

module.exports = ValidationError;
