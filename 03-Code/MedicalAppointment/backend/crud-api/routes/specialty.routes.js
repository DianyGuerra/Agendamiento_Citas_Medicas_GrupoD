/**
 * Specialty Routes
 * RESTful routes for specialty management
 * 
 * @module crud-api/routes/specialty.routes
 */

const express = require('express');
const router = express.Router();
const specialtyController = require('../controllers/specialty.controller');
const { authMiddleware, requireRole } = require('../../shared/middleware/auth.middleware');

/**
 * @route   GET /api/v1/specialties
 * @desc    Get all specialties
 * @access  Public
 */
router.get('/', specialtyController.getAll);

/**
 * @route   GET /api/v1/specialties/stats
 * @desc    Get specialty statistics
 * @access  Public
 */
router.get('/stats', specialtyController.getStats);

/**
 * @route   GET /api/v1/specialties/:id
 * @desc    Get specialty by ID
 * @access  Public
 */
router.get('/:id', specialtyController.getById);

// Protected routes (admin only)
/**
 * @route   POST /api/v1/specialties
 * @desc    Create new specialty
 * @access  Admin
 */
router.post('/', authMiddleware, requireRole('admin'), specialtyController.create);

/**
 * @route   PUT /api/v1/specialties/:id
 * @desc    Update specialty
 * @access  Admin
 */
router.put('/:id', authMiddleware, requireRole('admin'), specialtyController.update);

/**
 * @route   DELETE /api/v1/specialties/:id
 * @desc    Soft delete specialty
 * @access  Admin
 */
router.delete('/:id', authMiddleware, requireRole('admin'), specialtyController.delete);

module.exports = router;
