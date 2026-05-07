/**
 * Auth Model
 * Handles authentication operations
 * 
 * @module models/Auth
 */

import { externalApi } from '../services/httpClient';
import { STORAGE_KEYS } from '../config/constants';

/**
 * Auth response structure
 * @typedef {Object} AuthResponse
 * @property {string} token - JWT token
 * @property {Object} user - User data
 */

class AuthModel {
  /**
   * Login user
   * @param {string} email - Email
   * @param {string} password - Password
   * @returns {Promise<AuthResponse>}
   */
  static async login(email, password) {
    const response = await externalApi.post('/auth/login', { email, password });
    const { token, user } = response.data?.data || response.data;
    
    // Store in localStorage
    if (token) {
      localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    }
    if (user) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    }
    
    return { token, user };
  }

  /**
   * Register new user
   * @param {Object} userData - Registration data
   * @returns {Promise<AuthResponse>}
   */
  static async register(userData) {
    const response = await externalApi.post('/auth/register', userData);
    const { token, user } = response.data?.data || response.data;
    
    if (token) {
      localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    }
    if (user) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    }
    
    return { token, user };
  }

  /**
   * Logout user
   * @returns {Promise<void>}
   */
  static async logout() {
    try {
      await externalApi.post('/auth/logout');
    } finally {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
  }

  /**
   * Get current user
   * @returns {Promise<Object>}
   */
  static async getCurrentUser() {
    const response = await externalApi.get('/auth/me');
    return response.data?.data || response.data;
  }

  /**
   * Request password reset
   * @param {string} email - Email
   * @returns {Promise<void>}
   */
  static async requestPasswordReset(email) {
    const response = await externalApi.post('/auth/password-reset/request', { email });
    return response.data;
  }

  /**
   * Reset password
   * @param {string} token - Reset token
   * @param {string} newPassword - New password
   * @returns {Promise<void>}
   */
  static async resetPassword(token, newPassword) {
    const response = await externalApi.post('/auth/password-reset/confirm', { 
      token, 
      newPassword 
    });
    return response.data;
  }

  /**
   * Change password
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<void>}
   */
  static async changePassword(currentPassword, newPassword) {
    const response = await externalApi.post('/auth/change-password', {
      currentPassword,
      newPassword
    });
    return response.data;
  }

  /**
   * Refresh token
   * @param {string} token - Current token
   * @returns {Promise<{token: string}>}
   */
  static async refreshToken(token) {
    const response = await externalApi.post('/auth/refresh-token', { token });
    const newToken = response.data?.data?.token || response.data?.token;
    
    if (newToken) {
      localStorage.setItem(STORAGE_KEYS.TOKEN, newToken);
    }
    
    return { token: newToken };
  }

  /**
   * Check if user is authenticated
   * @returns {boolean}
   */
  static isAuthenticated() {
    return !!localStorage.getItem(STORAGE_KEYS.TOKEN);
  }

  /**
   * Get stored user from localStorage
   * @returns {Object|null}
   */
  static getStoredUser() {
    const userJson = localStorage.getItem(STORAGE_KEYS.USER);
    if (!userJson) return null;
    
    try {
      return JSON.parse(userJson);
    } catch {
      return null;
    }
  }

  /**
   * Get stored token
   * @returns {string|null}
   */
  static getToken() {
    return localStorage.getItem(STORAGE_KEYS.TOKEN);
  }
}

export default AuthModel;
