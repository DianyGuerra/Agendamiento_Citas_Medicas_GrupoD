/**
 * Satisfaction Survey Controller
 * HTTP handlers for satisfaction surveys
 * 
 * @module crud-api/controllers/SatisfactionSurveyController
 */

const satisfactionSurveyRepository = require('../repositories/satisfactionSurvey.repository');
const { asyncHandler } = require('../../shared/middleware/errorHandler.middleware');
const ResponseBuilder = require('../../shared/utils/responseBuilder.utils');

class SatisfactionSurveyController {
  /**
   * GET /satisfaction-surveys
   * Get all surveys (admin)
   */
  getAll = asyncHandler(async (req, res) => {
    const { limit, doctor_id, patient_user_id } = req.query;
    
    const filters = { limit };
    if (doctor_id) filters.doctor_id = doctor_id;
    if (patient_user_id) filters.patient_user_id = patient_user_id;
    
    const surveys = await satisfactionSurveyRepository.findAll(filters);

    return ResponseBuilder.success(res, surveys);
  });

  /**
   * GET /satisfaction-surveys/statistics
   * Get survey statistics
   */
  getStatistics = asyncHandler(async (req, res) => {
    const statistics = await satisfactionSurveyRepository.getStatistics();

    return ResponseBuilder.success(res, statistics);
  });

  /**
   * GET /satisfaction-surveys/:id
   * Get survey by ID
   */
  getById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const survey = await satisfactionSurveyRepository.findById(id);

    if (!survey) {
      return ResponseBuilder.notFound(res, 'Encuesta no encontrada');
    }

    return ResponseBuilder.success(res, survey);
  });

  /**
   * GET /satisfaction-surveys/appointment/:appointmentId
   * Get survey by appointment ID
   */
  getByAppointmentId = asyncHandler(async (req, res) => {
    const { appointmentId } = req.params;
    const survey = await satisfactionSurveyRepository.findByAppointmentId(appointmentId);

    if (!survey) {
      return ResponseBuilder.notFound(res, 'Encuesta no encontrada para esta cita');
    }

    return ResponseBuilder.success(res, survey);
  });

  /**
   * POST /satisfaction-surveys
   * Create a new survey
   */
  create = asyncHandler(async (req, res) => {
    const surveyData = {
      ...req.body,
      patient_user_id: req.body.patient_user_id || req.user.id
    };

    // Check if survey already exists for this appointment
    if (surveyData.appointment_id) {
      const existing = await satisfactionSurveyRepository.findByAppointmentId(surveyData.appointment_id);
      if (existing) {
        return ResponseBuilder.badRequest(res, 'Ya existe una encuesta para esta cita');
      }
    }

    const survey = await satisfactionSurveyRepository.create(surveyData);

    return ResponseBuilder.created(res, survey, 'Encuesta creada exitosamente');
  });

  /**
   * PUT /satisfaction-surveys/:id
   * Update a survey
   */
  update = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const existing = await satisfactionSurveyRepository.findById(id);
    if (!existing) {
      return ResponseBuilder.notFound(res, 'Encuesta no encontrada');
    }

    const survey = await satisfactionSurveyRepository.update(id, req.body);

    return ResponseBuilder.success(res, survey, 'Encuesta actualizada exitosamente');
  });

  /**
   * DELETE /satisfaction-surveys/:id
   * Delete a survey
   */
  delete = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const existing = await satisfactionSurveyRepository.findById(id);
    if (!existing) {
      return ResponseBuilder.notFound(res, 'Encuesta no encontrada');
    }

    await satisfactionSurveyRepository.delete(id);

    return ResponseBuilder.success(res, null, 'Encuesta eliminada exitosamente');
  });
}

module.exports = new SatisfactionSurveyController();
