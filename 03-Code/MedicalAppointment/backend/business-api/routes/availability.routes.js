/**
 * Availability Routes
 * Business logic routes for availability checking
 * 
 * @module business-api/routes/availability.routes
 */

const express = require('express');
const router = express.Router();
const availabilityController = require('../controllers/availability.controller');
const { optionalAuth } = require('../../shared/middleware/auth.middleware');

// All routes are public or use optional auth for better results

/**
 * @route   GET /api/v1/availability/doctor/:doctorId/date/:date
 * @desc    Get available slots for a doctor on a specific date
 * @access  Public
 */
router.get('/doctor/:doctorId/date/:date', availabilityController.getSlots);

/**
 * @route   GET /api/v1/availability/doctor/:doctorId/weekly
 * @desc    Get weekly availability for a doctor
 * @access  Public
 */
router.get('/doctor/:doctorId/weekly', availabilityController.getWeeklyAvailability);

/**
 * @route   GET /api/v1/availability/doctor/:doctorId/next
 * @desc    Get next available slot for a doctor
 * @access  Public
 */
router.get('/doctor/:doctorId/next', availabilityController.getNextAvailable);

/**
 * @route   POST /api/v1/availability/check
 * @desc    Check if a specific slot is available
 * @access  Public
 */
router.post('/check', availabilityController.checkSlot);

module.exports = router;
