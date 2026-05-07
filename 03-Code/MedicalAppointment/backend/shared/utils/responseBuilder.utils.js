/**
 * Response Builder
 * Standardized API response builder
 * 
 * @module shared/utils/responseBuilder.utils
 */

const { HttpStatus } = require('../constants/http.constants');

class ResponseBuilder {
  /**
   * Sends a success response
   * @param {Response} res - Express response
   * @param {Object} data - Response data
   * @param {number} [statusCode=200] - HTTP status code
   * @param {string} [message] - Success message
   */
  static success(res, data, statusCode = HttpStatus.OK, message = null) {
    const response = {
      success: true,
      data
    };

    if (message) {
      response.message = message;
    }

    return res.status(statusCode).json(response);
  }

  /**
   * Sends a created response
   * @param {Response} res - Express response
   * @param {Object} data - Created resource
   * @param {string} [message] - Success message
   */
  static created(res, data, message = 'Recurso creado exitosamente') {
    return this.success(res, data, HttpStatus.CREATED, message);
  }

  /**
   * Sends a paginated response
   * @param {Response} res - Express response
   * @param {Array} items - Array of items
   * @param {Object} pagination - Pagination info
   */
  static paginated(res, items, pagination) {
    return res.status(HttpStatus.OK).json({
      success: true,
      data: items,
      pagination
    });
  }

  /**
   * Sends an error response
   * @param {Response} res - Express response
   * @param {string} message - Error message
   * @param {number} [statusCode=500] - HTTP status code
   * @param {string} [code] - Error code
   * @param {Object} [details] - Additional details
   */
  static error(res, message, statusCode = HttpStatus.INTERNAL_SERVER_ERROR, code = null, details = null) {
    const response = {
      success: false,
      error: message
    };

    if (code) {
      response.code = code;
    }

    if (details) {
      response.details = details;
    }

    return res.status(statusCode).json(response);
  }

  /**
   * Sends a validation error response
   * @param {Response} res - Express response
   * @param {Array} errors - Validation errors
   */
  static validationError(res, errors) {
    return this.error(
      res,
      'Errores de validación',
      HttpStatus.BAD_REQUEST,
      'VALIDATION_ERROR',
      { errors }
    );
  }

  /**
   * Sends a not found response
   * @param {Response} res - Express response
   * @param {string} resource - Resource name
   */
  static notFound(res, resource) {
    return this.error(
      res,
      `${resource} no encontrado`,
      HttpStatus.NOT_FOUND,
      'NOT_FOUND'
    );
  }

  /**
   * Sends an unauthorized response
   * @param {Response} res - Express response
   * @param {string} [message] - Error message
   */
  static unauthorized(res, message = 'No autorizado') {
    return this.error(res, message, HttpStatus.UNAUTHORIZED, 'UNAUTHORIZED');
  }

  /**
   * Sends a forbidden response
   * @param {Response} res - Express response
   * @param {string} [message] - Error message
   */
  static forbidden(res, message = 'Acceso denegado') {
    return this.error(res, message, HttpStatus.FORBIDDEN, 'FORBIDDEN');
  }

  /**
   * Sends a no content response
   * @param {Response} res - Express response
   */
  static noContent(res) {
    return res.status(HttpStatus.NO_CONTENT).send();
  }
}

module.exports = ResponseBuilder;
