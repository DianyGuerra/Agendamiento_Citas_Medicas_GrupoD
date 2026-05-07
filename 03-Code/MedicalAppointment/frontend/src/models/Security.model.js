/**
 * Security Model
 * Handles security & access management data operations
 * 
 * @module models/Security
 */

import { crudApi } from '../services/httpClient';

class SecurityModel {
  // =========================================================================
  // STATS
  // =========================================================================

  /**
   * Get security dashboard stats
   * @returns {Promise<Object>}
   */
  static async getStats() {
    const response = await crudApi.get('/security/stats');
    return response.data?.data || response.data;
  }

  // =========================================================================
  // USERS MANAGEMENT
  // =========================================================================

  /**
   * Get all users with filters
   * @param {Object} params - Query parameters
   * @returns {Promise<{data: Array, pagination: Object}>}
   */
  static async getUsers(params = {}) {
    const response = await crudApi.get('/security/users', { params });
    return response.data;
  }

  /**
   * Get user details with relations
   * @param {string} id - User ID
   * @returns {Promise<Object>}
   */
  static async getUserDetails(id) {
    const response = await crudApi.get(`/security/users/${id}`);
    return response.data?.data || response.data;
  }

  /**
   * Update user status (activate/deactivate)
   * @param {string} id - User ID
   * @param {boolean} isActive - New status
   * @returns {Promise<Object>}
   */
  static async updateUserStatus(id, isActive) {
    const response = await crudApi.patch(`/security/users/${id}/status`, { is_active: isActive });
    return response.data?.data || response.data;
  }

  /**
   * Change user role
   * @param {string} id - User ID
   * @param {string} roleId - New role ID
   * @returns {Promise<Object>}
   */
  static async changeUserRole(id, roleId) {
    const response = await crudApi.patch(`/security/users/${id}/role`, { role_id: roleId, confirm: true });
    return response.data?.data || response.data;
  }

  /**
   * Force verify user email
   * @param {string} id - User ID
   * @returns {Promise<Object>}
   */
  static async forceVerifyEmail(id) {
    const response = await crudApi.patch(`/security/users/${id}/verify-email`, { force_verify: true });
    return response.data?.data || response.data;
  }

  /**
   * Get user activity history
   * @param {string} id - User ID
   * @param {Object} params - Query parameters
   * @returns {Promise<{data: Array, pagination: Object}>}
   */
  static async getUserActivity(id, params = {}) {
    const response = await crudApi.get(`/security/users/${id}/activity`, { params });
    return response.data;
  }

  // =========================================================================
  // PASSWORD RESET MANAGEMENT
  // =========================================================================

  /**
   * Get password reset history for a user
   * @param {string} id - User ID
   * @returns {Promise<Array>}
   */
  static async getPasswordResets(id) {
    const response = await crudApi.get(`/security/users/${id}/password-resets`);
    return response.data?.data || response.data;
  }

  /**
   * Generate password reset token
   * @param {string} id - User ID
   * @returns {Promise<Object>}
   */
  static async generatePasswordReset(id) {
    const response = await crudApi.post(`/security/users/${id}/password-reset`, { confirm: true });
    return response.data?.data || response.data;
  }

  /**
   * Invalidate all password reset tokens
   * @param {string} id - User ID
   * @returns {Promise<Object>}
   */
  static async invalidatePasswordTokens(id) {
    const response = await crudApi.post(`/security/users/${id}/invalidate-tokens`);
    return response.data?.data || response.data;
  }

  /**
   * Admin sets new password for user
   * @param {string} id - User ID
   * @param {string} newPassword - New password
   * @returns {Promise<Object>}
   */
  static async setUserPassword(id, newPassword) {
    const response = await crudApi.post(`/security/users/${id}/set-password`, { 
      new_password: newPassword, 
      confirm: true 
    });
    return response.data?.data || response.data;
  }

  // =========================================================================
  // ROLES MANAGEMENT
  // =========================================================================

  /**
   * Get all roles with user counts
   * @returns {Promise<Array>}
   */
  static async getRoles() {
    const response = await crudApi.get('/security/roles');
    return response.data?.data || response.data;
  }

  /**
   * Get role by ID
   * @param {string} id - Role ID
   * @returns {Promise<Object>}
   */
  static async getRoleById(id) {
    const response = await crudApi.get(`/security/roles/${id}`);
    return response.data?.data || response.data;
  }

  /**
   * Create new role
   * @param {Object} roleData - Role data
   * @returns {Promise<Object>}
   */
  static async createRole(roleData) {
    const response = await crudApi.post('/security/roles', roleData);
    return response.data?.data || response.data;
  }

  /**
   * Update role
   * @param {string} id - Role ID
   * @param {Object} roleData - Role data
   * @returns {Promise<Object>}
   */
  static async updateRole(id, roleData) {
    const response = await crudApi.put(`/security/roles/${id}`, roleData);
    return response.data?.data || response.data;
  }

  /**
   * Delete role
   * @param {string} id - Role ID
   * @returns {Promise<Object>}
   */
  static async deleteRole(id) {
    const response = await crudApi.delete(`/security/roles/${id}`);
    return response.data?.data || response.data;
  }

  /**
   * Update role permissions
   * @param {string} id - Role ID
   * @param {Array<string>} permissions - Array of permission strings
   * @returns {Promise<Object>}
   */
  static async updateRolePermissions(id, permissions) {
    const response = await crudApi.patch(`/security/roles/${id}/permissions`, { permissions });
    return response.data?.data || response.data;
  }

  // =========================================================================
  // ADMINISTRATORS MANAGEMENT
  // =========================================================================

  /**
   * Get all administrators
   * @returns {Promise<Array>}
   */
  static async getAdministrators() {
    const response = await crudApi.get('/security/administrators');
    return response.data?.data || response.data;
  }

  /**
   * Get administrator by ID
   * @param {string} id - Administrator ID
   * @returns {Promise<Object>}
   */
  static async getAdministratorById(id) {
    const response = await crudApi.get(`/security/administrators/${id}`);
    return response.data?.data || response.data;
  }

  /**
   * Update administrator permissions
   * @param {string} id - Administrator ID
   * @param {Array<string>} permissions - Permissions array
   * @returns {Promise<Object>}
   */
  static async updateAdminPermissions(id, permissions) {
    const response = await crudApi.patch(`/security/administrators/${id}/permissions`, { 
      permissions, 
      confirm: true 
    });
    return response.data?.data || response.data;
  }

  /**
   * Toggle super admin status
   * @param {string} id - Administrator ID
   * @param {boolean} isSuperAdmin - Super admin status
   * @returns {Promise<Object>}
   */
  static async toggleSuperAdmin(id, isSuperAdmin) {
    const response = await crudApi.patch(`/security/administrators/${id}/super-admin`, { 
      is_super_admin: isSuperAdmin, 
      confirm: true 
    });
    return response.data?.data || response.data;
  }

  // =========================================================================
  // AUDIT LOGS
  // =========================================================================

  /**
   * Get audit logs with filters
   * @param {Object} params - Query parameters
   * @returns {Promise<{data: Array, pagination: Object}>}
   */
  static async getAuditLogs(params = {}) {
    const response = await crudApi.get('/security/audit-logs', { params });
    return response.data;
  }

  /**
   * Get filter options for audit logs
   * @returns {Promise<Object>}
   */
  static async getAuditLogFilters() {
    const response = await crudApi.get('/security/audit-logs/filters');
    return response.data?.data || response.data;
  }

  // =========================================================================
  // PERMISSIONS MATRIX
  // =========================================================================

  /**
   * Get the permissions matrix definition
   * @returns {Promise<Object>}
   */
  static async getPermissionsMatrix() {
    const response = await crudApi.get('/security/permissions-matrix');
    return response.data?.data || response.data;
  }
}

export default SecurityModel;
