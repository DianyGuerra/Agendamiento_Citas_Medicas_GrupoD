/**
 * Business Rules API Server
 * Handles all business logic operations for the medical appointment system
 * 
 * This API is dedicated to business rules, validations, and complex operations.
 * It follows REST 6 constraints and operates independently from the CRUD API.
 * 
 * Features:
 * - Appointment scheduling and availability checking
 * - Appointment conflict validation
 * - Schedule management and blocking
 * - Consultation workflow management
 * - Billing calculations
 * - Report generation
 * 
 * @module business-api/server
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
// Render injects PORT, fallback to BUSINESS_API_PORT for local dev
const PORT = process.env.PORT || process.env.BUSINESS_API_PORT || 3002;

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
    service: 'Business Rules API',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/api/v1', (req, res) => {
  res.json({
    name: 'Medical Appointment Business Rules API',
    version: '1.0.0',
    description: 'Business logic and validation API',
    endpoints: {
      availability: '/api/v1/availability',
      scheduling: '/api/v1/scheduling',
      consultations: '/api/v1/consultations',
      billingCalculations: '/api/v1/billing-calculations',
      reports: '/api/v1/reports',
      validations: '/api/v1/validations'
    }
  });
});

// =============================================================================
// API ROUTES
// =============================================================================

const API_PREFIX = '/api/v1';

// Import and register routes
const availabilityRoutes = require('./routes/availability.routes');
const schedulingRoutes = require('./routes/scheduling.routes');
const consultationRoutes = require('./routes/consultation.routes');
const billingCalculationRoutes = require('./routes/billingCalculation.routes');
const reportRoutes = require('./routes/report.routes');
const validationRoutes = require('./routes/validation.routes');

app.use(`${API_PREFIX}/availability`, availabilityRoutes);
app.use(`${API_PREFIX}/scheduling`, schedulingRoutes);
app.use(`${API_PREFIX}/consultations`, consultationRoutes);
app.use(`${API_PREFIX}/billing-calculations`, billingCalculationRoutes);
app.use(`${API_PREFIX}/reports`, reportRoutes);
app.use(`${API_PREFIX}/validations`, validationRoutes);

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
  console.log('⚙️  Business Rules API Server');
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
    console.log('✅ Business Rules API server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = app;
