/**
 * Consultation Note Routes
 * RESTful routes for consultation note management
 * 
 * @module crud-api/routes/consultationNote.routes
 */

const express = require('express');
const router = express.Router();
const consultationNoteController = require('../controllers/consultationNote.controller');
const { authMiddleware, requireRole } = require('../../shared/middleware/auth.middleware');

// Apply authentication to all routes
router.use(authMiddleware);

/**
 * @route   GET /api/v1/consultation-notes
 * @desc    Get consultation notes for current user
 * @access  Patient, Doctor
 */
router.get('/', requireRole(['patient', 'doctor']), consultationNoteController.getByUser);

/**
 * @route   GET /api/v1/consultation-notes/appointment/:appointmentId
 * @desc    Get consultation note by appointment
 * @access  Patient, Doctor, Admin
 */
router.get('/appointment/:appointmentId', requireRole(['patient', 'doctor', 'admin']), consultationNoteController.getByAppointment);

/**
 * @route   GET /api/v1/consultation-notes/:id
 * @desc    Get consultation note by ID
 * @access  Patient, Doctor, Admin
 */
router.get('/:id', consultationNoteController.getById);

/**
 * @route   POST /api/v1/consultation-notes
 * @desc    Create consultation note
 * @access  Doctor
 */
router.post('/', requireRole('doctor'), consultationNoteController.create);

/**
 * @route   PUT /api/v1/consultation-notes/:id
 * @desc    Update consultation note
 * @access  Doctor
 */
router.put('/:id', requireRole('doctor'), consultationNoteController.update);

/**
 * @route   DELETE /api/v1/consultation-notes/:id
 * @desc    Delete consultation note
 * @access  Admin
 */
router.delete('/:id', requireRole('admin'), consultationNoteController.delete);

module.exports = router;
