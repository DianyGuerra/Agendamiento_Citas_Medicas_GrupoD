/**
 * Prescription Routes
 * RESTful routes for prescription management
 * 
 * @module crud-api/routes/prescription.routes
 */

const express = require('express');
const router = express.Router();
const prescriptionController = require('../controllers/prescription.controller');
const { authMiddleware, requireRole } = require('../../shared/middleware/auth.middleware');

// Apply authentication to all routes
router.use(authMiddleware);

/**
 * @route   GET /api/v1/prescriptions
 * @desc    Get prescriptions for current user
 * @access  Patient, Doctor
 */
router.get('/', requireRole(['patient', 'doctor']), prescriptionController.getByUser);

/**
 * @route   POST /api/v1/prescriptions/generate-qr-codes
 * @desc    Generate QR codes for all existing prescriptions without QR
 * @access  Admin
 */
router.post('/generate-qr-codes', requireRole('admin'), prescriptionController.generateMissingQRCodes);

/**
 * @route   GET /api/v1/prescriptions/appointment/:appointmentId
 * @desc    Get prescriptions for an appointment
 * @access  Doctor, Admin
 */
router.get('/appointment/:appointmentId', requireRole(['doctor', 'admin']), prescriptionController.getByAppointment);

/**
 * @route   GET /api/v1/prescriptions/:id
 * @desc    Get prescription by ID with QR code
 * @access  Patient, Doctor, Admin
 */
router.get('/:id', prescriptionController.getById);

/**
 * @route   POST /api/v1/prescriptions
 * @desc    Create prescription
 * @access  Doctor
 */
router.post('/', requireRole('doctor'), prescriptionController.create);

/**
 * @route   PUT /api/v1/prescriptions/:id
 * @desc    Update prescription
 * @access  Doctor
 */
router.put('/:id', requireRole('doctor'), prescriptionController.update);

/**
 * @route   DELETE /api/v1/prescriptions/:id
 * @desc    Deactivate prescription (soft delete)
 * @access  Doctor, Admin
 */
router.delete('/:id', requireRole(['doctor', 'admin']), prescriptionController.delete);

module.exports = router;
