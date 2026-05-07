/**
 * Scheduling Routes
 * Business logic routes for appointment scheduling
 * 
 * @module business-api/routes/scheduling.routes
 */

const express = require('express');
const router = express.Router();
const schedulingController = require('../controllers/scheduling.controller');
const { authMiddleware, requireRole } = require('../../shared/middleware/auth.middleware');

// =========================================================================
// Public Routes (no auth required)
// =========================================================================

/**
 * @route   POST /api/v1/scheduling/confirm-public/:appointmentId
 * @desc    Confirm an appointment publicly (via email link, no auth required)
 * @access  Public
 */
router.post('/confirm-public/:appointmentId', schedulingController.confirmAppointmentPublic);

// =========================================================================
// Protected Routes (auth required)
// =========================================================================

// Apply authentication to remaining routes
router.use(authMiddleware);

/**
 * @route   POST /api/v1/scheduling/book
 * @desc    Book a new appointment
 * @access  Patient
 */
router.post('/book', requireRole('patient'), schedulingController.bookAppointment);

/**
 * @route   PUT /api/v1/scheduling/reschedule/:appointmentId
 * @desc    Reschedule an existing appointment
 * @access  Patient, Admin
 */
router.put('/reschedule/:appointmentId', requireRole(['patient', 'admin']), schedulingController.rescheduleAppointment);

/**
 * @route   POST /api/v1/scheduling/cancel/:appointmentId
 * @desc    Cancel an appointment
 * @access  Patient, Doctor, Admin
 */
router.post('/cancel/:appointmentId', schedulingController.cancelAppointment);

/**
 * @route   POST /api/v1/scheduling/confirm/:appointmentId
 * @desc    Confirm an appointment
 * @access  Doctor, Admin
 */
router.post('/confirm/:appointmentId', requireRole(['doctor', 'admin']), schedulingController.confirmAppointment);

/**
 * @route   POST /api/v1/scheduling/start/:appointmentId
 * @desc    Start a consultation
 * @access  Doctor
 */
router.post('/start/:appointmentId', requireRole('doctor'), schedulingController.startConsultation);

/**
 * @route   POST /api/v1/scheduling/complete/:appointmentId
 * @desc    Complete a consultation
 * @access  Doctor
 */
router.post('/complete/:appointmentId', requireRole('doctor'), schedulingController.completeConsultation);

/**
 * @route   POST /api/v1/scheduling/no-show/:appointmentId
 * @desc    Mark patient as no-show
 * @access  Doctor, Admin
 */
router.post('/no-show/:appointmentId', requireRole(['doctor', 'admin']), schedulingController.markNoShow);

/**
 * @route   GET /api/v1/scheduling/statistics/doctor/:doctorId
 * @desc    Get appointment statistics for a doctor
 * @access  Doctor, Admin
 */
router.get('/statistics/doctor/:doctorId', requireRole(['doctor', 'admin']), schedulingController.getDoctorStatistics);

/**
 * @route   POST /api/v1/scheduling/cleanup-past
 * @desc    Mark past appointments as no_show automatically
 * @access  Doctor, Admin
 */
router.post('/cleanup-past', requireRole(['doctor', 'admin']), schedulingController.cleanupPastAppointments);

module.exports = router;
