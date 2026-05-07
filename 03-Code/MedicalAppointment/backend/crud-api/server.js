/**
 * CRUD API Server
 * Handles all CRUD operations for the medical appointment system
 * Soft delete only - no hard deletes
 * 
 * @module crud-api/server
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const { corsOptions, preflightMiddleware } = require('../shared/config/cors.config');
const { errorHandler, notFoundHandler } = require('../shared/middleware/errorHandler.middleware');
const { requestLogger } = require('../shared/middleware/logger.middleware');
const { sanitizeBody } = require('../shared/middleware/validation.middleware');

// Import routes
const userRoutes = require('./routes/user.routes');
const patientRoutes = require('./routes/patient.routes');
const doctorRoutes = require('./routes/doctor.routes');
const appointmentRoutes = require('./routes/appointment.routes');
const specialtyRoutes = require('./routes/specialty.routes');
const scheduleRoutes = require('./routes/schedule.routes');
const medicalRecordRoutes = require('./routes/medicalRecord.routes');
const prescriptionRoutes = require('./routes/prescription.routes');
const prescriptionRenewalRoutes = require('./routes/prescriptionRenewal.routes');
const billingRoutes = require('./routes/billing.routes');
const consultationRoomRoutes = require('./routes/consultationRoom.routes');
const consultationNoteRoutes = require('./routes/consultationNote.routes');
const doctorRatingRoutes = require('./routes/doctorRating.routes');
const waitingListRoutes = require('./routes/waitingList.routes');
const medicalServiceRoutes = require('./routes/medicalService.routes');
const billingItemRoutes = require('./routes/billingItem.routes');
const insuranceProviderRoutes = require('./routes/insuranceProvider.routes');
const securityRoutes = require('./routes/security.routes');

const app = express();
// Render injects PORT, fallback to CRUD_API_PORT for local dev
const PORT = process.env.PORT || process.env.CRUD_API_PORT || 3001;

// =============================================================================
// MIDDLEWARE SETUP
// =============================================================================

// Security headers
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

// CORS Preflight handling (must be first)
app.use(preflightMiddleware);

// CORS
app.use(cors(corsOptions));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Compression
app.use(compression());

// Request logging
app.use(requestLogger);

// Body sanitization
app.use(sanitizeBody);

// =============================================================================
// API ROUTES
// =============================================================================

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    service: 'CRUD API',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API version prefix
const API_PREFIX = '/api/v1';

// Resource routes
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/patients`, patientRoutes);
app.use(`${API_PREFIX}/doctors`, doctorRoutes);
app.use(`${API_PREFIX}/appointments`, appointmentRoutes);
app.use(`${API_PREFIX}/specialties`, specialtyRoutes);
app.use(`${API_PREFIX}/schedules`, scheduleRoutes);
app.use(`${API_PREFIX}/medical-records`, medicalRecordRoutes);
app.use(`${API_PREFIX}/prescriptions`, prescriptionRoutes);
app.use(`${API_PREFIX}/prescription-renewals`, prescriptionRenewalRoutes);
app.use(`${API_PREFIX}/billings`, billingRoutes);
app.use(`${API_PREFIX}/consultation-rooms`, consultationRoomRoutes);
app.use(`${API_PREFIX}/consultation-notes`, consultationNoteRoutes);
app.use(`${API_PREFIX}/doctor-ratings`, doctorRatingRoutes);
app.use(`${API_PREFIX}/waiting-list`, waitingListRoutes);
app.use(`${API_PREFIX}/medical-services`, medicalServiceRoutes);
app.use(`${API_PREFIX}/billing-items`, billingItemRoutes);
app.use(`${API_PREFIX}/insurance-providers`, insuranceProviderRoutes);
app.use(`${API_PREFIX}/security`, securityRoutes);

// =============================================================================
// ERROR HANDLING
// =============================================================================

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// =============================================================================
// SERVER STARTUP
// =============================================================================

const startServer = () => {
  app.listen(PORT, () => {
    console.log('='.repeat(60));
    console.log('🚀 CRUD API Server');
    console.log('='.repeat(60));
    console.log(`📍 Port: ${PORT}`);
    console.log(`🌐 Base URL: http://localhost:${PORT}${API_PREFIX}`);
    console.log(`💚 Health: http://localhost:${PORT}/health`);
    console.log(`🕐 Started: ${new Date().toISOString()}`);
    console.log('='.repeat(60));
  });
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start server if run directly
if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
