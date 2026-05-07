/**
 * Prescription Model
 * Handles prescription data operations
 * 
 * @module models/Prescription
 */

import { crudApi, businessApi, externalApi } from '../services/httpClient';

/**
 * Prescription entity structure
 * @typedef {Object} Prescription
 * @property {string} id - Prescription ID
 * @property {string} appointment_id - Appointment ID
 * @property {Object[]} medications - Medications list
 * @property {string} notes - Additional notes
 * @property {string} qr_code - QR code data
 */

class PrescriptionModel {
  /**
   * Get all prescriptions
   * @param {Object} params - Query parameters
   * @returns {Promise<Prescription[]>}
   */
  static async getAll(params = {}) {
    const response = await crudApi.get('/prescriptions', { params });
    return response.data;
  }

  /**
   * Get prescription by ID
   * @param {string} id - Prescription ID
   * @returns {Promise<Prescription>}
   */
  static async getById(id) {
    const response = await crudApi.get(`/prescriptions/${id}`);
    return response.data;
  }

  /**
   * Create new prescription
   * @param {Object} prescriptionData - Prescription data
   * @returns {Promise<Prescription>}
   */
  static async create(prescriptionData) {
    const response = await crudApi.post('/prescriptions', prescriptionData);
    return response.data;
  }

  /**
   * Update prescription
   * @param {string} id - Prescription ID
   * @param {Object} prescriptionData - Prescription data
   * @returns {Promise<Prescription>}
   */
  static async update(id, prescriptionData) {
    const response = await crudApi.put(`/prescriptions/${id}`, prescriptionData);
    return response.data;
  }

  /**
   * Delete prescription (soft delete)
   * @param {string} id - Prescription ID
   * @returns {Promise<void>}
   */
  static async delete(id) {
    const response = await crudApi.delete(`/prescriptions/${id}`);
    return response.data;
  }

  /**
   * Get prescription by appointment ID
   * @param {string} appointmentId - Appointment ID
   * @returns {Promise<Prescription>}
   */
  static async getByAppointment(appointmentId) {
    // Add timestamp to prevent browser caching
    const response = await businessApi.get(
      `/consultations/${appointmentId}/prescriptions`,
      { params: { _t: Date.now() } }
    );
    // API returns { success: true, data: { medications: [...], ... } }
    // Extract the actual data
    const result = response.data?.data || response.data;
    console.log('[Prescription] Loaded for appointment:', appointmentId, result);
    return result;
  }

  /**
   * Create prescription for appointment
   * @param {string} appointmentId - Appointment ID
   * @param {Object} prescriptionData - Prescription data
   * @returns {Promise<Prescription>}
   */
  static async createForAppointment(appointmentId, prescriptionData) {
    const response = await businessApi.post(
      `/consultations/${appointmentId}/prescription`,
      prescriptionData
    );
    return response.data;
  }

  /**
   * Get current patient's prescriptions
   * @returns {Promise<Prescription[]>}
   */
  static async getMyPrescriptions() {
    const response = await businessApi.get('/consultation/my-prescriptions');
    return response.data;
  }

  /**
   * Generate QR code for prescription
   * @param {string} prescriptionId - Prescription ID
   * @returns {Promise<{qrCode: string}>}
   */
  static async generateQR(prescriptionId) {
    const response = await externalApi.post(`/qr-codes/prescription/${prescriptionId}`);
    return response.data;
  }

  /**
   * Verify prescription QR code
   * @param {string} qrData - QR code data
   * @returns {Promise<Object>}
   */
  static async verifyQR(qrData) {
    const response = await externalApi.post('/qr-codes/verify', { qrData });
    return response.data;
  }

  /**
   * Get patient prescriptions (alias)
   * @returns {Promise<Prescription[]>}
   */
  static async getPatientPrescriptions() {
    const response = await crudApi.get('/prescriptions');
    return response.data;
  }

  // ==================== RENEWAL METHODS ====================

  /**
   * Request a prescription renewal
   * @param {string} prescriptionId - Original prescription ID
   * @param {Object} renewalData - Renewal request data
   * @param {string} [renewalData.reason] - Reason for renewal
   * @param {string} [renewalData.notes] - Additional notes
   * @returns {Promise<Object>}
   */
  static async requestRenewal(prescriptionId, renewalData = {}) {
    const response = await crudApi.post('/prescription-renewals', {
      prescription_id: prescriptionId,
      reason: renewalData.reason,
      notes: renewalData.notes
    });
    return response.data;
  }

  /**
   * Get my renewal requests
   * @param {Object} params - Query parameters
   * @param {string} [params.status] - Filter by status (pending, approved, rejected, cancelled)
   * @returns {Promise<Array>}
   */
  static async getMyRenewals(params = {}) {
    const response = await crudApi.get('/prescription-renewals', { params });
    return response.data;
  }

  /**
   * Get renewal requests (doctor view - can filter by status)
   * @param {string|Object} statusOrParams - Filter by status (pending, approved, rejected, cancelled, all) or params object
   * @returns {Promise<Array>}
   */
  static async getRenewals(statusOrParams = 'all') {
    // Support both string status and object params
    let params = {};
    if (typeof statusOrParams === 'string') {
      if (statusOrParams && statusOrParams !== 'all') {
        params = { status: statusOrParams };
      }
    } else if (typeof statusOrParams === 'object') {
      params = statusOrParams;
    }
    const response = await crudApi.get('/prescription-renewals', { params });
    return response.data;
  }

  /**
   * Get pending renewals count (doctor)
   * @returns {Promise<{count: number}>}
   */
  static async getPendingRenewalsCount() {
    const response = await crudApi.get('/prescription-renewals/pending-count');
    return response.data;
  }

  /**
   * Get renewal by ID
   * @param {string} renewalId - Renewal ID
   * @returns {Promise<Object>}
   */
  static async getRenewalById(renewalId) {
    const response = await crudApi.get(`/prescription-renewals/${renewalId}`);
    return response.data;
  }

  /**
   * Approve a renewal request (doctor)
   * @param {string} renewalId - Renewal ID
   * @param {Object} approvalData - Approval data
   * @param {string} [approvalData.doctor_response] - Response message
   * @param {Object} [approvalData.modifications] - Optional modifications to prescription
   * @returns {Promise<Object>}
   */
  static async approveRenewal(renewalId, approvalData = {}) {
    const response = await crudApi.put(`/prescription-renewals/${renewalId}/approve`, approvalData);
    return response.data;
  }

  /**
   * Reject a renewal request (doctor)
   * @param {string} renewalId - Renewal ID
   * @param {Object} rejectionData - Rejection data
   * @param {string} rejectionData.rejection_reason - Reason for rejection
   * @param {string} [rejectionData.doctor_response] - Additional response
   * @returns {Promise<Object>}
   */
  static async rejectRenewal(renewalId, rejectionData) {
    const response = await crudApi.put(`/prescription-renewals/${renewalId}/reject`, rejectionData);
    return response.data;
  }

  /**
   * Cancel a renewal request (patient)
   * @param {string} renewalId - Renewal ID
   * @returns {Promise<Object>}
   */
  static async cancelRenewal(renewalId) {
    const response = await crudApi.delete(`/prescription-renewals/${renewalId}`);
    return response.data;
  }
}

export default PrescriptionModel;
