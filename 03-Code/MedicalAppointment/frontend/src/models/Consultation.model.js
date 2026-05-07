/**
 * Consultation Model
 * Handles consultation workflow operations
 * 
 * @module models/Consultation
 */

import { crudApi, businessApi } from '../services/httpClient';

/**
 * ConsultationNote entity structure
 * @typedef {Object} ConsultationNote
 * @property {string} id - Note ID
 * @property {string} appointment_id - Appointment ID
 * @property {string} subjective - Subjective findings (patient complaints)
 * @property {string} objective - Objective findings (examination)
 * @property {string} assessment - Assessment/diagnosis
 * @property {string} plan - Treatment plan
 */

class ConsultationModel {
  // =========================================================================
  // Consultation Notes (CRUD)
  // =========================================================================

  /**
   * Get all consultation notes
   * @param {Object} params - Query parameters
   * @returns {Promise<ConsultationNote[]>}
   */
  static async getAllNotes(params = {}) {
    const response = await crudApi.get('/consultation-notes', { params });
    return response.data;
  }

  /**
   * Get consultation note by ID
   * @param {string} id - Note ID
   * @returns {Promise<ConsultationNote>}
   */
  static async getNoteById(id) {
    const response = await crudApi.get(`/consultation-notes/${id}`);
    return response.data;
  }

  /**
   * Create consultation note
   * @param {Object} noteData - Note data
   * @returns {Promise<ConsultationNote>}
   */
  static async createNote(noteData) {
    const response = await crudApi.post('/consultation-notes', noteData);
    return response.data;
  }

  /**
   * Update consultation note
   * @param {string} id - Note ID
   * @param {Object} noteData - Note data
   * @returns {Promise<ConsultationNote>}
   */
  static async updateNote(id, noteData) {
    const response = await crudApi.put(`/consultation-notes/${id}`, noteData);
    return response.data;
  }

  // =========================================================================
  // Consultation Workflow (Business)
  // =========================================================================

  /**
   * Start a consultation
   * @param {string} appointmentId - Appointment ID
   * @returns {Promise<Object>}
   */
  static async startConsultation(appointmentId) {
    const response = await businessApi.post(
      `/consultations/start/${appointmentId}`
    );
    return response.data;
  }

  /**
   * End a consultation
   * @param {string} appointmentId - Appointment ID
   * @param {Object} notes - Consultation notes (SOAP format)
   * @returns {Promise<Object>}
   */
  static async endConsultation(appointmentId, notes) {
    const response = await businessApi.post(
      `/consultations/complete/${appointmentId}`,
      { notes }
    );
    return response.data;
  }

  /**
   * Create missing follow-up appointment from saved consultation notes
   * @param {string} appointmentId - Original appointment ID
   * @returns {Promise<Object>}
   */
  static async createFollowUpAppointment(appointmentId) {
    const response = await businessApi.post(
      `/consultations/${appointmentId}/create-follow-up`
    );
    return response.data;
  }

  /**
   * Get notes for an appointment
   * @param {string} appointmentId - Appointment ID
   * @returns {Promise<ConsultationNote>}
   */
  static async getNotesByAppointment(appointmentId) {
    // Use CRUD API for consultation notes by appointment
    const response = await crudApi.get('/consultation-notes', {
      params: { appointmentId }
    });
    // API returns { data: [...], success: true } - extract the actual data
    const data = response.data?.data || response.data;
    // If it's an array, return the first note (there should be one per appointment)
    return Array.isArray(data) ? data[0] : data;
  }

  /**
   * Get patient's consultation notes
   * @returns {Promise<ConsultationNote[]>}
   */
  static async getMyNotes() {
    // Use CRUD API for patient's notes
    const response = await crudApi.get('/consultation-notes', {
      params: { mine: true }
    });
    return response.data;
  }

  /**
   * Get patient's consultation history (summary)
   * @param {string} patientId - Patient user ID
   * @returns {Promise<ConsultationNote[]>}
   */
  static async getPatientHistory(patientId) {
    // Use the new endpoint that returns all appointments (all statuses)
    const response = await businessApi.get(`/consultations/patient/${patientId}/appointments`);
    // API returns { data: [...], success: true } - extract the actual data
    return response.data?.data || response.data;
  }

  /**
   * Get patient's consultation summary (only completed with notes)
   * @param {string} patientId - Patient user ID
   * @returns {Promise<ConsultationNote[]>}
   */
  static async getPatientSummary(patientId) {
    const response = await businessApi.get(`/consultations/patient/${patientId}/summary`);
    return response.data;
  }
}

export default ConsultationModel;
