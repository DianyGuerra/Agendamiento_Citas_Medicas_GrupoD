/**
 * Billing Model
 * Handles billing and payment operations
 * 
 * @module models/Billing
 */

import { crudApi, businessApi } from '../services/httpClient';

/**
 * Billing entity structure
 * @typedef {Object} Billing
 * @property {string} id - Billing ID
 * @property {string} appointment_id - Appointment ID
 * @property {number} amount - Total amount
 * @property {string} status - Billing status
 * @property {string} payment_method - Payment method
 * @property {string} paid_at - Payment date
 */

class BillingModel {
  /**
   * Get all billings
   * @param {Object} params - Query parameters
   * @returns {Promise<Billing[]>}
   */
  static async getAll(params = {}) {
    const response = await crudApi.get('/billings', { params });
    return response.data;
  }

  /**
   * Get billing by ID
   * @param {string} id - Billing ID
   * @returns {Promise<Billing>}
   */
  static async getById(id) {
    const response = await crudApi.get(`/billings/${id}`);
    return response.data;
  }

  /**
   * Create new billing
   * @param {Object} billingData - Billing data
   * @returns {Promise<Billing>}
   */
  static async create(billingData) {
    const response = await crudApi.post('/billings', billingData);
    return response.data;
  }

  /**
   * Update billing
   * @param {string} id - Billing ID
   * @param {Object} billingData - Billing data
   * @returns {Promise<Billing>}
   */
  static async update(id, billingData) {
    const response = await crudApi.put(`/billings/${id}`, billingData);
    return response.data;
  }

  /**
   * Calculate billing for appointment
   * @param {string} appointmentId - Appointment ID
   * @returns {Promise<{amount: number, breakdown: Object}>}
   */
  static async calculateForAppointment(appointmentId) {
    const response = await businessApi.get(
      `/billing-calculations/calculate/${appointmentId}`
    );
    return response.data;
  }

  /**
   * Generate invoice for appointment
   * @param {string} appointmentId - Appointment ID
   * @returns {Promise<Billing>}
   */
  static async generateInvoice(appointmentId) {
    const response = await businessApi.post(
      `/billing-calculations/generate/${appointmentId}`
    );
    return response.data;
  }

  /**
   * Process payment
   * @param {string} billingId - Billing ID
   * @param {Object} paymentData - Payment data
   * @returns {Promise<Billing>}
   */
  static async processPayment(billingId, paymentData) {
    const response = await businessApi.post(
      `/billing-calculations/payment/${billingId}`,
      paymentData
    );
    return response.data;
  }

  /**
   * Get patient's billings
   * @returns {Promise<Billing[]>}
   */
  static async getMyBillings() {
    const response = await businessApi.get('/billing-calculations/my-billings');
    return response.data;
  }

  /**
   * Get billing summary/statistics
   * @param {Object} params - Query parameters (date range)
   * @returns {Promise<Object>}
   */
  static async getSummary(params = {}) {
    const response = await businessApi.get('/billing-calculations/statistics', { params });
    return response.data;
  }
}

export default BillingModel;
