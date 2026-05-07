/**
 * Satisfaction Survey Routes
 * @module crud-api/routes/satisfactionSurvey.routes
 */

const express = require('express');
const router = express.Router();
const satisfactionSurveyController = require('../controllers/satisfactionSurvey.controller');
const { authenticate, requireRole } = require('../../shared/middleware/auth.middleware');

// All routes require authentication
router.use(authenticate);

// Admin routes
router.get('/', requireRole('admin'), satisfactionSurveyController.getAll);
router.get('/statistics', requireRole('admin'), satisfactionSurveyController.getStatistics);

// Get by appointment (patient or admin)
router.get('/appointment/:appointmentId', satisfactionSurveyController.getByAppointmentId);

// Get by ID
router.get('/:id', satisfactionSurveyController.getById);

// Create survey (patient)
router.post('/', requireRole('patient'), satisfactionSurveyController.create);

// Update/Delete (admin only)
router.put('/:id', requireRole('admin'), satisfactionSurveyController.update);
router.delete('/:id', requireRole('admin'), satisfactionSurveyController.delete);

module.exports = router;
