/**
 * Auth Routes
 * @module external-api/routes/auth.routes
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const googleAuthService = require('../services/googleAuth.service');
const { authMiddleware } = require('../../shared/middleware/auth.middleware');
const { validate, schemas } = require('../../shared/middleware/validation.middleware');

// =============================================================================
// GOOGLE OAUTH ROUTES
// =============================================================================

/**
 * @route GET /auth/google
 * @desc Redirect to Google OAuth
 * @access Public
 */
router.get('/google', (req, res) => {
  const authUrl = googleAuthService.getGoogleAuthUrl();
  res.redirect(authUrl);
});

/**
 * @route GET /auth/google/callback
 * @desc Google OAuth callback
 * @access Public
 */
router.get('/google/callback', async (req, res) => {
  try {
    const { code, error } = req.query;

    if (error) {
      console.error('Google OAuth error:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      return res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
    }

    if (!code) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      return res.redirect(`${frontendUrl}/login?error=no_code`);
    }

    const result = await googleAuthService.handleGoogleCallback(code);

    // Redirect to frontend with token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const userJson = encodeURIComponent(JSON.stringify(result.user));
    
    res.redirect(
      `${frontendUrl}/auth/callback?token=${result.token}&user=${userJson}`
    );
  } catch (error) {
    console.error('Google callback error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/login?error=auth_failed&message=${encodeURIComponent(error.message)}`);
  }
});

// =============================================================================
// LOCAL AUTH ROUTES
// =============================================================================

/**
 * @route POST /auth/register
 * @desc Register a new user
 * @access Public
 */
router.post(
  '/register',
  validate(schemas.auth.register),
  authController.register
);

/**
 * @route POST /auth/login
 * @desc Login user
 * @access Public
 */
router.post(
  '/login',
  validate(schemas.auth.login),
  authController.login
);

/**
 * @route POST /auth/password-reset/request
 * @desc Request password reset
 * @access Public
 */
router.post(
  '/password-reset/request',
  authController.requestPasswordReset
);

/**
 * @route POST /auth/password-reset/confirm
 * @desc Reset password with token
 * @access Public
 */
router.post(
  '/password-reset/confirm',
  authController.resetPassword
);

/**
 * @route POST /auth/change-password
 * @desc Change password (authenticated)
 * @access Private
 */
router.post(
  '/change-password',
  authMiddleware,
  authController.changePassword
);

/**
 * @route POST /auth/refresh-token
 * @desc Refresh JWT token
 * @access Public
 */
router.post(
  '/refresh-token',
  authController.refreshToken
);

/**
 * @route POST /auth/logout
 * @desc Logout user
 * @access Private
 */
router.post(
  '/logout',
  authMiddleware,
  authController.logout
);

/**
 * @route GET /auth/me
 * @desc Get current authenticated user
 * @access Private
 */
router.get(
  '/me',
  authMiddleware,
  authController.getCurrentUser
);

module.exports = router;
