/**
 * Auth Controller
 * Handles HTTP requests for authentication
 * 
 * @module external-api/controllers/AuthController
 */

const authService = require('../services/auth.service');
const emailService = require('../services/email.service');
const ResponseBuilder = require('../../shared/utils/responseBuilder.utils');
const { asyncHandler } = require('../../shared/middleware/errorHandler.middleware');

class AuthController {
  /**
   * POST /auth/register
   * Register a new user
   */
  register = asyncHandler(async (req, res) => {
    const result = await authService.register(req.body);

    // Send welcome email
    try {
      await emailService.sendWelcomeEmail({
        email: result.user.email,
        userName: result.user.first_name,
        role: result.user.role || 'patient'
      });
    } catch (emailError) {
      console.error('Error sending welcome email:', emailError);
    }

    return ResponseBuilder.created(res, result, result.message);
  });

  /**
   * POST /auth/login
   * Login user
   */
  login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    
    console.log('[DEBUG] Login attempt for email:', email);
    
    const result = await authService.login(email, password);

    return ResponseBuilder.success(res, result, 200, result.message);
  });

  /**
   * POST /auth/password-reset/request
   * Request password reset
   */
  requestPasswordReset = asyncHandler(async (req, res) => {
    const { email } = req.body;

    const result = await authService.requestPasswordReset(email);

    // Send password reset email
    if (result.resetToken) {
      try {
        await emailService.sendPasswordReset({
          email,
          userName: result.userName,
          resetToken: result.resetToken
        });
      } catch (emailError) {
        console.error('Error sending password reset email:', emailError);
      }
    }

    return ResponseBuilder.success(res, { 
      message: result.message 
    });
  });

  /**
   * POST /auth/password-reset/confirm
   * Reset password with token
   */
  resetPassword = asyncHandler(async (req, res) => {
    const { token, newPassword } = req.body;

    const result = await authService.resetPassword(token, newPassword);

    return ResponseBuilder.success(res, result, 200, result.message);
  });

  /**
   * POST /auth/change-password
   * Change password (authenticated)
   */
  changePassword = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    const result = await authService.changePassword(userId, currentPassword, newPassword);

    return ResponseBuilder.success(res, result, 200, result.message);
  });

  /**
   * POST /auth/refresh-token
   * Refresh JWT token
   */
  refreshToken = asyncHandler(async (req, res) => {
    const { token } = req.body;

    const result = await authService.refreshToken(token);

    return ResponseBuilder.success(res, result);
  });

  /**
   * POST /auth/logout
   * Logout user
   */
  logout = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const sessionId = req.body?.sessionId || null;

    const result = await authService.logout(userId, sessionId);

    return ResponseBuilder.success(res, result, 200, result.message);
  });

  /**
   * GET /auth/me
   * Get current authenticated user
   */
  getCurrentUser = asyncHandler(async (req, res) => {
    return ResponseBuilder.success(res, req.user);
  });
}

module.exports = new AuthController();
