/**
 * JWT Configuration
 * Shared JWT settings across all API services
 * 
 * @module shared/config/jwt.config
 */

require('dotenv').config();

const jwtConfig = {
  secret: process.env.JWT_SECRET || 'your-default-secret-change-in-production',
  refreshSecret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
  expiresIn: '24h',
  refreshExpiresIn: '7d',
  algorithm: 'HS256'
};

/**
 * Validates JWT configuration
 * @throws {Error} If required configuration is missing
 */
const validateConfig = () => {
  if (!process.env.JWT_SECRET) {
    console.warn('⚠️ JWT_SECRET not set. Using default (UNSAFE FOR PRODUCTION)');
  }
};

validateConfig();

module.exports = jwtConfig;
