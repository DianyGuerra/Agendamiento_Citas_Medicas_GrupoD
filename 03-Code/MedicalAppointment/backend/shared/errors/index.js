/**
 * Error Classes Index
 * Exports all custom error classes
 * 
 * @module shared/errors
 */

const AppError = require('./AppError');
const ValidationError = require('./ValidationError');
const NotFoundError = require('./NotFoundError');
const AuthorizationError = require('./AuthorizationError');
const BusinessError = require('./BusinessError');
const ConflictError = require('./ConflictError');

module.exports = {
  AppError,
  ValidationError,
  NotFoundError,
  AuthorizationError,
  BusinessError,
  ConflictError
};
