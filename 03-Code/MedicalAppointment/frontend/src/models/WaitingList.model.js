/**
 * Waiting List Model
 * Handles waiting list operations
 * 
 * @module models/WaitingList
 */

import { crudApi } from '../services/httpClient';

/**
 * WaitingList entry structure
 * @typedef {Object} WaitingListEntry
 * @property {string} id - Entry ID
 * @property {string} patient_user_id - Patient user ID
 * @property {string} doctor_id - Doctor ID
 * @property {string} preferred_date - Preferred date
 * @property {string} preferred_time_start - Preferred time start
 * @property {string} preferred_time_end - Preferred time end
 * @property {number} priority - Priority level (1-5)
 * @property {string} reason - Reason for appointment
 * @property {string} status - Status (waiting, notified, booked, cancelled)
 */

class WaitingListModel {
  /**
   * Get all waiting list entries
   * @param {Object} params - Query parameters
   * @returns {Promise<WaitingListEntry[]>}
   */
  static async getAll(params = {}) {
    const response = await crudApi.get('/waiting-list', { params });
    return response.data;
  }

  /**
   * Get waiting list entry by ID
   * @param {string} id - Entry ID
   * @returns {Promise<WaitingListEntry>}
   */
  static async getById(id) {
    const response = await crudApi.get(`/waiting-list/${id}`);
    return response.data;
  }

  /**
   * Add to waiting list
   * @param {Object} entryData - Entry data
   * @returns {Promise<WaitingListEntry>}
   */
  static async create(entryData) {
    const response = await crudApi.post('/waiting-list', entryData);
    return response.data;
  }

  /**
   * Update waiting list entry
   * @param {string} id - Entry ID
   * @param {Object} entryData - Entry data
   * @returns {Promise<WaitingListEntry>}
   */
  static async update(id, entryData) {
    const response = await crudApi.put(`/waiting-list/${id}`, entryData);
    return response.data;
  }

  /**
   * Remove from waiting list
   * @param {string} id - Entry ID
   * @returns {Promise<void>}
   */
  static async delete(id) {
    const response = await crudApi.delete(`/waiting-list/${id}`);
    return response.data;
  }

  /**
   * Update entry status
   * @param {string} id - Entry ID
   * @param {string} status - New status
   * @returns {Promise<WaitingListEntry>}
   */
  static async updateStatus(id, status) {
    const response = await crudApi.patch(`/waiting-list/${id}/status`, { status });
    return response.data;
  }

  /**
   * Get count by doctor
   * @param {string} doctorId - Doctor ID
   * @returns {Promise<{count: number}>}
   */
  static async getCountByDoctor(doctorId) {
    const response = await crudApi.get(`/waiting-list/doctor/${doctorId}/count`);
    return response.data;
  }

  /**
   * Get my waiting list entries (patient)
   * @returns {Promise<WaitingListEntry[]>}
   */
  static async getMyEntries() {
    const response = await crudApi.get('/waiting-list', {
      params: { patient_user_id: 'me' }
    });
    return response.data;
  }
}

export default WaitingListModel;
