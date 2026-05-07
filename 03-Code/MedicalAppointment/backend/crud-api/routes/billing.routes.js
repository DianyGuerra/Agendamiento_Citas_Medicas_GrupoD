/**
 * Billing Routes
 * RESTful routes for billing management
 * 
 * @module crud-api/routes/billing.routes
 */

const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billing.controller');
const { authMiddleware, requireRole } = require('../../shared/middleware/auth.middleware');

// Apply authentication to all routes
router.use(authMiddleware);

/**
 * @route   GET /api/v1/billings
 * @desc    Get billings for current user or filtered (admin)
 * @access  Authenticated
 */
router.get('/', billingController.getAll);

/**
 * @route   GET /api/v1/billings/:id
 * @desc    Get billing by ID with details
 * @access  Authenticated
 */
router.get('/:id', billingController.getById);

/**
 * @route   POST /api/v1/billings
 * @desc    Create billing
 * @access  Doctor, Admin
 */
router.post('/', requireRole(['doctor', 'admin']), billingController.create);

/**
 * @route   PATCH /api/v1/billings/:id/status
 * @desc    Update billing status
 * @access  Admin
 */
router.patch('/:id/status', requireRole('admin'), billingController.updateStatus);

/**
 * @route   DELETE /api/v1/billings/:id
 * @desc    Cancel billing (soft delete)
 * @access  Admin
 */
router.delete('/:id', requireRole('admin'), billingController.delete);

module.exports = router;
