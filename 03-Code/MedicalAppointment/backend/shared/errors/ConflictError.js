/**
 * Conflict Error
 * Error for resource conflicts (e.g., duplicate entries)
 * 
 * @module shared/errors/ConflictError
 */

const AppError = require('./AppError');
const { HttpStatus } = require('../constants/http.constants');

class ConflictError extends AppError {
  /**
   * @param {string} message - Error message
   * @param {Object} [details] - Additional error details
   */
  constructor(message, details = null) {
    super(message, HttpStatus.CONFLICT, 'CONFLICT_ERROR', details);
  }
}

module.exports = ConflictError;
