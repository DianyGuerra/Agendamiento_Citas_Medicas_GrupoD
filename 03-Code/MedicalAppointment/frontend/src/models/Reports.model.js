/**
 * Reports Model
 * Handles report generation operations
 * Uses CORRECT routes from Business API
 * 
 * @module models/Reports
 */

import { businessApi } from '../services/httpClient';

class ReportsModel {
  /**
   * Get general statistics for admin dashboard
   * GET /api/v1/reports/general-stats
   * @returns {Promise<Object>}
   */
  static async getGeneralStats() {
    const response = await businessApi.get('/reports/general-stats');
    return response.data;
  }

  /**
   * Get doctor statistics for admin dashboard
   * GET /api/v1/reports/doctor-stats
   * @returns {Promise<Object>}
   */
  static async getDoctorStats() {
    const response = await businessApi.get('/reports/doctor-stats');
    return response.data;
  }

  /**
   * Get advanced statistics for admin dashboard
   * GET /api/v1/reports/advanced-stats
   * @returns {Promise<Object>}
   */
  static async getAdvancedStats() {
    const response = await businessApi.get('/reports/advanced-stats');
    return response.data;
  }

  /**
   * Get appointment report
   * GET /api/v1/reports/appointments
   * @param {Object} params - Query parameters (startDate, endDate, doctorId, status, specialtyId)
   * @returns {Promise<Object>}
   */
  static async getAppointmentReport(params = {}) {
    const response = await businessApi.get('/reports/appointments', { params });
    return response.data;
  }

  /**
   * Get doctor productivity report
   * GET /api/v1/reports/productivity
   * @param {Object} params - Query parameters (doctorId, startDate, endDate)
   * @returns {Promise<Object>}
   */
  static async getProductivityReport(params = {}) {
    const response = await businessApi.get('/reports/productivity', { params });
    return response.data;
  }

  /**
   * Get patient flow report
   * GET /api/v1/reports/patient-flow
   * @param {Object} params - Query parameters (startDate, endDate)
   * @returns {Promise<Object>}
   */
  static async getPatientFlowReport(params = {}) {
    const response = await businessApi.get('/reports/patient-flow', { params });
    return response.data;
  }

  /**
   * Get revenue report
   * GET /api/v1/reports/revenue
   * @param {Object} params - Query parameters (startDate, endDate, doctorId, groupBy)
   * @returns {Promise<Object>}
   */
  static async getRevenueReport(params = {}) {
    const response = await businessApi.get('/reports/revenue', { params });
    return response.data;
  }

  /**
   * Get specialty demand report
   * GET /api/v1/reports/specialty-demand
   * @param {Object} params - Query parameters (startDate, endDate)
   * @returns {Promise<Object>}
   */
  static async getSpecialtyDemandReport(params = {}) {
    const response = await businessApi.get('/reports/specialty-demand', { params });
    return response.data;
  }

  // ==================== DOCTOR-SPECIFIC REPORTS ====================

  /**
   * Get doctor's personal statistics
   * GET /api/v1/reports/my-stats
   * @param {Object} params - Query parameters (startDate, endDate)
   * @returns {Promise<Object>}
   */
  static async getMyStats(params = {}) {
    const response = await businessApi.get('/reports/my-stats', { params });
    return response.data;
  }

  /**
   * Get doctor's appointments history
   * GET /api/v1/reports/my-appointments
   * @param {Object} params - Query parameters (startDate, endDate, status, limit)
   * @returns {Promise<Array>}
   */
  static async getMyAppointments(params = {}) {
    const response = await businessApi.get('/reports/my-appointments', { params });
    return response.data;
  }

  /**
   * Get doctor's ratings
   * GET /api/v1/reports/my-ratings
   * @param {Object} params - Query parameters (limit)
   * @returns {Promise<Object>}
   */
  static async getMyRatings(params = {}) {
    const response = await businessApi.get('/reports/my-ratings', { params });
    return response.data;
  }

  // ==================== LEGACY/ALIAS METHODS ====================

  /**
   * Get appointment statistics (alias for getAppointmentReport)
   * GET /api/v1/reports/appointments
   * @param {Object} params - Query parameters (startDate, endDate, doctorId, status)
   * @returns {Promise<Object>}
   */
  static async getAppointmentStats(params = {}) {
    const response = await businessApi.get('/reports/appointments', { params });
    return response.data;
  }

  /**
   * Get dashboard data (uses general-stats endpoint)
   * GET /api/v1/reports/general-stats
   * @param {Object} params - Query parameters (startDate, endDate)
   * @returns {Promise<Object>}
   */
  static async getDashboard(params = {}) {
    const response = await businessApi.get('/reports/general-stats', { params });
    return response.data;
  }
}

export default ReportsModel;
