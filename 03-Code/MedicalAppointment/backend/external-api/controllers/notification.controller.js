/**
 * Notification Controller
 * Handles HTTP requests for notifications
 * 
 * @module external-api/controllers/NotificationController
 */

const emailService = require('../services/email.service');
const userNotificationService = require('../services/userNotification.service');
const ResponseBuilder = require('../../shared/utils/responseBuilder.utils');
const { asyncHandler } = require('../../shared/middleware/errorHandler.middleware');
const { ValidationError } = require('../../shared/errors');
const { supabase } = require('../../shared/config/database.config');

class NotificationController {
  /**
   * POST /notifications/appointment-confirmation
   * Send appointment confirmation email
   */
  sendAppointmentConfirmation = asyncHandler(async (req, res) => {
    const { patientEmail, patientName, doctorName, specialty, date, time } = req.body;

    if (!patientEmail || !patientName || !doctorName || !date || !time) {
      throw new ValidationError('Faltan campos requeridos');
    }

    await emailService.sendAppointmentConfirmation({
      patientEmail,
      patientName,
      doctorName,
      specialty,
      date,
      time
    });

    return ResponseBuilder.success(res, { 
      sent: true,
      type: 'appointment_confirmation'
    }, 200, 'Email de confirmación enviado');
  });

  /**
   * POST /notifications/appointment-cancellation
   * Send appointment cancellation email
   */
  sendAppointmentCancellation = asyncHandler(async (req, res) => {
    const { patientEmail, patientName, doctorName, date, time, reason } = req.body;

    if (!patientEmail || !patientName || !date || !time) {
      throw new ValidationError('Faltan campos requeridos');
    }

    await emailService.sendAppointmentCancellation({
      patientEmail,
      patientName,
      doctorName,
      date,
      time,
      reason
    });

    return ResponseBuilder.success(res, { 
      sent: true,
      type: 'appointment_cancellation'
    }, 200, 'Email de cancelación enviado');
  });

  /**
   * POST /notifications/prescription
   * Send prescription notification email
   */
  sendPrescriptionNotification = asyncHandler(async (req, res) => {
    const { patientEmail, patientName, doctorName, medications } = req.body;

    if (!patientEmail || !patientName || !doctorName || !medications) {
      throw new ValidationError('Faltan campos requeridos');
    }

    await emailService.sendPrescriptionNotification({
      patientEmail,
      patientName,
      doctorName,
      medications
    });

    return ResponseBuilder.success(res, { 
      sent: true,
      type: 'prescription'
    }, 200, 'Email de receta enviado');
  });

  /**
   * POST /notifications/custom
   * Send custom notification email AND save to database for in-app display
   */
  sendCustomNotification = asyncHandler(async (req, res) => {
    const { to, subject, title, message, actionUrl, actionText, target, type, sendEmail } = req.body;

    // Validate required fields
    if (!subject || !message) {
      throw new ValidationError('subject y message son requeridos');
    }

    const notificationTitle = title || subject;
    const targetRole = target || to || 'all';

    // Determine if this is a broadcast or direct notification
    const isBroadcast = ['all', 'patients', 'doctors', 'broadcast'].includes(targetRole);

    // Save to database for in-app notifications
    let savedNotification = null;
    try {
      if (isBroadcast) {
        // Map target to role format
        let dbTargetRole = 'all';
        if (targetRole === 'patients') dbTargetRole = 'patient';
        else if (targetRole === 'doctors') dbTargetRole = 'doctor';

        savedNotification = await userNotificationService.createBroadcastNotification({
          targetRole: dbTargetRole,
          title: notificationTitle,
          message,
          notificationType: type || 'announcement',
          priority: 'normal',
          createdByUserId: req.user?.id
        });
      }
    } catch (dbError) {
      console.error('[Notification] Error saving to database:', dbError);
      // Continue even if DB save fails
    }

    // Send email only if explicitly requested
    let emailSent = false;
    let emailsSentCount = 0;
    
    if (sendEmail === true) {
      try {
        // For broadcasts, get users by role and send emails
        if (isBroadcast) {
          // Build query based on target role
          let query = supabase
            .from('users')
            .select('email, first_name, last_name, roles!inner(code)')
            .eq('is_active', true)
            .not('email', 'is', null);
          
          // Filter by role if not 'all'
          if (targetRole === 'patients') {
            query = query.eq('roles.code', 'patient');
          } else if (targetRole === 'doctors') {
            query = query.eq('roles.code', 'doctor');
          }
          // For 'all', we get all active users with emails
          
          const { data: users, error: usersError } = await query;
          
          if (usersError) {
            console.error('[Notification] Error fetching users:', usersError);
          } else if (users && users.length > 0) {
            // Send emails to each user (in batches to avoid rate limits)
            const emailPromises = users.map(user => 
              emailService.sendNotification({
                to: user.email,
                subject,
                title: notificationTitle,
                message,
                actionUrl,
                actionText
              }).catch(err => {
                console.error(`[Notification] Failed to send to ${user.email}:`, err.message);
                return null;
              })
            );
            
            const results = await Promise.all(emailPromises);
            emailsSentCount = results.filter(r => r !== null).length;
            emailSent = emailsSentCount > 0;
            console.log(`[Notification] Sent ${emailsSentCount}/${users.length} emails`);
          }
        } else if (to && to.includes('@')) {
          // Direct email to specific address
          await emailService.sendNotification({
            to,
            subject,
            title: notificationTitle,
            message,
            actionUrl,
            actionText
          });
          emailSent = true;
          emailsSentCount = 1;
        }
      } catch (emailError) {
        console.error('[Notification] Error sending email:', emailError);
      }
    }

    return ResponseBuilder.success(res, { 
      emailSent,
      emailsSentCount,
      savedToDatabase: !!savedNotification,
      notificationId: savedNotification?.id,
      type: 'custom'
    }, 200, savedNotification ? 'Anuncio publicado' : 'Notificación procesada');
  });

  /**
   * GET /notifications/user
   * Get notifications for the authenticated user
   */
  getUserNotifications = asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    const userRole = req.user?.role?.code || req.user?.role;
    const { limit, onlyUnread } = req.query;

    const notifications = await userNotificationService.getNotificationsForUser(
      userId,
      userRole,
      {
        limit: parseInt(limit) || 50,
        onlyUnread: onlyUnread === 'true'
      }
    );

    return ResponseBuilder.success(res, notifications);
  });

  /**
   * GET /notifications/user/unread-count
   * Get unread notification count for the authenticated user
   */
  getUnreadCount = asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    const userRole = req.user?.role?.code || req.user?.role;

    const count = await userNotificationService.getUnreadCount(userId, userRole);

    return ResponseBuilder.success(res, { unreadCount: count });
  });

  /**
   * PUT /notifications/:id/read
   * Mark a notification as read
   */
  markAsRead = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user?.id;

    await userNotificationService.markAsRead(id, userId);

    return ResponseBuilder.success(res, { success: true }, 200, 'Notificación marcada como leída');
  });

  /**
   * DELETE /notifications/:id
   * Delete a notification
   */
  deleteNotification = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user?.id;

    await userNotificationService.deleteNotification(id, userId);

    return ResponseBuilder.success(res, { success: true }, 200, 'Notificación eliminada');
  });

  /**
   * GET /notifications/broadcasts
   * Get all broadcast notifications (admin only)
   */
  getBroadcasts = asyncHandler(async (req, res) => {
    const { limit } = req.query;

    const broadcasts = await userNotificationService.getAllBroadcasts({
      limit: parseInt(limit) || 100
    });

    return ResponseBuilder.success(res, broadcasts);
  });

  /**
   * POST /notifications/password-reset-link
   * Send password reset link email (admin-generated)
   */
  sendPasswordResetLink = asyncHandler(async (req, res) => {
    const { email, userName, resetToken, expiresAt } = req.body;
    const adminName = `${req.user?.first_name || ''} ${req.user?.last_name || ''}`.trim() || 'Administrador';

    if (!email || !userName || !resetToken) {
      throw new ValidationError('email, userName y resetToken son requeridos');
    }

    await emailService.sendAdminPasswordResetLink({
      email,
      userName,
      resetToken,
      expiresAt,
      adminName
    });

    return ResponseBuilder.success(res, { 
      sent: true,
      type: 'password_reset_link'
    }, 200, 'Email con enlace de restablecimiento enviado');
  });

  /**
   * POST /notifications/temporary-password
   * Send temporary password email (admin-generated)
   */
  sendTemporaryPassword = asyncHandler(async (req, res) => {
    const { email, userName, temporaryPassword } = req.body;
    const adminName = `${req.user?.first_name || ''} ${req.user?.last_name || ''}`.trim() || 'Administrador';

    if (!email || !userName || !temporaryPassword) {
      throw new ValidationError('email, userName y temporaryPassword son requeridos');
    }

    await emailService.sendTemporaryPassword({
      email,
      userName,
      temporaryPassword,
      adminName
    });

    return ResponseBuilder.success(res, { 
      sent: true,
      type: 'temporary_password'
    }, 200, 'Email con contraseña temporal enviado');
  });
}

module.exports = new NotificationController();
