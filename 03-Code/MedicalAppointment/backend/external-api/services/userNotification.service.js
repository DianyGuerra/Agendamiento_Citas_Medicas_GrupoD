/**
 * User Notification Service
 * Handles in-app notifications storage and retrieval
 * 
 * @module external-api/services/UserNotificationService
 */

const { supabase } = require('../../shared/config/database.config');

class UserNotificationService {
  /**
   * Create a broadcast notification (to all users of a role or all users)
   * @param {Object} data - Notification data
   * @param {string} data.targetRole - 'patient', 'doctor', or 'all'
   * @param {string} data.title - Notification title
   * @param {string} data.message - Notification message
   * @param {string} [data.notificationType='announcement'] - Type of notification
   * @param {string} [data.priority='normal'] - Priority level
   * @param {Date} [data.expiresAt] - Optional expiration date
   * @param {string} data.createdByUserId - User who created the notification
   */
  async createBroadcastNotification(data) {
    const {
      targetRole,
      title,
      message,
      notificationType = 'announcement',
      priority = 'normal',
      expiresAt = null,
      createdByUserId
    } = data;

    const { data: notification, error } = await supabase
      .from('user_notifications')
      .insert({
        user_id: null, // NULL means broadcast
        target_role: targetRole,
        title,
        message,
        notification_type: notificationType,
        priority,
        expires_at: expiresAt,
        created_by_user_id: createdByUserId,
        is_read: false,
        is_deleted: false
      })
      .select()
      .single();

    if (error) throw error;

    return notification;
  }

  /**
   * Create a direct notification to a specific user
   * @param {Object} data - Notification data
   * @param {string} data.userId - Target user ID
   * @param {string} data.title - Notification title
   * @param {string} data.message - Notification message
   * @param {string} [data.notificationType='system'] - Type of notification
   * @param {string} [data.priority='normal'] - Priority level
   * @param {Date} [data.expiresAt] - Optional expiration date
   * @param {string} [data.createdByUserId] - User who created the notification
   */
  async createDirectNotification(data) {
    const {
      userId,
      title,
      message,
      notificationType = 'system',
      priority = 'normal',
      expiresAt = null,
      createdByUserId = null
    } = data;

    const { data: notification, error } = await supabase
      .from('user_notifications')
      .insert({
        user_id: userId,
        target_role: null,
        title,
        message,
        notification_type: notificationType,
        priority,
        expires_at: expiresAt,
        created_by_user_id: createdByUserId,
        is_read: false,
        is_deleted: false
      })
      .select()
      .single();

    if (error) throw error;

    return notification;
  }

  /**
   * Get notifications for a user (including broadcasts for their role)
   * @param {string} userId - User ID
   * @param {string} userRole - User's role ('patient' or 'doctor')
   * @param {Object} options - Query options
   */
  async getNotificationsForUser(userId, userRole, options = {}) {
    const { 
      limit = 50, 
      includeRead = true,
      onlyUnread = false 
    } = options;

    let query = supabase
      .from('user_notifications')
      .select('*')
      .is('is_deleted', false)
      .or(`user_id.eq.${userId},and(user_id.is.null,target_role.in.(${userRole},all))`)
      .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(limit);

    if (onlyUnread) {
      query = query.is('is_read', false);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data || [];
  }

  /**
   * Get unread notification count for a user
   * @param {string} userId - User ID
   * @param {string} userRole - User's role
   */
  async getUnreadCount(userId, userRole) {
    const { count, error } = await supabase
      .from('user_notifications')
      .select('*', { count: 'exact', head: true })
      .is('is_deleted', false)
      .is('is_read', false)
      .or(`user_id.eq.${userId},and(user_id.is.null,target_role.in.(${userRole},all))`)
      .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString());

    if (error) throw error;

    return count || 0;
  }

  /**
   * Mark a notification as read
   * @param {string} notificationId - Notification ID
   * @param {string} userId - User ID (for verification)
   */
  async markAsRead(notificationId, userId) {
    // For broadcast notifications, we need a different approach
    // Since we can't modify the original, we track read status separately
    const { data: notification, error: fetchError } = await supabase
      .from('user_notifications')
      .select('user_id')
      .eq('id', notificationId)
      .single();

    if (fetchError) throw fetchError;

    // Only mark as read if it's a direct notification to this user
    if (notification.user_id === userId) {
      const { error } = await supabase
        .from('user_notifications')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (error) throw error;
    }

    // For broadcast notifications, the frontend should track read status in localStorage
    return { success: true };
  }

  /**
   * Soft delete a notification for a user
   * @param {string} notificationId - Notification ID
   * @param {string} userId - User ID
   */
  async deleteNotification(notificationId, userId) {
    const { data: notification, error: fetchError } = await supabase
      .from('user_notifications')
      .select('user_id')
      .eq('id', notificationId)
      .single();

    if (fetchError) throw fetchError;

    // Only delete if it's a direct notification to this user
    if (notification.user_id === userId) {
      const { error } = await supabase
        .from('user_notifications')
        .update({ 
          is_deleted: true, 
          deleted_at: new Date().toISOString() 
        })
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (error) throw error;
    }

    return { success: true };
  }

  /**
   * Get all broadcast notifications (for admin)
   * @param {Object} options - Query options
   */
  async getAllBroadcasts(options = {}) {
    const { limit = 100 } = options;

    const { data, error } = await supabase
      .from('user_notifications')
      .select(`
        *,
        created_by:created_by_user_id(first_name, last_name, email)
      `)
      .is('user_id', null) // Only broadcasts
      .is('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data || [];
  }
}

module.exports = new UserNotificationService();
