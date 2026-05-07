/**
 * Insurance Provider Model
 * Handles insurance provider data operations
 * 
 * @module models/InsuranceProvider
 */

import { crudApi } from '../services/httpClient';

/**
 * Insurance Provider entity structure
 * @typedef {Object} InsuranceProvider
 * @property {string} id - Provider ID (UUID)
 * @property {string} name - Provider name
 * @property {string} code - Provider code
 * @property {number} discount_percentage - Discount percentage
 * @property {string[]} coverage_types - Types of coverage offered
 * @property {string} contact_phone - Contact phone number
 * @property {string} contact_email - Contact email
 * @property {boolean} is_active - Whether provider is active
 */

class InsuranceProviderModel {
  /**
   * Get all active insurance providers
   * @returns {Promise<InsuranceProvider[]>}
   */
  static async getAll() {
    const response = await crudApi.get('/insurance-providers');
    return response.data?.data || response.data || [];
  }

  /**
   * Get insurance provider by ID
   * @param {string} id - Provider ID
   * @returns {Promise<InsuranceProvider>}
   */
  static async getById(id) {
    const response = await crudApi.get(`/insurance-providers/${id}`);
    return response.data?.data || response.data;
  }

  /**
   * Get insurance provider by code
   * @param {string} code - Provider code
   * @returns {Promise<InsuranceProvider>}
   */
  static async getByCode(code) {
    const response = await crudApi.get(`/insurance-providers/code/${code}`);
    return response.data?.data || response.data;
  }

  /**
   * Create new insurance provider (Admin only)
   * @param {Object} providerData - Provider data
   * @returns {Promise<InsuranceProvider>}
   */
  static async create(providerData) {
    const response = await crudApi.post('/insurance-providers', providerData);
    return response.data?.data || response.data;
  }

  /**
   * Update insurance provider (Admin only)
   * @param {string} id - Provider ID
   * @param {Object} providerData - Updated provider data
   * @returns {Promise<InsuranceProvider>}
   */
  static async update(id, providerData) {
    const response = await crudApi.put(`/insurance-providers/${id}`, providerData);
    return response.data?.data || response.data;
  }

  /**
   * Delete insurance provider (Admin only)
   * @param {string} id - Provider ID
   * @returns {Promise<void>}
   */
  static async delete(id) {
    const response = await crudApi.delete(`/insurance-providers/${id}`);
    return response.data?.data || response.data;
  }
}

export default InsuranceProviderModel;
