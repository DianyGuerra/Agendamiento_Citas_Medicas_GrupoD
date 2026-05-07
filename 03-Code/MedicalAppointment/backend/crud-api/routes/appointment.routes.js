/**
 * Appointment Routes
 * RESTful routes for appointment management
 * 
 * @module crud-api/routes/appointment.routes
 */

const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointment.controller');
const { authMiddleware, requireRole } = require('../../shared/middleware/auth.middleware');

// Apply authentication to all routes
router.use(authMiddleware);

/**
 * @route   GET /api/v1/appointments
 * @desc    Get appointments for current user or all (admin)
 * @access  Authenticated
 */
router.get('/', appointmentController.getAll);

/**
 * @route   GET /api/v1/appointments/unbilled
 * @desc    Get completed appointments without billing (for invoice generation)
 * @access  Admin
 */
router.get('/unbilled', requireRole('admin'), appointmentController.getUnbilled);

/**
 * @route   GET /api/v1/appointments/patient
 * @desc    Get appointments for current logged-in patient
 * @access  Patient
 */
router.get('/patient', requireRole('patient'), appointmentController.getByPatient);

/**
 * @route   GET /api/v1/appointments/by-patient/:patientUserId
 * @desc    Get appointments for a specific patient (used by doctors)
 * @access  Doctor
 */
router.get('/by-patient/:patientUserId', requireRole('doctor'), appointmentController.getByPatientId);

/**
 * @route   GET /api/v1/appointments/doctor
 * @desc    Get appointments for current logged-in doctor
 * @access  Doctor
 */
router.get('/doctor', requireRole('doctor'), appointmentController.getByDoctor);

/**
 * @route   GET /api/v1/appointments/:id
 * @desc    Get appointment by ID
 * @access  Authenticated
 */
router.get('/:id', appointmentController.getById);

/**
 * @route   POST /api/v1/appointments
 * @desc    Create new appointment
 * @access  Patient
 */
router.post('/', requireRole('patient'), appointmentController.create);

/**
 * @route   PUT /api/v1/appointments/:id
 * @desc    Update appointment
 * @access  Authenticated (owner or admin)
 */
router.put('/:id', appointmentController.update);

/**
 * @route   PATCH /api/v1/appointments/:id
 * @desc    Partial update appointment (room, doctor assignment)
 * @access  Admin
 */
router.patch('/:id', requireRole('admin'), appointmentController.partialUpdate);

/**
 * @route   PATCH /api/v1/appointments/:id/status
 * @desc    Update appointment status
 * @access  Doctor, Admin
 */
router.patch('/:id/status', requireRole(['doctor', 'admin']), appointmentController.updateStatus);

/**
 * @route   PATCH /api/v1/appointments/:id/confirm
 * @desc    Confirm appointment
 * @access  Admin
 */
router.patch('/:id/confirm', requireRole('admin'), appointmentController.confirm);

/**
 * @route   PATCH /api/v1/appointments/:id/check-in
 * @desc    Register patient check-in
 * @access  Admin
 */
router.patch('/:id/check-in', requireRole('admin'), appointmentController.checkIn);

/**
 * @route   PATCH /api/v1/appointments/:id/cancel
 * @desc    Cancel appointment
 * @access  Admin
 */
router.patch('/:id/cancel', requireRole('admin'), appointmentController.cancel);

/**
 * @route   DELETE /api/v1/appointments/:id
 * @desc    Cancel appointment (soft delete)
 * @access  Authenticated (owner or admin)
 */
router.delete('/:id', appointmentController.delete);

module.exports = router;
