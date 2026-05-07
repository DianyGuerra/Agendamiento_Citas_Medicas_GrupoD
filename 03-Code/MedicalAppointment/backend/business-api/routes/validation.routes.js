/**
 * Validation Routes
 * Business logic routes for data validation
 * 
 * @module business-api/routes/validation.routes
 */

const express = require('express');
const router = express.Router();
const validationController = require('../controllers/validation.controller');
const { authMiddleware, requireRole } = require('../../shared/middleware/auth.middleware');

/**
 * @route   POST /api/v1/validations/appointment
 * @desc    Validate appointment booking data
 * @access  Public (for form validation before submit)
 */
router.post('/appointment', validationController.validateAppointment);

/**
 * @route   POST /api/v1/validations/schedule
 * @desc    Validate schedule configuration
 * @access  Public
 */
router.post('/schedule', validationController.validateSchedule);

/**
 * @route   POST /api/v1/validations/medical-record
 * @desc    Validate medical record data
 * @access  Public
 */
router.post('/medical-record', validationController.validateMedicalRecord);

/**
 * @route   POST /api/v1/validations/prescription
 * @desc    Validate prescription data
 * @access  Public
 */
router.post('/prescription', validationController.validatePrescription);

// Protected routes
router.use(authMiddleware);

/**
 * @route   GET /api/v1/validations/patient-profile/me
 * @desc    Validate current user's patient profile
 * @access  Patient
 */
router.get('/patient-profile/me', requireRole('patient'), validationController.validateMyProfile);

/**
 * @route   GET /api/v1/validations/patient-profile/:patientUserId
 * @desc    Validate patient profile completeness
 * @access  Admin, Doctor
 */
router.get('/patient-profile/:patientUserId', requireRole(['admin', 'doctor']), validationController.validatePatientProfile);

module.exports = router;
