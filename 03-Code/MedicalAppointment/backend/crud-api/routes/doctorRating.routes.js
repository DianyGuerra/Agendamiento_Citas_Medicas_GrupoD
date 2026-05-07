/**
 * Doctor Rating Routes
 * CRUD routes for doctor ratings
 * 
 * @module crud-api/routes/doctorRating.routes
 */

const express = require('express');
const router = express.Router();
const doctorRatingController = require('../controllers/doctorRating.controller');
const { authMiddleware, requireRole } = require('../../shared/middleware/auth.middleware');

// Apply authentication to all routes
router.use(authMiddleware);

/**
 * @route   GET /api/v1/doctor-ratings
 * @desc    Get all ratings (admin view)
 * @access  Admin
 */
router.get('/', requireRole('admin'), doctorRatingController.getAll);

/**
 * @route   GET /api/v1/doctor-ratings/averages
 * @desc    Get average ratings for all doctors
 * @access  Admin
 */
router.get('/averages', requireRole('admin'), doctorRatingController.getAllAverages);

/**
 * @route   GET /api/v1/doctor-ratings/doctor/:doctorId
 * @desc    Get all ratings for a doctor
 * @access  All authenticated
 */
router.get('/doctor/:doctorId', doctorRatingController.getByDoctor);

/**
 * @route   GET /api/v1/doctor-ratings/doctor/:doctorId/average
 * @desc    Get average rating for a doctor
 * @access  All authenticated
 */
router.get('/doctor/:doctorId/average', doctorRatingController.getAverageRating);

/**
 * @route   GET /api/v1/doctor-ratings/appointment/:appointmentId
 * @desc    Get rating by appointment
 * @access  All authenticated
 */
router.get('/appointment/:appointmentId', doctorRatingController.getByAppointment);

/**
 * @route   GET /api/v1/doctor-ratings/:id
 * @desc    Get rating by ID
 * @access  All authenticated
 */
router.get('/:id', doctorRatingController.getById);

/**
 * @route   POST /api/v1/doctor-ratings
 * @desc    Create new rating
 * @access  Patient
 */
router.post('/', requireRole('patient'), doctorRatingController.create);

/**
 * @route   PUT /api/v1/doctor-ratings/:id
 * @desc    Update rating
 * @access  Patient, Admin
 */
router.put('/:id', requireRole(['patient', 'admin']), doctorRatingController.update);

/**
 * @route   DELETE /api/v1/doctor-ratings/:id
 * @desc    Delete rating
 * @access  Admin
 */
router.delete('/:id', requireRole('admin'), doctorRatingController.delete);

module.exports = router;
