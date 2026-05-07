/**
 * User Model
 * Handles user data operations
 * 
 * @module models/User
 */

import { crudApi, externalApi } from '../services/httpClient';

/**
 * User entity structure
 * @typedef {Object} User
 * @property {string} id - User ID
 * @property {string} email - Email address
 * @property {string} first_name - First name
 * @property {string} last_name - Last name
 * @property {string} role - User role (admin, doctor, patient)
 * @property {boolean} is_active - Active status
 * @property {string} created_at - Creation timestamp
 */

class UserModel {
  /**
   * Get all users with pagination
   * @param {Object} params - Query parameters
   * @returns {Promise<{data: User[], total: number}>}
   */
  static async getAll(params = {}) {
    const response = await crudApi.get('/users', { params });
    return response.data;
  }

  /**
   * Get user by ID
   * @param {string} id - User ID
   * @returns {Promise<User>}
   */
  static async getById(id) {
    const response = await crudApi.get(`/users/${id}`);
    return response.data;
  }

  /**
   * Create a new user
   * @param {Object} userData - User data
   * @returns {Promise<User>}
   */
  static async create(userData) {
    const response = await crudApi.post('/users', userData);
    return response.data;
  }

  /**
   * Update user
   * @param {string} id - User ID
   * @param {Object} userData - User data
   * @returns {Promise<User>}
   */
  static async update(id, userData) {
    const response = await crudApi.put(`/users/${id}`, userData);
    return response.data;
  }

  /**
   * Soft delete user
   * @param {string} id - User ID
   * @returns {Promise<void>}
   */
  static async delete(id) {
    const response = await crudApi.delete(`/users/${id}`);
    return response.data;
  }

  /**
   * Search users
   * @param {string} query - Search query
   * @param {Object} params - Additional parameters
   * @returns {Promise<User[]>}
   */
  static async search(query, params = {}) {
    const response = await crudApi.get('/users/search', { 
      params: { query, ...params } 
    });
    return response.data;
  }
}

export default UserModel;
