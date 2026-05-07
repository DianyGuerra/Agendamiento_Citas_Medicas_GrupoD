/**
 * External Services API Server
 * Handles all external service integrations for the medical appointment system
 * 
 * This API is dedicated to external service operations:
 * - Email notifications
 * - SMS notifications (future)
 * - QR code generation
 * - Authentication (OAuth, password reset)
 * - Reminders and scheduling
 * - Third-party integrations
 * 
 * @module external-api/server
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const { corsOptions, preflightMiddleware } = require('../shared/config/cors.config');
const { errorHandler, notFoundHandler } = require('../shared/middleware/errorHandler.middleware');
const { requestLogger } = require('../shared/middleware/logger.middleware');

const app = express();
// Render injects PORT, fallback to EXTERNAL_API_PORT for local dev
const PORT = process.env.PORT || process.env.EXTERNAL_API_PORT || 3003;

// =============================================================================
// MIDDLEWARE SETUP
// =============================================================================

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS Preflight handling
app.use(preflightMiddleware);
app.use(cors(corsOptions));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Compression
app.use(compression());

// Request logging
app.use(requestLogger);

// =============================================================================
// HEALTH CHECK & INFO
// =============================================================================

app.get('/health', (req, res) => {
  res.json({
    service: 'External Services API',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/api/v1', (req, res) => {
  res.json({
    name: 'Medical Appointment External Services API',
    version: '1.0.0',
    description: 'External service integrations API',
    endpoints: {
      auth: '/api/v1/auth',
      notifications: '/api/v1/notifications',
      reminders: '/api/v1/reminders',
      qrCodes: '/api/v1/qr-codes'
    }
  });
});

// =============================================================================
// API ROUTES
// =============================================================================

const API_PREFIX = '/api/v1';

// Import and register routes
const authRoutes = require('./routes/auth.routes');
const notificationRoutes = require('./routes/notification.routes');
const reminderRoutes = require('./routes/reminder.routes');
const qrCodeRoutes = require('./routes/qrCode.routes');

app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/notifications`, notificationRoutes);
app.use(`${API_PREFIX}/reminders`, reminderRoutes);
app.use(`${API_PREFIX}/qr-codes`, qrCodeRoutes);

// =============================================================================
// ERROR HANDLING
// =============================================================================

app.use(notFoundHandler);
app.use(errorHandler);

// =============================================================================
// SERVER STARTUP
// =============================================================================

const server = app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('🌐 External Services API Server');
  console.log('='.repeat(60));
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 API info: http://localhost:${PORT}/api/v1`);
  console.log('='.repeat(60));
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`\n⚠️  ${signal} received. Shutting down gracefully...`);
  server.close((err) => {
    if (err) {
      console.error('❌ Error during shutdown:', err);
      process.exit(1);
    }
    console.log('✅ External Services API server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = app;
