/**
 * Doctor Model
 * Handles doctor data operations
 * 
 * @module models/Doctor
 */

import { crudApi, businessApi } from '../services/httpClient';

/**
 * Doctor entity structure
 * @typedef {Object} Doctor
 * @property {string} id - Doctor ID
 * @property {string} user_id - Associated user ID
 * @property {string} specialty_id - Specialty ID
 * @property {string} license_number - Medical license number
 * @property {number} consultation_fee - Consultation fee
 * @property {Object} user - Associated user data
 * @property {Object} specialty - Associated specialty data
 */

class DoctorModel {
  /**
   * Get all doctors with pagination
   * @param {Object} params - Query parameters
   * @returns {Promise<{data: Doctor[], total: number}>}
   */
  static async getAll(params = {}) {
    const response = await crudApi.get('/doctors', { params });
    return response.data;
  }

  /**
   * Get doctor by ID
   * @param {string} id - Doctor ID
   * @returns {Promise<Doctor>}
   */
  static async getById(id) {
    const response = await crudApi.get(`/doctors/${id}`);
    return response.data;
  }

  /**
   * Get doctor by user ID
   * @param {string} userId - User ID
   * @returns {Promise<Doctor>}
   */
  static async getByUserId(userId) {
    const response = await crudApi.get(`/doctors/user/${userId}`);
    return response.data;
  }

  /**
   * Get doctors by specialty
   * @param {string} specialtyId - Specialty ID
   * @returns {Promise<Doctor[]>}
   */
  static async getBySpecialty(specialtyId) {
    const response = await crudApi.get('/doctors', {
      params: { specialty_id: specialtyId }
    });
    return response.data;
  }

  /**
   * Create new doctor
   * @param {Object} doctorData - Doctor data
   * @returns {Promise<Doctor>}
   */
  static async create(doctorData) {
    const response = await crudApi.post('/doctors', doctorData);
    return response.data;
  }

  /**
   * Create new doctor with user account (for admin)
   * Creates both user record (with doctor role) and doctor record
   * @param {Object} doctorData - Doctor data including user fields
   * @param {string} doctorData.cedula - Doctor's cedula (10 digits)
   * @param {string} doctorData.first_name - First name
   * @param {string} doctorData.last_name - Last name
   * @param {string} doctorData.email - Email
   * @param {string} doctorData.phone_number - Phone number
   * @param {string} doctorData.specialty_id - Specialty ID
   * @param {string} doctorData.license_number - Medical license number
   * @param {string} doctorData.status - Status (active/inactive/vacation)
   * @returns {Promise<Doctor>}
   */
  static async createWithUser(doctorData) {
    const response = await crudApi.post('/doctors/with-user', doctorData);
    return response.data;
  }

  /**
   * Update doctor
   * @param {string} id - Doctor ID
   * @param {Object} doctorData - Doctor data
   * @returns {Promise<Doctor>}
   */
  static async update(id, doctorData) {
    const response = await crudApi.put(`/doctors/${id}`, doctorData);
    return response.data;
  }

  /**
   * Reset doctor password to a new temporary password (admin only)
   * @param {string} id - Doctor ID
   * @returns {Promise<Object>} Object with temporary_password
   */
  static async resetPassword(id) {
    const response = await crudApi.post(`/doctors/${id}/reset-password`);
    return response.data;
  }

  /**
   * Delete doctor (soft delete)
   * @param {string} id - Doctor ID
   * @returns {Promise<void>}
   */
  static async delete(id) {
    const response = await crudApi.delete(`/doctors/${id}`);
    return response.data;
  }

  /**
   * Get doctor's schedule
   * @param {string} doctorId - Doctor ID
   * @returns {Promise<Object>}
   */
  static async getSchedule(doctorId) {
    // Use CRUD API for schedules
    const response = await crudApi.get('/schedules', { params: { doctor_id: doctorId } });
    return response.data;
  }

  /**
   * Get doctor's available slots
   * @param {string} doctorId - Doctor ID
   * @param {string} date - Date (YYYY-MM-DD)
   * @returns {Promise<string[]>}
   */
  static async getAvailableSlots(doctorId, date) {
    const response = await businessApi.get(`/availability/doctor/${doctorId}/date/${date}`);
    return response.data;
  }

  /**
   * Get doctor's weekly availability
   * @param {string} doctorId - Doctor ID
   * @returns {Promise<Object>}
   */
  static async getWeeklyAvailability(doctorId) {
    const response = await businessApi.get(`/availability/doctor/${doctorId}/weekly`);
    return response.data;
  }

  /**
   * Search doctors
   * @param {string} query - Search query
   * @param {Object} params - Additional parameters
   * @returns {Promise<Doctor[]>}
   */
  static async search(query, params = {}) {
    const response = await crudApi.get('/doctors/search', {
      params: { query, ...params }
    });
    return response.data;
  }

  // =========================================================================
  // Doctor Profile Operations
  // =========================================================================

  /**
   * Get current doctor's profile
   * GET /api/v1/doctors/me
   * @returns {Promise<Doctor>}
   */
  static async getProfile() {
    const response = await crudApi.get('/doctors/me');
    return response.data;
  }

  /**
   * Update current doctor's profile
   * PUT /api/v1/doctors/me
   * @param {Object} profileData - Profile data
   * @returns {Promise<Doctor>}
   */
  static async updateProfile(profileData) {
    const response = await crudApi.put('/doctors/me', profileData);
    return response.data;
  }

  /**
   * Get current doctor's schedule
   * GET /api/v1/schedules/me
   * @returns {Promise<Object>}
   */
  static async getMySchedule() {
    const response = await crudApi.get('/schedules/me');
    return response.data;
  }

  /**
   * Update current doctor's schedule
   * PUT /api/v1/schedules/me
   * @param {Object} scheduleData - Schedule data
   * @returns {Promise<Object>}
   */
  static async updateSchedule(scheduleData) {
    const response = await crudApi.put('/schedules/me', scheduleData);
    return response.data;
  }

  // =========================================================================
  // Patient Management Operations
  // =========================================================================

  /**
   * Get all patients (for doctor)
   * @returns {Promise<Array>}
   */
  static async getAllPatients() {
    const response = await crudApi.get('/patients');
    return response.data;
  }

  /**
   * Get doctor's patients (patients with appointments)
   * @returns {Promise<Array>}
   */
  static async getMyPatients() {
    const response = await crudApi.get('/doctors/my-patients');
    return response.data;
  }

  // =========================================================================
  // Statistics Operations
  // =========================================================================

  /**
   * Get doctor statistics
   * @returns {Promise<Object>}
   */
  static async getStats() {
    const response = await businessApi.get('/reports/doctor-stats');
    return response.data;
  }

  /**
   * Filter doctors
   * @param {Object} params - Filter parameters
   * @returns {Promise<Doctor[]>}
   */
  static async filter(params = {}) {
    const response = await crudApi.get('/doctors', { params });
    return response.data;
  }

  // =========================================================================
  // Schedule Exception Requests
  // =========================================================================

  /**
   * Get doctor's exception requests (with status)
   * GET /api/v1/schedules/exceptions/my-requests
   * @returns {Promise<Array>}
   */
  static async getMyExceptionRequests() {
    const response = await crudApi.get('/schedules/exceptions/my-requests');
    return response.data;
  }

  /**
   * Request a schedule exception (vacation, extra hours, etc.)
   * POST /api/v1/schedules/exceptions/request
   * @param {Object} requestData - Exception request data
   * @returns {Promise<Object>}
   */
  static async requestException(requestData) {
    const response = await crudApi.post('/schedules/exceptions/request', requestData);
    return response.data;
  }

  /**
   * Cancel a pending exception request
   * DELETE /api/v1/schedules/exceptions/request/:id
   * @param {string} requestId - Request ID
   * @returns {Promise<Object>}
   */
  static async cancelExceptionRequest(requestId) {
    const response = await crudApi.delete(`/schedules/exceptions/request/${requestId}`);
    return response.data;
  }
}

export default DoctorModel;
