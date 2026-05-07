/**
 * Waiting List Routes
 * CRUD routes for waiting list management
 * 
 * @module crud-api/routes/waitingList.routes
 */

const express = require('express');
const router = express.Router();
const waitingListController = require('../controllers/waitingList.controller');
const { authMiddleware, requireRole } = require('../../shared/middleware/auth.middleware');

// Apply authentication to all routes
router.use(authMiddleware);

/**
 * @route   GET /api/v1/waiting-list
 * @desc    Get all waiting list entries
 * @access  Admin, Doctor
 */
router.get('/', requireRole(['admin', 'doctor']), waitingListController.getAll);

/**
 * @route   GET /api/v1/waiting-list/doctor/:doctorId/count
 * @desc    Get waiting count for doctor
 * @access  Admin, Doctor
 */
router.get('/doctor/:doctorId/count', requireRole(['admin', 'doctor']), waitingListController.getCountByDoctor);

/**
 * @route   GET /api/v1/waiting-list/:id
 * @desc    Get waiting list entry by ID
 * @access  Admin, Doctor, Patient
 */
router.get('/:id', waitingListController.getById);

/**
 * @route   POST /api/v1/waiting-list
 * @desc    Add to waiting list
 * @access  Patient, Admin
 */
router.post('/', requireRole(['patient', 'admin']), waitingListController.create);

/**
 * @route   PUT /api/v1/waiting-list/:id
 * @desc    Update waiting list entry
 * @access  Admin
 */
router.put('/:id', requireRole('admin'), waitingListController.update);

/**
 * @route   PATCH /api/v1/waiting-list/:id/status
 * @desc    Update entry status
 * @access  Admin, Doctor
 */
router.patch('/:id/status', requireRole(['admin', 'doctor']), waitingListController.updateStatus);

/**
 * @route   DELETE /api/v1/waiting-list/:id
 * @desc    Remove from waiting list
 * @access  Patient, Admin
 */
router.delete('/:id', requireRole(['patient', 'admin']), waitingListController.delete);

module.exports = router;
