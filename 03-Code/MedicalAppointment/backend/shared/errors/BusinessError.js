/**
 * Business Error
 * Error class for business logic failures
 * 
 * @module shared/errors/BusinessError
 */

const AppError = require('./AppError');
const { HttpStatus } = require('../constants/http.constants');

class BusinessError extends AppError {
  /**
   * @param {string} message - Error message
   * @param {string} [code] - Business error code
   * @param {Object} [details] - Additional details
   */
  constructor(message, code = 'BUSINESS_RULE_VIOLATION', details = null) {
    super(message, HttpStatus.CONFLICT, code, details);
    this.name = 'BusinessError';
  }
}

module.exports = BusinessError;
