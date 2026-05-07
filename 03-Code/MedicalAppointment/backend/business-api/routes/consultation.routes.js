/**
 * Consultation Routes
 * Business logic routes for consultation workflows
 * 
 * @module business-api/routes/consultation.routes
 */

const express = require('express');
const router = express.Router();
const consultationController = require('../controllers/consultation.controller');
const { authMiddleware, requireRole } = require('../../shared/middleware/auth.middleware');

// Apply authentication to all routes
router.use(authMiddleware);

/**
 * @route   POST /api/v1/consultations/start/:appointmentId
 * @desc    Start a consultation workflow
 * @access  Doctor
 */
router.post('/start/:appointmentId', requireRole('doctor'), consultationController.startConsultation);

/**
 * @route   POST /api/v1/consultations/complete/:appointmentId
 * @desc    Complete a consultation with notes
 * @access  Doctor
 */
router.post('/complete/:appointmentId', requireRole('doctor'), consultationController.completeConsultation);

/**
 * @route   GET /api/v1/consultations/patient/:patientUserId/summary
 * @desc    Get consultation summary for a patient
 * @access  Doctor, Admin
 */
router.get('/patient/:patientUserId/summary', requireRole(['doctor', 'admin']), consultationController.getPatientSummary);

/**
 * @route   GET /api/v1/consultations/patient/:patientUserId/appointments
 * @desc    Get all appointments history for a patient (all statuses)
 * @access  Doctor, Admin
 */
router.get('/patient/:patientUserId/appointments', requireRole(['doctor', 'admin']), consultationController.getPatientAppointments);

/**
 * @route   GET /api/v1/consultations/:appointmentId/prescriptions
 * @desc    Get prescriptions for an appointment
 * @access  Doctor
 */
router.get('/:appointmentId/prescriptions', requireRole('doctor'), consultationController.getPrescriptions);

/**
 * @route   POST /api/v1/consultations/:appointmentId/prescription
 * @desc    Add prescription during consultation
 * @access  Doctor
 */
router.post('/:appointmentId/prescription', requireRole('doctor'), consultationController.addPrescription);

/**
 * @route   POST /api/v1/consultations/:appointmentId/create-follow-up
 * @desc    Create missing follow-up appointment from saved consultation notes
 * @access  Doctor
 */
router.post('/:appointmentId/create-follow-up', requireRole('doctor'), consultationController.createFollowUpAppointment);

module.exports = router;
