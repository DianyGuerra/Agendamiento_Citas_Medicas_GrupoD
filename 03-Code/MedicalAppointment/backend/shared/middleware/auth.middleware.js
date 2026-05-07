/**
 * Authentication Middleware
 * Shared authentication middleware for all API services
 * 
 * @module shared/middleware/auth.middleware
 */

const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt.config');
const { supabase } = require('../config/database.config');
const { AuthorizationError } = require('../errors');
const { ErrorMessages } = require('../constants/error-messages.constants');

/**
 * Verifies JWT token and attaches user to request
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {Function} next - Next middleware
 */
const authMiddleware = async (req, res, next) => {
  // Skip OPTIONS requests (preflight)
  if (req.method === 'OPTIONS') {
    return next();
  }

  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthorizationError(ErrorMessages.NO_TOKEN, 'NO_TOKEN');
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      throw new AuthorizationError(ErrorMessages.NO_TOKEN, 'NO_TOKEN');
    }

    // Verify token
    const decoded = jwt.verify(token, jwtConfig.secret);
    const userId = decoded.id || decoded.userId;

    // Fetch user with role
    const { data: user, error } = await supabase
      .from('users')
      .select(`
        id,
        email,
        first_name,
        last_name,
        is_active,
        roles:role_id (
          id,
          name,
          code
        )
      `)
      .eq('id', userId)
      .single();

    if (error || !user) {
      throw new AuthorizationError(ErrorMessages.USER_NOT_FOUND, 'USER_NOT_FOUND');
    }

    if (!user.is_active) {
      throw new AuthorizationError(ErrorMessages.USER_INACTIVE, 'USER_INACTIVE');
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.roles.name,
      roleCode: user.roles.code,
      roleId: user.roles.id
    };

    next();

  } catch (error) {
    if (error instanceof AuthorizationError) {
      return res.status(error.statusCode).json(error.toJSON());
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expirado',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: ErrorMessages.INVALID_TOKEN,
        code: 'INVALID_TOKEN'
      });
    }

    console.error('Auth middleware error:', error.message);
    return res.status(401).json({ 
      error: ErrorMessages.INVALID_TOKEN,
      code: 'AUTH_ERROR'
    });
  }
};

/**
 * Creates a role-based access control middleware
 * @param {...string} allowedRoles - Allowed role names (can be strings or arrays)
 * @returns {Function} Express middleware
 */
const requireRole = (...allowedRoles) => {
  // Flatten in case array was passed: requireRole(['admin', 'doctor'])
  const flatRoles = allowedRoles.flat();
  
  return (req, res, next) => {
    // Skip OPTIONS requests
    if (req.method === 'OPTIONS') {
      return next();
    }

    if (!req.user) {
      return res.status(401).json({ 
        error: 'No autenticado',
        code: 'NOT_AUTHENTICATED'
      });
    }

    // Normalize role comparison (case-insensitive)
    const userRole = req.user.role?.toLowerCase();
    const normalizedAllowedRoles = flatRoles.map(r => r?.toLowerCase());

    if (!normalizedAllowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: ErrorMessages.FORBIDDEN,
        code: 'FORBIDDEN',
        required: flatRoles,
        current: req.user.role
      });
    }

    next();
  };
};

/**
 * Optional authentication - attaches user if token present, continues otherwise
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {Function} next - Next middleware
 */
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, jwtConfig.secret);
    const userId = decoded.id || decoded.userId;

    const { data: user } = await supabase
      .from('users')
      .select(`
        id,
        email,
        first_name,
        last_name,
        is_active,
        roles:role_id (name, code)
      `)
      .eq('id', userId)
      .single();

    if (user && user.is_active) {
      req.user = {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.roles.name,
        roleCode: user.roles.code
      };
    }
  } catch (error) {
    // Token invalid but continue without user
    console.warn('Optional auth - invalid token:', error.message);
  }

  next();
};

module.exports = {
  authMiddleware,
  requireRole,
  optionalAuth
};
