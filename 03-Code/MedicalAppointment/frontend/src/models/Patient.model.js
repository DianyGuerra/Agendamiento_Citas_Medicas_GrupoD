/**
 * Patient Model
 * Handles patient data operations
 * 
 * @module models/Patient
 */

import { crudApi, businessApi } from '../services/httpClient';

/**
 * Patient entity structure
 * @typedef {Object} Patient
 * @property {string} id - Patient ID
 * @property {string} user_id - Associated user ID
 * @property {string} date_of_birth - Date of birth
 * @property {string} phone - Phone number
 * @property {string} address - Address
 * @property {string} blood_type - Blood type
 * @property {string} emergency_contact_name - Emergency contact name
 * @property {string} emergency_contact_phone - Emergency contact phone
 */

class PatientModel {
  /**
   * Get all patients with pagination
   * @param {Object} params - Query parameters
   * @returns {Promise<{data: Patient[], total: number}>}
   */
  static async getAll(params = {}) {
    const response = await crudApi.get('/patients', { params });
    return response.data;
  }

  /**
   * Get patient by ID
   * @param {string} id - Patient ID
   * @returns {Promise<Patient>}
   */
  static async getById(id) {
    const response = await crudApi.get(`/patients/${id}`);
    return response.data;
  }

  /**
   * Get patient by user ID
   * @param {string} userId - User ID
   * @returns {Promise<Patient>}
   */
  static async getByUserId(userId) {
    const response = await crudApi.get(`/patients/user/${userId}`);
    return response.data;
  }

  /**
   * Create new patient
   * @param {Object} patientData - Patient data
   * @returns {Promise<Patient>}
   */
  static async create(patientData) {
    const response = await crudApi.post('/patients', patientData);
    return response.data;
  }

  /**
   * Update patient
   * @param {string} id - Patient ID
   * @param {Object} patientData - Patient data
   * @returns {Promise<Patient>}
   */
  static async update(id, patientData) {
    const response = await crudApi.put(`/patients/${id}`, patientData);
    return response.data;
  }

  /**
   * Delete patient (soft delete)
   * @param {string} id - Patient ID
   * @returns {Promise<void>}
   */
  static async delete(id) {
    const response = await crudApi.delete(`/patients/${id}`);
    return response.data;
  }

  /**
   * Get patient profile (current user)
   * Uses CRUD API /patients/me
   * @returns {Promise<Patient>}
   */
  static async getProfile() {
    const response = await crudApi.get('/patients/me');
    return response.data;
  }

  /**
   * Update patient profile (current user)
   * Uses CRUD API /patients/me
   * @param {Object} profileData - Profile data
   * @returns {Promise<Patient>}
   */
  static async updateProfile(profileData) {
    const response = await crudApi.put('/patients/me', profileData);
    return response.data;
  }

  /**
   * Validate patient profile completeness
   * @returns {Promise<Object>}
   */
  static async validateProfile() {
    const response = await businessApi.get('/validations/patient-profile/me');
    return response.data;
  }

  /**
   * Search patients
   * @param {Object} params - Search parameters (search, status, etc.)
   * @returns {Promise<Patient[]>}
   */
  static async search(params = {}) {
    const response = await crudApi.get('/patients', { params });
    return response.data;
  }

  /**
   * Get patient statistics
   * @returns {Promise<{total: number, active: number, inactive: number}>}
   */
  static async getStats() {
    const response = await crudApi.get('/patients/stats');
    return response.data;
  }

  /**
   * Create a new patient with user account
   * @param {Object} patientData - Patient data including user fields
   * @returns {Promise<Patient>}
   */
  static async createWithUser(patientData) {
    const response = await crudApi.post('/patients/with-user', patientData);
    return response.data;
  }

  /**
   * Filter patients by criteria
   * @param {Object} params - Filter parameters
   * @returns {Promise<Patient[]>}
   */
  static async filter(params = {}) {
    const response = await crudApi.get('/patients', { params });
    return response.data;
  }
}

export default PatientModel;
