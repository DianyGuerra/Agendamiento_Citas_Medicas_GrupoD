/**
 * Reminder Controller
 * Handles HTTP requests for reminders
 * 
 * @module external-api/controllers/ReminderController
 */

const reminderService = require('../services/reminder.service');
const ResponseBuilder = require('../../shared/utils/responseBuilder.utils');
const { asyncHandler } = require('../../shared/middleware/errorHandler.middleware');

class ReminderController {
  /**
   * POST /reminders/process
   * Process all due reminders
   */
  processReminders = asyncHandler(async (req, res) => {
    const { reminderHours } = req.body;

    const results = await reminderService.processReminders(reminderHours);

    return ResponseBuilder.success(res, results, 200, 'Recordatorios procesados');
  });

  /**
   * POST /reminders/create
   * Create a new reminder
   */
  createReminder = asyncHandler(async (req, res) => {
    const reminder = await reminderService.createReminder(req.body);

    return ResponseBuilder.created(res, reminder, 'Recordatorio creado');
  });

  /**
   * GET /reminders/appointment/:appointmentId
   * Get reminder history for an appointment
   */
  getByAppointment = asyncHandler(async (req, res) => {
    const { appointmentId } = req.params;

    const history = await reminderService.getReminderHistory(appointmentId);

    return ResponseBuilder.success(res, history);
  });

  /**
   * DELETE /reminders/appointment/:appointmentId
   * Cancel pending reminders for an appointment
   */
  cancelReminders = asyncHandler(async (req, res) => {
    const { appointmentId } = req.params;

    const result = await reminderService.cancelReminders(appointmentId);

    return ResponseBuilder.success(res, result, 200, 'Recordatorios cancelados');
  });

  /**
   * GET /reminders/pending/count
   * Get count of pending reminders
   */
  getPendingCount = asyncHandler(async (req, res) => {
    const count = await reminderService.getPendingCount();

    return ResponseBuilder.success(res, { pendingCount: count });
  });

  /**
   * GET /reminders/due/:hours
   * Get appointments due for reminder in X hours
   */
  getDueReminders = asyncHandler(async (req, res) => {
    const { hours } = req.params;

    const appointments = await reminderService.getAppointmentsForReminder(parseInt(hours) || 24);

    return ResponseBuilder.success(res, {
      hoursAhead: parseInt(hours) || 24,
      count: appointments.length,
      appointments
    });
  });
}

module.exports = new ReminderController();
