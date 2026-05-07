/**
 * Authorization Error
 * Error class for authentication/authorization failures
 * 
 * @module shared/errors/AuthorizationError
 */

const AppError = require('./AppError');
const { HttpStatus } = require('../constants/http.constants');

class AuthorizationError extends AppError {
  /**
   * @param {string} message - Error message
   * @param {string} [code] - Specific auth error code
   */
  constructor(message = 'No autorizado', code = 'UNAUTHORIZED') {
    const statusCode = code === 'FORBIDDEN' ? HttpStatus.FORBIDDEN : HttpStatus.UNAUTHORIZED;
    super(message, statusCode, code);
    this.name = 'AuthorizationError';
  }
}

module.exports = AuthorizationError;
