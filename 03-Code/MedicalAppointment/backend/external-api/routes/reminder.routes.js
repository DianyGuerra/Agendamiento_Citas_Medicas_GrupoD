/**
 * Reminder Routes
 * @module external-api/routes/reminder.routes
 */

const express = require('express');
const router = express.Router();
const reminderController = require('../controllers/reminder.controller');
const { authMiddleware, requireRole } = require('../../shared/middleware/auth.middleware');

// All reminder routes require authentication
router.use(authMiddleware);

/**
 * @route POST /reminders/process
 * @desc Process all due reminders
 * @access Admin
 */
router.post(
  '/process',
  requireRole('admin'),
  reminderController.processReminders
);

/**
 * @route POST /reminders/create
 * @desc Create a new reminder
 * @access Admin
 */
router.post(
  '/create',
  requireRole('admin'),
  reminderController.createReminder
);

/**
 * @route GET /reminders/pending/count
 * @desc Get count of pending reminders
 * @access Admin
 */
router.get(
  '/pending/count',
  requireRole('admin'),
  reminderController.getPendingCount
);

/**
 * @route GET /reminders/due/:hours
 * @desc Get appointments due for reminder in X hours
 * @access Admin
 */
router.get(
  '/due/:hours',
  requireRole('admin'),
  reminderController.getDueReminders
);

/**
 * @route GET /reminders/appointment/:appointmentId
 * @desc Get reminder history for an appointment
 * @access Admin, Doctor
 */
router.get(
  '/appointment/:appointmentId',
  requireRole('admin', 'doctor'),
  reminderController.getByAppointment
);

/**
 * @route DELETE /reminders/appointment/:appointmentId
 * @desc Cancel pending reminders for an appointment
 * @access Admin
 */
router.delete(
  '/appointment/:appointmentId',
  requireRole('admin'),
  reminderController.cancelReminders
);

module.exports = router;
