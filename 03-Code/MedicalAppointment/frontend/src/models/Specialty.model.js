/**
 * Specialty Model
 * Handles medical specialty data operations
 * 
 * @module models/Specialty
 */

import { crudApi } from '../services/httpClient';

/**
 * Specialty entity structure
 * @typedef {Object} Specialty
 * @property {string} id - Specialty ID
 * @property {string} name - Specialty name
 * @property {string} description - Description
 * @property {boolean} is_active - Active status
 */

class SpecialtyModel {
  /**
   * Get all specialties
   * @param {Object} params - Query parameters
   * @returns {Promise<Specialty[]>}
   */
  static async getAll(params = {}) {
    const response = await crudApi.get('/specialties', { params });
    return response.data;
  }

  /**
   * Get specialty by ID
   * @param {string} id - Specialty ID
   * @returns {Promise<Specialty>}
   */
  static async getById(id) {
    const response = await crudApi.get(`/specialties/${id}`);
    return response.data;
  }

  /**
   * Create new specialty
   * @param {Object} specialtyData - Specialty data
   * @returns {Promise<Specialty>}
   */
  static async create(specialtyData) {
    const response = await crudApi.post('/specialties', specialtyData);
    return response.data;
  }

  /**
   * Update specialty
   * @param {string} id - Specialty ID
   * @param {Object} specialtyData - Specialty data
   * @returns {Promise<Specialty>}
   */
  static async update(id, specialtyData) {
    const response = await crudApi.put(`/specialties/${id}`, specialtyData);
    return response.data;
  }

  /**
   * Delete specialty (soft delete)
   * @param {string} id - Specialty ID
   * @returns {Promise<void>}
   */
  static async delete(id) {
    const response = await crudApi.delete(`/specialties/${id}`);
    return response.data;
  }

  /**
   * Get active specialties
   * @returns {Promise<Specialty[]>}
   */
  static async getActive() {
    const response = await crudApi.get('/specialties', {
      params: { is_active: true }
    });
    return response.data;
  }

  /**
   * Get specialty statistics
   * @returns {Promise<Object>}
   */
  static async getStats() {
    const response = await crudApi.get('/specialties/stats');
    return response.data;
  }
}

export default SpecialtyModel;
