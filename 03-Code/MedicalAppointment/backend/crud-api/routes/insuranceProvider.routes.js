/**
 * Insurance Provider Routes
 * CRUD routes for insurance providers
 * 
 * @module crud-api/routes/insuranceProvider.routes
 */

const express = require('express');
const router = express.Router();
const insuranceProviderController = require('../controllers/insuranceProvider.controller');
const { authMiddleware, requireRole } = require('../../shared/middleware/auth.middleware');

// Apply authentication to all routes
router.use(authMiddleware);

/**
 * @route   GET /api/v1/insurance-providers
 * @desc    Get all active insurance providers
 * @access  All authenticated users
 */
router.get('/', insuranceProviderController.getAll);

/**
 * @route   GET /api/v1/insurance-providers/:id
 * @desc    Get insurance provider by ID
 * @access  All authenticated users
 */
router.get('/:id', insuranceProviderController.getById);

/**
 * @route   GET /api/v1/insurance-providers/code/:code
 * @desc    Get insurance provider by code
 * @access  All authenticated users
 */
router.get('/code/:code', insuranceProviderController.getByCode);

/**
 * @route   POST /api/v1/insurance-providers
 * @desc    Create new insurance provider
 * @access  Admin only
 */
router.post('/', requireRole('admin'), insuranceProviderController.create);

/**
 * @route   PUT /api/v1/insurance-providers/:id
 * @desc    Update insurance provider
 * @access  Admin only
 */
router.put('/:id', requireRole('admin'), insuranceProviderController.update);

/**
 * @route   DELETE /api/v1/insurance-providers/:id
 * @desc    Delete insurance provider
 * @access  Admin only
 */
router.delete('/:id', requireRole('admin'), insuranceProviderController.delete);

module.exports = router;
