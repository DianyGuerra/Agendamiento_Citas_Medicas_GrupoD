/**
 * Report Controller
 * Handles HTTP requests for report generation
 * 
 * @module business-api/controllers/ReportController
 */

const reportService = require('../services/report.service');
const ResponseBuilder = require('../../shared/utils/responseBuilder.utils');
const { asyncHandler } = require('../../shared/middleware/errorHandler.middleware');

class ReportController {
  // ==================== DOCTOR ENDPOINTS ====================

  /**
   * GET /reports/my-stats
   * Get current doctor's statistics
   */
  getMyStats = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;

    const stats = await reportService.getDoctorPersonalStats(userId, { startDate, endDate });

    return ResponseBuilder.success(res, stats);
  });

  /**
   * GET /reports/my-appointments
   * Get current doctor's appointment history
   */
  getMyAppointments = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { startDate, endDate, status, limit = 50 } = req.query;

    const appointments = await reportService.getDoctorAppointments(userId, { 
      startDate, 
      endDate, 
      status,
      limit: parseInt(limit)
    });

    return ResponseBuilder.success(res, appointments);
  });

  /**
   * GET /reports/my-ratings
   * Get current doctor's ratings summary
   */
  getMyRatings = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { limit = 20 } = req.query;

    const ratings = await reportService.getDoctorRatings(userId, { limit: parseInt(limit) });

    return ResponseBuilder.success(res, ratings);
  });

  // ==================== ADMIN ENDPOINTS ====================

  /**
   * GET /reports/appointments
   * Generate appointment report
   */
  getAppointmentReport = asyncHandler(async (req, res) => {
    const { startDate, endDate, doctorId, status, specialtyId } = req.query;

    const report = await reportService.generateAppointmentReport({
      startDate,
      endDate,
      doctorId,
      status,
      specialtyId
    });

    return ResponseBuilder.success(res, report);
  });

  /**
   * GET /reports/productivity
   * Generate doctor productivity report
   */
  getProductivityReport = asyncHandler(async (req, res) => {
    const { doctorId, startDate, endDate } = req.query;

    const report = await reportService.generateDoctorProductivityReport(
      doctorId || null,
      { startDate, endDate }
    );

    return ResponseBuilder.success(res, report);
  });

  /**
   * GET /reports/patient-flow
   * Generate patient flow report
   */
  getPatientFlowReport = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;

    const report = await reportService.generatePatientFlowReport({
      startDate,
      endDate
    });

    return ResponseBuilder.success(res, report);
  });

  /**
   * GET /reports/revenue
   * Generate revenue report
   */
  getRevenueReport = asyncHandler(async (req, res) => {
    const { startDate, endDate, doctorId, groupBy } = req.query;

    const report = await reportService.generateRevenueReport({
      startDate,
      endDate,
      doctorId,
      groupBy
    });

    return ResponseBuilder.success(res, report);
  });

  /**
   * GET /reports/specialty-demand
   * Generate specialty demand report
   */
  getSpecialtyDemandReport = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;

    const report = await reportService.generateSpecialtyDemandReport({
      startDate,
      endDate
    });

    return ResponseBuilder.success(res, report);
  });

  /**
   * GET /reports/general-stats
   * Get general statistics for admin dashboard
   */
  getGeneralStats = asyncHandler(async (req, res) => {
    const stats = await reportService.getGeneralStats();
    return ResponseBuilder.success(res, stats);
  });

  /**
   * GET /reports/doctor-stats
   * Get doctor statistics for admin dashboard
   */
  getDoctorStats = asyncHandler(async (req, res) => {
    const stats = await reportService.getDoctorStats();
    return ResponseBuilder.success(res, stats);
  });

  /**
   * GET /reports/advanced-stats
   * Get advanced statistics for admin dashboard
   */
  getAdvancedStats = asyncHandler(async (req, res) => {
    const stats = await reportService.getAdvancedStats();
    return ResponseBuilder.success(res, stats);
  });
}

module.exports = new ReportController();
