/**
 * Medical Service Routes
 * CRUD routes for medical services catalog
 * 
 * @module crud-api/routes/medicalService.routes
 */

const express = require('express');
const router = express.Router();
const medicalServiceController = require('../controllers/medicalService.controller');
const { authMiddleware, requireRole } = require('../../shared/middleware/auth.middleware');

// Apply authentication to all routes
router.use(authMiddleware);

/**
 * @route   GET /api/v1/medical-services
 * @desc    Get all medical services (filterable by category or specialty)
 * @access  All authenticated users
 */
router.get('/', medicalServiceController.getAll);

/**
 * @route   GET /api/v1/medical-services/categories
 * @desc    Get all service categories
 * @access  All authenticated users
 */
router.get('/categories', medicalServiceController.getCategories);

/**
 * @route   GET /api/v1/medical-services/:id
 * @desc    Get medical service by ID
 * @access  All authenticated users
 */
router.get('/:id', medicalServiceController.getById);

/**
 * @route   POST /api/v1/medical-services
 * @desc    Create new medical service
 * @access  Admin only
 */
router.post('/', requireRole('admin'), medicalServiceController.create);

/**
 * @route   PUT /api/v1/medical-services/:id
 * @desc    Update medical service
 * @access  Admin only
 */
router.put('/:id', requireRole('admin'), medicalServiceController.update);

/**
 * @route   DELETE /api/v1/medical-services/:id
 * @desc    Delete medical service
 * @access  Admin only
 */
router.delete('/:id', requireRole('admin'), medicalServiceController.delete);

module.exports = router;
