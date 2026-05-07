/**
 * Validation Controller
 * Handles HTTP requests for business rule validations
 * 
 * @module business-api/controllers/ValidationController
 */

const validationService = require('../services/validation.service');
const ResponseBuilder = require('../../shared/utils/responseBuilder.utils');
const { asyncHandler } = require('../../shared/middleware/errorHandler.middleware');

class ValidationController {
  /**
   * POST /validations/appointment
   * Validate appointment booking
   */
  validateAppointment = asyncHandler(async (req, res) => {
    const appointmentData = req.body;

    const result = await validationService.validateAppointmentBooking(appointmentData);

    return ResponseBuilder.success(res, result);
  });

  /**
   * GET /validations/patient-profile/:patientUserId
   * Validate patient profile completeness
   */
  validatePatientProfile = asyncHandler(async (req, res) => {
    const { patientUserId } = req.params;

    const result = await validationService.validatePatientProfile(patientUserId);

    return ResponseBuilder.success(res, result);
  });

  /**
   * GET /validations/patient-profile/me
   * Validate current user's patient profile
   */
  validateMyProfile = asyncHandler(async (req, res) => {
    const patientUserId = req.user.id;

    const result = await validationService.validatePatientProfile(patientUserId);

    return ResponseBuilder.success(res, result);
  });

  /**
   * POST /validations/schedule
   * Validate schedule configuration
   */
  validateSchedule = asyncHandler(async (req, res) => {
    const scheduleData = req.body;

    const result = validationService.validateScheduleConfiguration(scheduleData);

    return ResponseBuilder.success(res, result);
  });

  /**
   * POST /validations/medical-record
   * Validate medical record data
   */
  validateMedicalRecord = asyncHandler(async (req, res) => {
    const recordData = req.body;

    const result = validationService.validateMedicalRecord(recordData);

    return ResponseBuilder.success(res, result);
  });

  /**
   * POST /validations/prescription
   * Validate prescription data
   */
  validatePrescription = asyncHandler(async (req, res) => {
    const prescriptionData = req.body;

    const result = validationService.validatePrescription(prescriptionData);

    return ResponseBuilder.success(res, result);
  });
}

module.exports = new ValidationController();
