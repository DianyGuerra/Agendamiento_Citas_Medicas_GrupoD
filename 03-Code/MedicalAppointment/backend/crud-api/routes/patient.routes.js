/**
 * Patient Routes
 * RESTful routes for patient management
 * 
 * @module crud-api/routes/patient.routes
 */

const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patient.controller');
const { authMiddleware, requireRole } = require('../../shared/middleware/auth.middleware');

// Apply authentication to all routes
router.use(authMiddleware);

/**
 * @route   GET /api/v1/patients/stats
 * @desc    Get patient statistics
 * @access  Admin
 */
router.get('/stats', requireRole('admin'), patientController.getStats);

/**
 * @route   GET /api/v1/patients
 * @desc    Get all patients (admin/doctor)
 * @access  Admin, Doctor
 */
router.get('/', requireRole(['admin', 'doctor']), patientController.getAll);

/**
 * @route   GET /api/v1/patients/me
 * @desc    Get current patient profile
 * @access  Patient
 */
router.get('/me', requireRole('patient'), patientController.getProfile);

/**
 * @route   POST /api/v1/patients/with-user
 * @desc    Create patient with user account
 * @access  Admin
 */
router.post('/with-user', requireRole('admin'), patientController.createWithUser);

/**
 * @route   GET /api/v1/patients/user/:userId
 * @desc    Get patient by user ID
 * @access  Doctor, Admin
 */
router.get('/user/:userId', requireRole(['admin', 'doctor']), patientController.getByUserId);

/**
 * @route   GET /api/v1/patients/:id
 * @desc    Get patient by ID
 * @access  Admin, Doctor
 */
router.get('/:id', requireRole(['admin', 'doctor']), patientController.getById);

/**
 * @route   PUT /api/v1/patients/me
 * @desc    Update current patient profile
 * @access  Patient
 */
router.put('/me', requireRole('patient'), patientController.updateProfile);

/**
 * @route   PUT /api/v1/patients/:id
 * @desc    Update patient by ID (admin only)
 * @access  Admin
 */
router.put('/:id', requireRole('admin'), patientController.update);

/**
 * @route   DELETE /api/v1/patients/:id
 * @desc    Soft delete patient (admin only)
 * @access  Admin
 */
router.delete('/:id', requireRole('admin'), patientController.delete);

module.exports = router;
