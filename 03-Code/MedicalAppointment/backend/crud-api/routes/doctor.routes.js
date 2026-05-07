/**
 * Doctor Routes
 * RESTful routes for doctor management
 * 
 * @module crud-api/routes/doctor.routes
 */

const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctor.controller');
const { authMiddleware, requireRole } = require('../../shared/middleware/auth.middleware');

// Public routes (no auth required)
/**
 * @route   GET /api/v1/doctors
 * @desc    Get all active doctors (public for patient booking)
 * @access  Public
 */
router.get('/', doctorController.getAll);

/**
 * @route   GET /api/v1/doctors/specialty/:specialtyId
 * @desc    Get doctors by specialty
 * @access  Public
 */
router.get('/specialty/:specialtyId', doctorController.getBySpecialty);

// Protected routes - MUST be before /:id route
/**
 * @route   GET /api/v1/doctors/me
 * @desc    Get current doctor profile
 * @access  Doctor
 */
router.get('/me', authMiddleware, requireRole('doctor'), doctorController.getProfile);

/**
 * @route   PUT /api/v1/doctors/me
 * @desc    Update current doctor profile
 * @access  Doctor
 */
router.put('/me', authMiddleware, requireRole('doctor'), doctorController.updateProfile);

/**
 * @route   GET /api/v1/doctors/my-patients
 * @desc    Get patients of the current doctor
 * @access  Doctor
 */
router.get('/my-patients', authMiddleware, requireRole('doctor'), doctorController.getMyPatients);

/**
 * @route   POST /api/v1/doctors
 * @desc    Create new doctor (admin only)
 * @access  Admin
 */
router.post('/', authMiddleware, requireRole('admin'), doctorController.create);

/**
 * @route   POST /api/v1/doctors/with-user
 * @desc    Create new doctor with user account (admin only)
 * @access  Admin
 */
router.post('/with-user', authMiddleware, requireRole('admin'), doctorController.createWithUser);

// Parameterized routes - MUST be after specific routes
/**
 * @route   GET /api/v1/doctors/:id
 * @desc    Get doctor by ID
 * @access  Public
 */
router.get('/:id', doctorController.getById);

/**
 * @route   PUT /api/v1/doctors/:id
 * @desc    Update doctor by ID (admin only)
 * @access  Admin
 */
router.put('/:id', authMiddleware, requireRole('admin'), doctorController.update);

/**
 * @route   POST /api/v1/doctors/:id/reset-password
 * @desc    Reset doctor password to a new temporary password (admin only)
 * @access  Admin
 */
router.post('/:id/reset-password', authMiddleware, requireRole('admin'), doctorController.resetPassword);

/**
 * @route   DELETE /api/v1/doctors/:id
 * @desc    Soft delete doctor (admin only)
 * @access  Admin
 */
router.delete('/:id', authMiddleware, requireRole('admin'), doctorController.delete);

module.exports = router;
