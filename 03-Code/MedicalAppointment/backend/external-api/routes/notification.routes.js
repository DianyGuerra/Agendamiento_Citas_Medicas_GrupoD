/**
 * Notification Routes
 * @module external-api/routes/notification.routes
 */

const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const { authMiddleware, requireRole } = require('../../shared/middleware/auth.middleware');

// All notification routes require authentication
router.use(authMiddleware);

/**
 * @route GET /notifications/user
 * @desc Get notifications for the authenticated user (broadcasts + direct)
 * @access All authenticated users
 */
router.get(
  '/user',
  notificationController.getUserNotifications
);

/**
 * @route GET /notifications/user/unread-count
 * @desc Get unread notification count for the authenticated user
 * @access All authenticated users
 */
router.get(
  '/user/unread-count',
  notificationController.getUnreadCount
);

/**
 * @route PUT /notifications/:id/read
 * @desc Mark a notification as read
 * @access All authenticated users
 */
router.put(
  '/:id/read',
  notificationController.markAsRead
);

/**
 * @route DELETE /notifications/:id
 * @desc Delete a notification
 * @access All authenticated users
 */
router.delete(
  '/:id',
  notificationController.deleteNotification
);

/**
 * @route GET /notifications/broadcasts
 * @desc Get all broadcast notifications (for admin management)
 * @access Admin
 */
router.get(
  '/broadcasts',
  requireRole('admin'),
  notificationController.getBroadcasts
);

/**
 * @route POST /notifications/appointment-confirmation
 * @desc Send appointment confirmation email
 * @access Admin, Doctor
 */
router.post(
  '/appointment-confirmation',
  requireRole('admin', 'doctor'),
  notificationController.sendAppointmentConfirmation
);

/**
 * @route POST /notifications/appointment-cancellation
 * @desc Send appointment cancellation email
 * @access Admin, Doctor
 */
router.post(
  '/appointment-cancellation',
  requireRole('admin', 'doctor'),
  notificationController.sendAppointmentCancellation
);

/**
 * @route POST /notifications/prescription
 * @desc Send prescription notification email
 * @access Admin, Doctor
 */
router.post(
  '/prescription',
  requireRole('admin', 'doctor'),
  notificationController.sendPrescriptionNotification
);

/**
 * @route POST /notifications/custom
 * @desc Send custom notification email AND save to database
 * @access Admin
 */
router.post(
  '/custom',
  requireRole('admin'),
  notificationController.sendCustomNotification
);

/**
 * @route POST /notifications/password-reset-link
 * @desc Send password reset link email (admin-generated)
 * @access Admin
 */
router.post(
  '/password-reset-link',
  requireRole('admin'),
  notificationController.sendPasswordResetLink
);

/**
 * @route POST /notifications/temporary-password
 * @desc Send temporary password email (admin-generated)
 * @access Admin
 */
router.post(
  '/temporary-password',
  requireRole('admin'),
  notificationController.sendTemporaryPassword
);

module.exports = router;
