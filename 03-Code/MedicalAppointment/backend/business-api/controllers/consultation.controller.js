/**
 * Consultation Controller
 * Handles HTTP requests for consultation workflow business logic
 * 
 * @module business-api/controllers/ConsultationController
 */

const consultationService = require('../services/consultation.service');
const ResponseBuilder = require('../../shared/utils/responseBuilder.utils');
const { asyncHandler } = require('../../shared/middleware/errorHandler.middleware');

class ConsultationController {
  /**
   * POST /consultations/start/:appointmentId
   * Start a consultation workflow
   */
  startConsultation = asyncHandler(async (req, res) => {
    const { appointmentId } = req.params;
    const { roomId } = req.body;
    const doctorUserId = req.user.id;

    const session = await consultationService.startConsultation(
      appointmentId,
      doctorUserId,
      roomId
    );

    return ResponseBuilder.success(res, session, 200, 'Consulta iniciada');
  });

  /**
   * POST /consultations/complete/:appointmentId
   * Complete a consultation with notes
   */
  completeConsultation = asyncHandler(async (req, res) => {
    const { appointmentId } = req.params;
    const consultationData = req.body;
    const doctorUserId = req.user.id;

    const result = await consultationService.completeConsultation(
      appointmentId,
      consultationData,
      doctorUserId
    );

    return ResponseBuilder.success(res, result, 200, 'Consulta completada');
  });

  /**
   * GET /consultations/patient/:patientUserId/summary
   * Get consultation summary for a patient
   */
  getPatientSummary = asyncHandler(async (req, res) => {
    const { patientUserId } = req.params;
    const { limit } = req.query;

    const summary = await consultationService.getPatientConsultationSummary(
      patientUserId,
      parseInt(limit) || 10
    );

    return ResponseBuilder.success(res, summary);
  });

  /**
   * POST /consultations/:appointmentId/prescription
   * Add prescription during consultation
   */
  addPrescription = asyncHandler(async (req, res) => {
    const { appointmentId } = req.params;
    const prescriptionData = req.body;
    const doctorUserId = req.user.id;

    const prescription = await consultationService.addPrescription(
      appointmentId,
      prescriptionData,
      doctorUserId
    );

    return ResponseBuilder.created(res, prescription, 'Receta agregada');
  });

  /**
   * GET /consultations/:appointmentId/prescriptions
   * Get prescriptions for an appointment
   */
  getPrescriptions = asyncHandler(async (req, res) => {
    const { appointmentId } = req.params;

    const prescriptions = await consultationService.getPrescriptionsByAppointment(appointmentId);

    return ResponseBuilder.success(res, prescriptions);
  });

  /**
   * GET /consultations/patient/:patientUserId/appointments
   * Get all appointments history for a patient (includes all statuses)
   */
  getPatientAppointments = asyncHandler(async (req, res) => {
    const { patientUserId } = req.params;

    const appointments = await consultationService.getPatientAppointmentsHistory(patientUserId);

    return ResponseBuilder.success(res, appointments);
  });

  /**
   * POST /consultations/:appointmentId/create-follow-up
   * Create missing follow-up appointment from saved consultation notes
   */
  createFollowUpAppointment = asyncHandler(async (req, res) => {
    const { appointmentId } = req.params;
    const doctorUserId = req.user.id;

    const result = await consultationService.createMissingFollowUp(
      appointmentId,
      doctorUserId
    );

    return ResponseBuilder.created(res, result, 'Cita de seguimiento creada exitosamente');
  });
}

module.exports = new ConsultationController();
