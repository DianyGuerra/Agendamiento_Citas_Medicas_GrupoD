/**
 * External API Routes Index
 * Combines all external API routes
 * 
 * @module external-api/routes/index
 */

const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth.routes');
const notificationRoutes = require('./notification.routes');
const reminderRoutes = require('./reminder.routes');
const qrCodeRoutes = require('./qrCode.routes');

// Register routes
router.use('/auth', authRoutes);
router.use('/notifications', notificationRoutes);
router.use('/reminders', reminderRoutes);
router.use('/qr-codes', qrCodeRoutes);

module.exports = router;
