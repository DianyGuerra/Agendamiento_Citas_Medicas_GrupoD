/**
 * Consultation Room Routes
 * RESTful routes for consultation room management
 * 
 * @module crud-api/routes/consultationRoom.routes
 */

const express = require('express');
const router = express.Router();
const consultationRoomController = require('../controllers/consultationRoom.controller');
const { authMiddleware, requireRole } = require('../../shared/middleware/auth.middleware');

/**
 * @route   GET /api/v1/consultation-rooms
 * @desc    Get all consultation rooms
 * @access  Public
 */
router.get('/', consultationRoomController.getAll);

/**
 * @route   GET /api/v1/consultation-rooms/available
 * @desc    Get first available room
 * @access  Public
 */
router.get('/available', consultationRoomController.getAvailable);

/**
 * @route   GET /api/v1/consultation-rooms/:id
 * @desc    Get room by ID
 * @access  Public
 */
router.get('/:id', consultationRoomController.getById);

// Protected routes
/**
 * @route   POST /api/v1/consultation-rooms
 * @desc    Create consultation room
 * @access  Admin
 */
router.post('/', authMiddleware, requireRole('admin'), consultationRoomController.create);

/**
 * @route   PUT /api/v1/consultation-rooms/:id
 * @desc    Update consultation room
 * @access  Admin
 */
router.put('/:id', authMiddleware, requireRole('admin'), consultationRoomController.update);

/**
 * @route   PATCH /api/v1/consultation-rooms/:id/availability
 * @desc    Update room availability
 * @access  Doctor, Admin
 */
router.patch('/:id/availability', authMiddleware, requireRole(['doctor', 'admin']), consultationRoomController.updateAvailability);

/**
 * @route   DELETE /api/v1/consultation-rooms/:id
 * @desc    Soft delete room
 * @access  Admin
 */
router.delete('/:id', authMiddleware, requireRole('admin'), consultationRoomController.delete);

module.exports = router;
