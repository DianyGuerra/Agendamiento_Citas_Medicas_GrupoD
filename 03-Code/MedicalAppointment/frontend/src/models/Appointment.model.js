/**
 * Appointment Model
 * Handles appointment data operations
 * 
 * @module models/Appointment
 */

import { crudApi, businessApi } from '../services/httpClient';

/**
 * Appointment entity structure
 * @typedef {Object} Appointment
 * @property {string} id - Appointment ID
 * @property {string} patient_id - Patient ID
 * @property {string} doctor_id - Doctor ID
 * @property {string} scheduled_start - Scheduled start time
 * @property {string} scheduled_end - Scheduled end time
 * @property {string} status - Appointment status
 * @property {string} reason - Reason for visit
 * @property {string} notes - Additional notes
 */

class AppointmentModel {
  // =========================================================================
  // CRUD Operations (CRUD API)
  // =========================================================================

  /**
   * Get all appointments with pagination
   * @param {Object} params - Query parameters
   * @returns {Promise<{data: Appointment[], total: number}>}
   */
  static async getAll(params = {}) {
    const response = await crudApi.get('/appointments', { params });
    return response.data;
  }

  /**
   * Get completed appointments without billing (for invoice generation)
   * @returns {Promise<Appointment[]>}
   */
  static async getUnbilled() {
    const response = await crudApi.get('/appointments/unbilled');
    return response.data;
  }

  /**
   * Get appointment by ID
   * @param {string} id - Appointment ID
   * @param {boolean} includeCancelled - Include cancelled appointments (default: true for viewing details)
   * @returns {Promise<Appointment>}
   */
  static async getById(id, includeCancelled = true) {
    const response = await crudApi.get(`/appointments/${id}`, {
      params: { includeCancelled: includeCancelled ? 'true' : 'false' }
    });
    // API returns { data: {...}, success: true } - extract the actual data
    return response.data?.data || response.data;
  }

  /**
   * Create new appointment (basic)
   * @param {Object} appointmentData - Appointment data
   * @returns {Promise<Appointment>}
   */
  static async create(appointmentData) {
    const response = await crudApi.post('/appointments', appointmentData);
    return response.data;
  }

  /**
   * Update appointment
   * @param {string} id - Appointment ID
   * @param {Object} appointmentData - Appointment data
   * @returns {Promise<Appointment>}
   */
  static async update(id, appointmentData) {
    const response = await crudApi.put(`/appointments/${id}`, appointmentData);
    return response.data;
  }

  /**
   * Delete appointment (soft delete)
   * @param {string} id - Appointment ID
   * @returns {Promise<void>}
   */
  static async delete(id) {
    const response = await crudApi.delete(`/appointments/${id}`);
    return response.data;
  }

  // =========================================================================
  // Business Operations (Business API)
  // =========================================================================

  /**
   * Book an appointment (with validation)
   * @param {Object} bookingData - Booking data
   * @returns {Promise<Appointment>}
   */
  static async book(bookingData) {
    const response = await businessApi.post('/scheduling/book', bookingData);
    return response.data;
  }

  /**
   * Cancel an appointment
   * @param {string} appointmentId - Appointment ID
   * @param {string} reason - Cancellation reason
   * @returns {Promise<void>}
   */
  static async cancel(appointmentId, reason = '') {
    const response = await businessApi.post(
      `/scheduling/cancel/${appointmentId}`,
      { reason }
    );
    return response.data;
  }

  /**
   * Reschedule an appointment
   * @param {string} appointmentId - Appointment ID
   * @param {string} scheduledStart - New start time (ISO timestamp)
   * @returns {Promise<Appointment>}
   */
  static async reschedule(appointmentId, scheduledStart) {
    const response = await businessApi.put(
      `/scheduling/reschedule/${appointmentId}`,
      { scheduled_start: scheduledStart }
    );
    return response.data;
  }

  /**
   * Confirm an appointment
   * @param {string} appointmentId - Appointment ID
   * @returns {Promise<Appointment>}
   */
  static async confirm(appointmentId) {
    const response = await businessApi.post(
      `/scheduling/confirm/${appointmentId}`
    );
    return response.data;
  }

  /**
   * Confirm an appointment publicly (via email link)
   * @param {string} appointmentId - Appointment ID
   * @param {string} token - Confirmation token (optional)
   * @returns {Promise<Appointment>}
   */
  static async confirmPublic(appointmentId, token = null) {
    const params = token ? { token } : {};
    const response = await businessApi.post(
      `/scheduling/confirm-public/${appointmentId}`,
      {},
      { params }
    );
    return response.data;
  }

  /**
   * Get patient's appointments (from CRUD API - appointments for current patient)
   * @param {Object} params - Query parameters
   * @returns {Promise<Appointment[]>}
   */
  static async getMyAppointments(params = {}) {
    const response = await crudApi.get('/appointments/patient', { params });
    return response.data;
  }

  /**
   * Get doctor's appointments (from CRUD API - appointments for current doctor)
   * @param {Object} params - Query parameters
   * @returns {Promise<Appointment[]>}
   */
  static async getDoctorAppointments(params = {}) {
    const response = await crudApi.get('/appointments/doctor', { params });
    return response.data;
  }

  /**
   * Check availability for a time slot
   * @param {string} doctorId - Doctor ID
   * @param {string} startTime - Start time
   * @param {string} endTime - End time
   * @returns {Promise<{available: boolean}>}
   */
  static async checkAvailability(doctorId, startTime, endTime) {
    const response = await businessApi.post('/availability/check', {
      doctorId,
      startTime,
      endTime
    });
    return response.data;
  }

  /**
   * Get upcoming appointments (uses CRUD API)
   * @returns {Promise<Appointment[]>}
   */
  static async getUpcoming() {
    const response = await crudApi.get('/appointments/patient', {
      params: { upcoming: true }
    });
    return response.data;
  }

  /**
   * Get past appointments
   * @returns {Promise<Appointment[]>}
   */
  /**
   * Get past appointments (from CRUD API)
   * @returns {Promise<Appointment[]>}
   */
  static async getPast() {
    const response = await crudApi.get('/appointments/patient', {
      params: { upcoming: false }
    });
    return response.data;
  }

  // =========================================================================
  // Patient-specific Operations
  // =========================================================================

  /**
   * Get patient appointments (calls /appointments/patient for current patient)
   * @returns {Promise<Appointment[]>}
   */
  static async getPatientAppointments() {
    const response = await crudApi.get('/appointments/patient');
    return response.data;
  }

  /**
   * Get available slots for booking
   * GET /api/v1/availability/doctor/:doctorId/date/:date
   * @param {string} doctorId - Doctor ID
   * @param {string} date - Date for slots (YYYY-MM-DD)
   * @returns {Promise<{slots: Array}>}
   */
  static async getAvailableSlots(doctorId, date) {
    const response = await businessApi.get(`/availability/doctor/${doctorId}/date/${date}`);
    return response.data;
  }

  /**
   * Create appointment by doctor
   * @param {Object} appointmentData - Appointment data
   * @returns {Promise<Appointment>}
   */
  static async createByDoctor(appointmentData) {
    const response = await crudApi.post('/appointments', appointmentData);
    return response.data;
  }

  /**
   * Get appointments for a specific patient (by patient user ID)
   * Used by doctors to check patient's appointments
   * @param {string} patientUserId - Patient's user ID
   * @returns {Promise<Appointment[]>}
   */
  static async getByPatient(patientUserId) {
    const response = await crudApi.get(`/appointments/by-patient/${patientUserId}`);
    // Extract data from response structure { success: true, data: [...] }
    return response.data?.data || response.data || [];
  }

  // =========================================================================
  // Statistics Operations (Admin Dashboard)
  // =========================================================================

  /**
   * Get general statistics
   * @returns {Promise<Object>}
   */
  static async getGeneralStats() {
    const response = await businessApi.get('/reports/general-stats');
    return response.data;
  }

  /**
   * Get appointment statistics
   * @returns {Promise<Object>}
   */
  static async getAppointmentStats() {
    const response = await businessApi.get('/reports/appointments');
    return response.data;
  }

  /**
   * Get doctor statistics (for admin)
   * @returns {Promise<Object>}
   */
  static async getDoctorStats() {
    const response = await businessApi.get('/reports/doctor-stats');
    return response.data;
  }

  /**
   * Get advanced statistics
   * @returns {Promise<Object>}
   */
  static async getAdvancedStats() {
    const response = await businessApi.get('/reports/advanced-stats');
    return response.data;
  }

  // =========================================================================
  // Rating Operations
  // =========================================================================

  /**
   * Get ratings for a specific doctor
   * @param {Object} params - Query parameters
   * @param {string} params.doctor_id - Doctor ID
   * @param {number} [params.limit] - Limit results
   * @returns {Promise<Array>}
   */
  static async getDoctorRatings(params = {}) {
    if (!params.doctor_id) {
      throw new Error('doctor_id is required');
    }
    const response = await crudApi.get(`/doctor-ratings/doctor/${params.doctor_id}`, {
      params: { limit: params.limit }
    });
    return response.data;
  }

  /**
   * Submit a rating for an appointment
   * @param {Object} ratingData - Rating data
   * @param {string} ratingData.appointment_id - Appointment ID
   * @param {number} ratingData.rating - Rating (1-5)
   * @param {string} [ratingData.comment] - Comment
   * @returns {Promise<Object>}
   */
  static async submitRating(ratingData) {
    const response = await crudApi.post('/doctor-ratings', ratingData);
    return response.data;
  }
}

export default AppointmentModel;
