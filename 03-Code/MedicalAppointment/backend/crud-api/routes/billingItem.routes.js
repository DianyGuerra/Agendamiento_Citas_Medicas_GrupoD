/**
 * Billing Item Routes
 * Routes for managing billing line items
 * 
 * @module crud-api/routes/billingItem.routes
 */

const express = require('express');
const router = express.Router();
const billingItemController = require('../controllers/billingItem.controller');
const { authMiddleware, requireRole } = require('../../shared/middleware/auth.middleware');

// Apply authentication to all routes
router.use(authMiddleware);

/**
 * @route   GET /api/v1/billing-items/billing/:billingId
 * @desc    Get all items for a billing
 * @access  Doctor, Admin
 */
router.get('/billing/:billingId', requireRole(['doctor', 'admin']), billingItemController.getByBilling);

/**
 * @route   POST /api/v1/billing-items
 * @desc    Add item to billing
 * @access  Doctor, Admin
 */
router.post('/', requireRole(['doctor', 'admin']), billingItemController.addItem);

/**
 * @route   DELETE /api/v1/billing-items/:id
 * @desc    Remove item from billing
 * @access  Doctor, Admin
 */
router.delete('/:id', requireRole(['doctor', 'admin']), billingItemController.removeItem);

module.exports = router;
