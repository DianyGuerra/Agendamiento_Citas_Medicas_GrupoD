/**
 * User Routes
 * RESTful routes for user management
 * 
 * @module crud-api/routes/user.routes
 */

const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authMiddleware, requireRole } = require('../../shared/middleware/auth.middleware');

// Apply authentication to all routes
router.use(authMiddleware);

/**
 * @route   GET /api/v1/users
 * @desc    Get all users (admin only)
 * @access  Admin
 */
router.get('/', requireRole('admin'), userController.getAll);

/**
 * @route   GET /api/v1/users/me
 * @desc    Get current user profile
 * @access  Authenticated
 */
router.get('/me', userController.getCurrentUser);

/**
 * @route   GET /api/v1/users/:id
 * @desc    Get user by ID (admin only)
 * @access  Admin
 */
router.get('/:id', requireRole('admin'), userController.getById);

/**
 * @route   POST /api/v1/users
 * @desc    Create new user (admin only)
 * @access  Admin
 */
router.post('/', requireRole('admin'), userController.create);

/**
 * @route   PUT /api/v1/users/me
 * @desc    Update current user profile
 * @access  Authenticated
 */
router.put('/me', userController.updateCurrentUser);

/**
 * @route   PUT /api/v1/users/:id
 * @desc    Update user by ID (admin only)
 * @access  Admin
 */
router.put('/:id', requireRole('admin'), userController.update);

/**
 * @route   DELETE /api/v1/users/:id
 * @desc    Soft delete user (admin only)
 * @access  Admin
 */
router.delete('/:id', requireRole('admin'), userController.delete);

module.exports = router;
