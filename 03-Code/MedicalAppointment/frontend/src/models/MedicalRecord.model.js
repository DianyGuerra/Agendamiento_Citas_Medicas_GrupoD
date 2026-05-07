/**
 * Medical Record Model
 * Handles medical record data operations
 * 
 * @module models/MedicalRecord
 */

import { crudApi, businessApi } from '../services/httpClient';

/**
 * MedicalRecord entity structure
 * @typedef {Object} MedicalRecord
 * @property {string} id - Record ID
 * @property {string} patient_id - Patient ID
 * @property {string} allergies - Allergies
 * @property {string} chronic_conditions - Chronic conditions
 * @property {string} current_medications - Current medications
 * @property {string} family_history - Family history
 */

class MedicalRecordModel {
  /**
   * Get all medical records (admin)
   * @param {Object} params - Query parameters
   * @returns {Promise<MedicalRecord[]>}
   */
  static async getAll(params = {}) {
    const response = await crudApi.get('/medical-records', { params });
    return response.data;
  }

  /**
   * Get medical record by ID
   * @param {string} id - Record ID
   * @returns {Promise<MedicalRecord>}
   */
  static async getById(id) {
    const response = await crudApi.get(`/medical-records/${id}`);
    return response.data;
  }

  /**
   * Get medical record by patient ID
   * @param {string} patientId - Patient ID
   * @returns {Promise<MedicalRecord>}
   */
  static async getByPatientId(patientId) {
    // Route is /medical-records/:patientId (not /medical-records/patient/:patientId)
    const response = await crudApi.get(`/medical-records/${patientId}`);
    return response.data?.data || response.data;
  }

  /**
   * Get medical record by patient user ID (alias for getByPatientId)
   * @param {string} patientUserId - Patient user ID
   * @returns {Promise<MedicalRecord>}
   */
  static async getByPatient(patientUserId) {
    // Route is /medical-records/:patientId (not /medical-records/patient/:patientId)
    const response = await crudApi.get(`/medical-records/${patientUserId}`);
    // API returns { data: {...}, success: true } - extract the actual data
    return response.data?.data || response.data;
  }

  /**
   * Create new medical record
   * @param {Object} recordData - Record data
   * @returns {Promise<MedicalRecord>}
   */
  static async create(recordData) {
    const response = await crudApi.post('/medical-records', recordData);
    return response.data;
  }

  /**
   * Update medical record
   * @param {string} id - Record ID
   * @param {Object} recordData - Record data
   * @returns {Promise<MedicalRecord>}
   */
  static async update(id, recordData) {
    const response = await crudApi.put(`/medical-records/${id}`, recordData);
    return response.data;
  }

  /**
   * Update medical record by patient user ID (for doctors/admins)
   * @param {string} patientUserId - Patient user ID
   * @param {Object} recordData - Record data
   * @returns {Promise<MedicalRecord>}
   */
  static async updateByPatientId(patientUserId, recordData) {
    const response = await crudApi.put(`/medical-records/${patientUserId}`, recordData);
    return response.data;
  }

  /**
   * Get current patient's medical record
   * @returns {Promise<MedicalRecord>}
   */
  static async getMyRecord() {
    const response = await businessApi.get('/consultation/my-medical-record');
    return response.data;
  }

  /**
   * Get patient's complete medical record (alias)
   * @returns {Promise<MedicalRecord>}
   */
  static async get() {
    const response = await crudApi.get('/medical-records');
    return response.data;
  }

  /**
   * Get complete medical record with history
   * @returns {Promise<Object>}
   */
  static async getComplete() {
    const response = await crudApi.get('/medical-records/complete');
    return response.data;
  }

  /**
   * Get lab reports
   * @returns {Promise<Array>}
   */
  static async getLabReports() {
    const response = await crudApi.get('/medical-records/lab-reports');
    return response.data;
  }

  /**
   * Get lab reports by appointment
   * @param {string} appointmentId - Appointment ID
   * @returns {Promise<Array>}
   */
  static async getLabReportsByAppointment(appointmentId) {
    const response = await crudApi.get(`/medical-records/lab-reports/appointment/${appointmentId}`);
    return response.data?.data || response.data || [];
  }

  /**
   * Create lab reports/orders
   * @param {Object} data - Lab report data { patient_id, appointment_id, orders: [{test_name, notes}] }
   * @returns {Promise<Array>}
   */
  static async createLabReports(data) {
    const response = await crudApi.post('/medical-records/lab-reports', data);
    return response.data;
  }

  /**
   * Get doctor's lab reports (all patients)
   * @param {Object} params - Query params { status }
   * @returns {Promise<Array>}
   */
  static async getDoctorLabReports(params = {}) {
    const response = await crudApi.get('/medical-records/lab-reports/doctor', { params });
    return response.data?.data || response.data || [];
  }

  /**
   * Upload results for a lab report (doctor)
   * @param {string} reportId - Lab report ID
   * @param {Object} data - { results: [{parameter_name, result_value, unit, reference_range, status}], interpretation }
   * @returns {Promise<Object>}
   */
  static async uploadLabResults(reportId, data) {
    const response = await crudApi.put(`/medical-records/lab-reports/${reportId}/results`, data);
    return response.data;
  }

  /**
   * Patient uploads results for their pending lab reports
   * @param {string} reportId - Lab report ID
   * @param {Object} data - { results: [{parameter_name, result_value, unit, reference_range, status}], interpretation }
   * @returns {Promise<Object>}
   */
  static async patientUploadResults(reportId, data) {
    const response = await crudApi.put(`/medical-records/lab-reports/${reportId}/patient-results`, data);
    return response.data;
  }

  /**
   * Patient uploads external lab results
   * @param {Object} data - { test_name, lab_name, order_date, results, notes }
   * @returns {Promise<Object>}
   */
  static async patientUploadLabReport(data) {
    const response = await crudApi.post('/medical-records/lab-reports/patient-upload', data);
    return response.data;
  }

  /**
   * Get consultation notes
   * @returns {Promise<Array>}
   */
  static async getConsultationNotes() {
    const response = await crudApi.get('/consultation-notes');
    return response.data;
  }
}

export default MedicalRecordModel;
