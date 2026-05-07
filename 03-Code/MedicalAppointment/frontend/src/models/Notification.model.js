/**
 * Notification Model
 * Handles notification and messaging operations
 * 
 * @module models/Notification
 */

import { externalApi, crudApi } from '../services/httpClient';

class NotificationModel {
  // =========================================================================
  // Email Notifications (External API)
  // =========================================================================

  /**
   * Send appointment confirmation email
   * @param {Object} data - Notification data
   * @returns {Promise<void>}
   */
  static async sendAppointmentConfirmation(data) {
    const response = await externalApi.post('/notifications/appointment-confirmation', data);
    return response.data;
  }

  /**
   * Send appointment cancellation email
   * @param {Object} data - Notification data
   * @returns {Promise<void>}
   */
  static async sendAppointmentCancellation(data) {
    const response = await externalApi.post('/notifications/appointment-cancellation', data);
    return response.data;
  }

  /**
   * Send prescription notification
   * @param {Object} data - Notification data
   * @returns {Promise<void>}
   */
  static async sendPrescription(data) {
    const response = await externalApi.post('/notifications/prescription', data);
    return response.data;
  }

  /**
   * Send custom notification
   * @param {Object} data - Notification data
   * @returns {Promise<void>}
   */
  static async sendCustom(data) {
    const response = await externalApi.post('/notifications/custom', data);
    return response.data;
  }

  // =========================================================================
  // In-App Messaging (CRUD API)
  // =========================================================================

  /**
   * Get patient messages
   * @returns {Promise<Array>}
   */
  static async getPatientMessages() {
    // TODO: Implement when messages endpoint is available
    // const response = await crudApi.get('/messages');
    // return response.data;
    return { data: [] };
  }

  /**
   * Send message reply
   * @param {string} messageId - Message ID
   * @param {Object} data - Reply data
   * @returns {Promise<Object>}
   */
  static async sendReply(messageId, data) {
    // TODO: Implement when messages endpoint is available
    // const response = await crudApi.post(`/messages/${messageId}/reply`, data);
    // return response.data;
    throw new Error('Messaging feature coming soon');
  }

  /**
   * Get doctor messages
   * @returns {Promise<Array>}
   */
  static async getDoctorMessages() {
    // TODO: Implement when messages endpoint is available
    return { data: [] };
  }

  // =========================================================================
  // In-App Notifications (External API - user_notifications table)
  // =========================================================================

  /**
   * Get notifications for the authenticated user (including broadcasts)
   * @param {Object} options - Query options
   * @param {number} [options.limit=50] - Max notifications to return
   * @param {boolean} [options.onlyUnread=false] - Only return unread
   * @returns {Promise<Array>}
   */
  static async getUserNotifications(options = {}) {
    const params = new URLSearchParams();
    if (options.limit) params.append('limit', options.limit);
    if (options.onlyUnread) params.append('onlyUnread', 'true');
    
    const response = await externalApi.get(`/notifications/user?${params.toString()}`);
    return response.data?.data || response.data || [];
  }

  /**
   * Get unread notification count
   * @returns {Promise<number>}
   */
  static async getUnreadCount() {
    const response = await externalApi.get('/notifications/user/unread-count');
    return response.data?.data?.unreadCount || response.data?.unreadCount || 0;
  }

  /**
   * Mark a notification as read
   * @param {string} notificationId - Notification ID
   * @returns {Promise<Object>}
   */
  static async markAsRead(notificationId) {
    const response = await externalApi.put(`/notifications/${notificationId}/read`);
    return response.data;
  }

  /**
   * Delete a notification
   * @param {string} notificationId - Notification ID
   * @returns {Promise<Object>}
   */
  static async deleteNotification(notificationId) {
    const response = await externalApi.delete(`/notifications/${notificationId}`);
    return response.data;
  }

  /**
   * Get all broadcast notifications (admin only)
   * @param {Object} options - Query options
   * @returns {Promise<Array>}
   */
  static async getBroadcasts(options = {}) {
    const params = new URLSearchParams();
    if (options.limit) params.append('limit', options.limit);
    
    const response = await externalApi.get(`/notifications/broadcasts?${params.toString()}`);
    return response.data?.data || response.data || [];
  }
}

export default NotificationModel;
