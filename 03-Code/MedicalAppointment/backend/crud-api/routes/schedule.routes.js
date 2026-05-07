/**
 * Schedule Routes
 * RESTful routes for schedule and schedule exception management
 * 
 * @module crud-api/routes/schedule.routes
 */

const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/schedule.controller');
const { authMiddleware, requireRole } = require('../../shared/middleware/auth.middleware');

/**
 * @route   GET /api/v1/schedules
 * @desc    Get all schedules or by doctor_id query param
 * @access  Public
 */
router.get('/', scheduleController.getAll);

/**
 * @route   GET /api/v1/schedules/doctor/:doctorId
 * @desc    Get doctor's schedule
 * @access  Public
 */
router.get('/doctor/:doctorId', scheduleController.getByDoctor);

// Protected routes
/**
 * @route   GET /api/v1/schedules/me
 * @desc    Get current doctor's schedule
 * @access  Doctor
 */
router.get('/me', authMiddleware, requireRole('doctor'), scheduleController.getCurrentDoctorSchedule);

/**
 * @route   PUT /api/v1/schedules/me
 * @desc    Update current doctor's schedule
 * @access  Doctor
 */
router.put('/me', authMiddleware, requireRole('doctor'), scheduleController.updateCurrentDoctorSchedule);

/**
 * @route   GET /api/v1/schedules/:id
 * @desc    Get schedule by ID
 * @access  Doctor, Admin
 */
router.get('/:id', authMiddleware, requireRole(['doctor', 'admin']), scheduleController.getById);

/**
 * @route   POST /api/v1/schedules
 * @desc    Create new schedule
 * @access  Doctor, Admin
 */
router.post('/', authMiddleware, requireRole(['doctor', 'admin']), scheduleController.create);

/**
 * @route   POST /api/v1/schedules/bulk
 * @desc    Bulk create/update schedules for a doctor
 * @access  Doctor, Admin
 */
router.post('/bulk', authMiddleware, requireRole(['doctor', 'admin']), scheduleController.bulkCreate);

/**
 * @route   PUT /api/v1/schedules/:id
 * @desc    Update schedule
 * @access  Doctor, Admin
 */
router.put('/:id', authMiddleware, requireRole(['doctor', 'admin']), scheduleController.update);

/**
 * @route   DELETE /api/v1/schedules/:id
 * @desc    Delete schedule
 * @access  Doctor, Admin
 */
router.delete('/:id', authMiddleware, requireRole(['doctor', 'admin']), scheduleController.delete);

// Schedule Exception routes
/**
 * @route   GET /api/v1/schedules/exceptions/doctor/:doctorId
 * @desc    Get doctor's exceptions
 * @access  Public
 */
router.get('/exceptions/doctor/:doctorId', scheduleController.getExceptionsByDoctor);

/**
 * @route   GET /api/v1/schedules/exceptions/me
 * @desc    Get current doctor's exceptions
 * @access  Doctor
 */
router.get('/exceptions/me', authMiddleware, requireRole('doctor'), scheduleController.getCurrentDoctorExceptions);

/**
 * @route   POST /api/v1/schedules/exceptions
 * @desc    Create schedule exception
 * @access  Doctor, Admin
 */
router.post('/exceptions', authMiddleware, requireRole(['doctor', 'admin']), scheduleController.createException);

/**
 * @route   DELETE /api/v1/schedules/exceptions/:id
 * @desc    Delete schedule exception
 * @access  Doctor, Admin
 */
router.delete('/exceptions/:id', authMiddleware, requireRole(['doctor', 'admin']), scheduleController.deleteException);

// ===================== DOCTOR EXCEPTION REQUESTS =====================

/**
 * @route   POST /api/v1/schedules/exceptions/request
 * @desc    Doctor requests a schedule exception (needs admin approval)
 * @access  Doctor
 */
router.post('/exceptions/request', authMiddleware, requireRole('doctor'), scheduleController.requestException);

/**
 * @route   GET /api/v1/schedules/exceptions/my-requests
 * @desc    Get current doctor's exception requests with status
 * @access  Doctor
 */
router.get('/exceptions/my-requests', authMiddleware, requireRole('doctor'), scheduleController.getMyExceptionRequests);

/**
 * @route   DELETE /api/v1/schedules/exceptions/request/:id
 * @desc    Doctor cancels their own pending request
 * @access  Doctor
 */
router.delete('/exceptions/request/:id', authMiddleware, requireRole('doctor'), scheduleController.cancelMyRequest);

// ===================== ADMIN EXCEPTION MANAGEMENT =====================

/**
 * @route   GET /api/v1/schedules/exceptions/pending
 * @desc    Admin gets all pending exception requests
 * @access  Admin
 */
router.get('/exceptions/pending', authMiddleware, requireRole('admin'), scheduleController.getPendingRequests);

/**
 * @route   PUT /api/v1/schedules/exceptions/:id/approve
 * @desc    Admin approves exception request
 * @access  Admin
 */
router.put('/exceptions/:id/approve', authMiddleware, requireRole('admin'), scheduleController.approveRequest);

/**
 * @route   PUT /api/v1/schedules/exceptions/:id/reject
 * @desc    Admin rejects exception request
 * @access  Admin
 */
router.put('/exceptions/:id/reject', authMiddleware, requireRole('admin'), scheduleController.rejectRequest);

module.exports = router;
