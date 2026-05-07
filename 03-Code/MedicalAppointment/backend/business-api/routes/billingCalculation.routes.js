/**
 * Billing Calculation Routes
 * Business logic routes for billing calculations
 * 
 * @module business-api/routes/billingCalculation.routes
 */

const express = require('express');
const router = express.Router();
const billingCalculationController = require('../controllers/billingCalculation.controller');
const { authMiddleware, requireRole } = require('../../shared/middleware/auth.middleware');

// Apply authentication to all routes
router.use(authMiddleware);

/**
 * @route   GET /api/v1/billing-calculations/my-billings
 * @desc    Get current patient's billings
 * @access  Patient
 */
router.get('/my-billings', requireRole('patient'), billingCalculationController.getMyBillings);

/**
 * @route   GET /api/v1/billing-calculations/calculate/:appointmentId
 * @desc    Calculate billing for an appointment
 * @access  Doctor, Admin
 */
router.get('/calculate/:appointmentId', requireRole(['doctor', 'admin']), billingCalculationController.calculateBilling);

/**
 * @route   POST /api/v1/billing-calculations/generate/:appointmentId
 * @desc    Generate billing record from calculation
 * @access  Doctor, Admin
 */
router.post('/generate/:appointmentId', requireRole(['doctor', 'admin']), billingCalculationController.generateBilling);

/**
 * @route   POST /api/v1/billing-calculations/payment/:billingId
 * @desc    Process payment for a billing
 * @access  Admin
 */
router.post('/payment/:billingId', requireRole('admin'), billingCalculationController.processPayment);

/**
 * @route   POST /api/v1/billing-calculations/insurance-claim/:billingId
 * @desc    Apply insurance claim to billing
 * @access  Admin
 */
router.post('/insurance-claim/:billingId', requireRole('admin'), billingCalculationController.applyInsuranceClaim);

/**
 * @route   GET /api/v1/billing-calculations/statistics
 * @desc    Get billing statistics
 * @access  Admin
 */
router.get('/statistics', requireRole('admin'), billingCalculationController.getStatistics);

module.exports = router;
