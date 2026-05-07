/**
 * Scheduling Controller
 * Handles HTTP requests for appointment scheduling business logic
 * 
 * @module business-api/controllers/SchedulingController
 */

const schedulingService = require('../services/scheduling.service');
const ResponseBuilder = require('../../shared/utils/responseBuilder.utils');
const { asyncHandler } = require('../../shared/middleware/errorHandler.middleware');
const { ValidationError } = require('../../shared/errors');

class SchedulingController {
  /**
   * POST /scheduling/book
   * Book a new appointment
   */
  bookAppointment = asyncHandler(async (req, res) => {
    const { doctor_id, scheduled_start, reason } = req.body;
    const patient_user_id = req.user.id;

    const result = await schedulingService.scheduleAppointment({
      patient_user_id,
      doctor_id,
      scheduled_start,
      reason
    });

    return ResponseBuilder.created(res, result, 'Cita agendada exitosamente');
  });

  /**
   * PUT /scheduling/reschedule/:appointmentId
   * Reschedule an existing appointment
   */
  rescheduleAppointment = asyncHandler(async (req, res) => {
    const { appointmentId } = req.params;
    const { scheduled_start } = req.body;
    const userId = req.user.id;

    if (!scheduled_start) {
      throw new ValidationError('Nueva fecha y hora (scheduled_start) son requeridas');
    }

    const result = await schedulingService.rescheduleAppointment(
      appointmentId,
      { scheduled_start },
      userId
    );

    return ResponseBuilder.success(res, result, 200, 'Cita reprogramada exitosamente');
  });

  /**
   * POST /scheduling/cancel/:appointmentId
   * Cancel an appointment
   */
  cancelAppointment = asyncHandler(async (req, res) => {
    const { appointmentId } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;

    const result = await schedulingService.cancelAppointment(
      appointmentId,
      reason,
      userId
    );

    return ResponseBuilder.success(res, result, 200, result.message);
  });

  /**
   * POST /scheduling/confirm/:appointmentId
   * Confirm an appointment
   */
  confirmAppointment = asyncHandler(async (req, res) => {
    const { appointmentId } = req.params;

    const result = await schedulingService.confirmAppointment(appointmentId);

    return ResponseBuilder.success(res, result, 200, result.message);
  });

  /**
   * POST /scheduling/start/:appointmentId
   * Start a consultation
   */
  startConsultation = asyncHandler(async (req, res) => {
    const { appointmentId } = req.params;
    const { roomId } = req.body;

    const result = await schedulingService.startConsultation(appointmentId, roomId);

    return ResponseBuilder.success(res, result, 200, result.message);
  });

  /**
   * POST /scheduling/complete/:appointmentId
   * Complete a consultation
   */
  completeConsultation = asyncHandler(async (req, res) => {
    const { appointmentId } = req.params;

    const result = await schedulingService.completeConsultation(appointmentId);

    return ResponseBuilder.success(res, result, 200, result.message);
  });

  /**
   * POST /scheduling/no-show/:appointmentId
   * Mark patient as no-show
   */
  markNoShow = asyncHandler(async (req, res) => {
    const { appointmentId } = req.params;

    const result = await schedulingService.markNoShow(appointmentId);

    return ResponseBuilder.success(res, result, 200, result.message);
  });

  /**
   * GET /scheduling/statistics/doctor/:doctorId
   * Get appointment statistics for a doctor
   */
  getDoctorStatistics = asyncHandler(async (req, res) => {
    const { doctorId } = req.params;
    const { startDate, endDate } = req.query;

    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const end = endDate || new Date().toISOString().split('T')[0];

    const statistics = await schedulingService.getDoctorStatistics(doctorId, start, end);

    return ResponseBuilder.success(res, {
      doctorId,
      period: { startDate: start, endDate: end },
      statistics
    });
  });

  /**
   * POST /scheduling/confirm-public/:appointmentId
   * Confirm an appointment publicly (no auth required)
   */
  confirmAppointmentPublic = asyncHandler(async (req, res) => {
    const { appointmentId } = req.params;
    const { token } = req.query;

    const result = await schedulingService.confirmAppointmentPublic(appointmentId, token);

    return ResponseBuilder.success(res, result, 200, result.message);
  });

  /**
   * POST /scheduling/cleanup-past
   * Mark past appointments as no_show
   */
  cleanupPastAppointments = asyncHandler(async (req, res) => {
    const count = await schedulingService.markPastAppointmentsAsNoShow();

    return ResponseBuilder.success(res, { 
      updated: count 
    }, 200, `${count} citas pasadas actualizadas a no_show`);
  });
}

module.exports = new SchedulingController();
