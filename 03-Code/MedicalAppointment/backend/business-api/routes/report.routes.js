/**
 * Report Routes
 * Business logic routes for report generation
 * 
 * @module business-api/routes/report.routes
 */

const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { authMiddleware, requireRole } = require('../../shared/middleware/auth.middleware');

// Apply authentication to all routes
router.use(authMiddleware);

// ==================== DOCTOR ROUTES ====================

/**
 * @route   GET /api/v1/reports/my-stats
 * @desc    Get current doctor's statistics
 * @access  Doctor
 */
router.get('/my-stats', requireRole('doctor'), reportController.getMyStats);

/**
 * @route   GET /api/v1/reports/my-appointments
 * @desc    Get current doctor's appointment history
 * @access  Doctor
 */
router.get('/my-appointments', requireRole('doctor'), reportController.getMyAppointments);

/**
 * @route   GET /api/v1/reports/my-ratings
 * @desc    Get current doctor's ratings
 * @access  Doctor
 */
router.get('/my-ratings', requireRole('doctor'), reportController.getMyRatings);

// ==================== ADMIN ROUTES ====================

/**
 * @route   GET /api/v1/reports/appointments
 * @desc    Generate appointment report
 * @access  Admin, Doctor
 */
router.get('/appointments', requireRole(['admin', 'doctor']), reportController.getAppointmentReport);

/**
 * @route   GET /api/v1/reports/productivity
 * @desc    Generate doctor productivity report
 * @access  Admin
 */
router.get('/productivity', requireRole('admin'), reportController.getProductivityReport);

/**
 * @route   GET /api/v1/reports/patient-flow
 * @desc    Generate patient flow report
 * @access  Admin
 */
router.get('/patient-flow', requireRole('admin'), reportController.getPatientFlowReport);

/**
 * @route   GET /api/v1/reports/revenue
 * @desc    Generate revenue report
 * @access  Admin
 */
router.get('/revenue', requireRole('admin'), reportController.getRevenueReport);

/**
 * @route   GET /api/v1/reports/specialty-demand
 * @desc    Generate specialty demand report
 * @access  Admin
 */
router.get('/specialty-demand', requireRole('admin'), reportController.getSpecialtyDemandReport);

/**
 * @route   GET /api/v1/reports/general-stats
 * @desc    Get general statistics for admin dashboard
 * @access  Admin
 */
router.get('/general-stats', requireRole('admin'), reportController.getGeneralStats);

/**
 * @route   GET /api/v1/reports/doctor-stats
 * @desc    Get doctor statistics for admin dashboard
 * @access  Admin
 */
router.get('/doctor-stats', requireRole('admin'), reportController.getDoctorStats);

/**
 * @route   GET /api/v1/reports/advanced-stats
 * @desc    Get advanced statistics for admin dashboard
 * @access  Admin
 */
router.get('/advanced-stats', requireRole('admin'), reportController.getAdvancedStats);

module.exports = router;
