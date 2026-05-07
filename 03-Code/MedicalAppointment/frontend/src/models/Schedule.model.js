/**
 * Schedule Model
 * Handles doctor schedule data operations
 * 
 * @module models/Schedule
 */

import { crudApi, businessApi } from '../services/httpClient';

/**
 * Schedule entity structure
 * @typedef {Object} Schedule
 * @property {string} id - Schedule ID
 * @property {string} doctor_id - Doctor ID
 * @property {number} day_of_week - Day of week (0-6, Sunday-Saturday)
 * @property {string} start_time - Start time (HH:mm)
 * @property {string} end_time - End time (HH:mm)
 * @property {boolean} is_active - Active status
 */

class ScheduleModel {
  /**
   * Get all schedules
   * @param {Object} params - Query parameters
   * @returns {Promise<Schedule[]>}
   */
  static async getAll(params = {}) {
    const response = await crudApi.get('/schedules', { params });
    return response.data;
  }

  /**
   * Get schedule by ID
   * @param {string} id - Schedule ID
   * @returns {Promise<Schedule>}
   */
  static async getById(id) {
    const response = await crudApi.get(`/schedules/${id}`);
    return response.data;
  }

  /**
   * Get schedules by doctor ID
   * @param {string} doctorId - Doctor ID
   * @returns {Promise<Schedule[]>}
   */
  static async getByDoctorId(doctorId) {
    const response = await crudApi.get('/schedules', {
      params: { doctor_id: doctorId }
    });
    return response.data;
  }

  /**
   * Create new schedule
   * @param {Object} scheduleData - Schedule data
   * @returns {Promise<Schedule>}
   */
  static async create(scheduleData) {
    const response = await crudApi.post('/schedules', scheduleData);
    return response.data;
  }

  /**
   * Update schedule
   * @param {string} id - Schedule ID
   * @param {Object} scheduleData - Schedule data
   * @returns {Promise<Schedule>}
   */
  static async update(id, scheduleData) {
    const response = await crudApi.put(`/schedules/${id}`, scheduleData);
    return response.data;
  }

  /**
   * Delete schedule (soft delete)
   * @param {string} id - Schedule ID
   * @returns {Promise<void>}
   */
  static async delete(id) {
    const response = await crudApi.delete(`/schedules/${id}`);
    return response.data;
  }

  /**
   * Bulk create schedules for a doctor
   * @param {string} doctorId - Doctor ID
   * @param {Schedule[]} schedules - Array of schedules
   * @returns {Promise<Schedule[]>}
   */
  static async bulkCreate(doctorId, schedules) {
    const response = await crudApi.post('/schedules/bulk', {
      doctor_id: doctorId,
      schedules
    });
    return response.data;
  }

  /**
   * Get doctor's available slots for a date
   * @param {string} doctorId - Doctor ID
   * @param {string} date - Date (YYYY-MM-DD)
   * @returns {Promise<string[]>}
   */
  static async getAvailableSlots(doctorId, date) {
    const response = await businessApi.get(
      `/availability/doctor/${doctorId}/date/${date}`
    );
    return response.data;
  }

  /**
   * Get doctor's weekly availability
   * @param {string} doctorId - Doctor ID
   * @returns {Promise<Object>}
   */
  static async getWeeklyAvailability(doctorId) {
    const response = await businessApi.get(
      `/availability/doctor/${doctorId}/weekly`
    );
    return response.data;
  }

  // ==================== Schedule Exception Methods ====================

  /**
   * Get all pending exception requests (Admin)
   * @returns {Promise<Object[]>}
   */
  static async getPendingExceptions() {
    const response = await crudApi.get('/schedules/exceptions/pending');
    return response.data;
  }

  /**
   * Get all exceptions with optional filters
   * @param {Object} params - Query parameters (status, doctor_id, etc.)
   * @returns {Promise<Object[]>}
   */
  static async getAllExceptions(params = {}) {
    const response = await crudApi.get('/schedules/exceptions', { params });
    return response.data;
  }

  /**
   * Approve a schedule exception request (Admin)
   * @param {string} id - Exception ID
   * @param {Object} data - { admin_notes }
   * @returns {Promise<Object>}
   */
  static async approveException(id, data = {}) {
    const response = await crudApi.put(`/schedules/exceptions/${id}/approve`, data);
    return response.data;
  }

  /**
   * Reject a schedule exception request (Admin)
   * @param {string} id - Exception ID
   * @param {Object} data - { admin_notes }
   * @returns {Promise<Object>}
   */
  static async rejectException(id, data = {}) {
    const response = await crudApi.put(`/schedules/exceptions/${id}/reject`, data);
    return response.data;
  }

  /**
   * Cleanup past appointments by marking them as no-show
   * Automatically updates appointments that are scheduled/confirmed but their date has passed
   * @returns {Promise<Object>} - Result with count of updated appointments
   */
  static async cleanupPastAppointments() {
    try {
      const response = await businessApi.post('/scheduling/cleanup-past');
      return response.data?.data || response.data;
    } catch (error) {
      console.warn('Cleanup past appointments failed:', error.message);
      // Non-critical operation, don't throw
      return { updated: 0 };
    }
  }

  // ==================== Doctor Exception Requests ====================

  /**
   * Get current doctor's exception requests
   * @returns {Promise<Object[]>}
   */
  static async getMyExceptionRequests() {
    const response = await crudApi.get('/schedules/exceptions/my-requests');
    return response.data?.data || response.data || [];
  }

  /**
   * Create exception request (vacation, day off, etc.)
   * @param {Object} data - Exception data
   * @returns {Promise<Object>}
   */
  static async createExceptionRequest(data) {
    const response = await crudApi.post('/schedules/exceptions/request', data);
    return response.data;
  }

  /**
   * Cancel doctor's own pending exception request
   * @param {string} id - Exception ID
   * @returns {Promise<Object>}
   */
  static async cancelMyRequest(id) {
    const response = await crudApi.delete(`/schedules/exceptions/request/${id}`);
    return response.data;
  }
}

export default ScheduleModel;
