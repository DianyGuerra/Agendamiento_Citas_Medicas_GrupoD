/**
 * Not Found Error
 * Error class for resource not found
 * 
 * @module shared/errors/NotFoundError
 */

const AppError = require('./AppError');
const { HttpStatus } = require('../constants/http.constants');

class NotFoundError extends AppError {
  /**
   * @param {string} resource - Resource name
   * @param {string|number} [identifier] - Resource identifier
   */
  constructor(resource, identifier = null) {
    const message = identifier 
      ? `${resource} con ID '${identifier}' no encontrado`
      : `${resource} no encontrado`;
    super(message, HttpStatus.NOT_FOUND, 'NOT_FOUND', { resource, identifier });
    this.name = 'NotFoundError';
  }
}

module.exports = NotFoundError;
