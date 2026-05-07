/**
 * Business API Routes Index
 * Combines all business API routes
 * 
 * @module business-api/routes/index
 */

const express = require('express');
const router = express.Router();

// Import route modules
const availabilityRoutes = require('./availability.routes');
const schedulingRoutes = require('./scheduling.routes');
const consultationRoutes = require('./consultation.routes');
const billingCalculationRoutes = require('./billingCalculation.routes');
const reportRoutes = require('./report.routes');
const validationRoutes = require('./validation.routes');

// Register routes
router.use('/availability', availabilityRoutes);
router.use('/scheduling', schedulingRoutes);
router.use('/consultations', consultationRoutes);
router.use('/billing-calculations', billingCalculationRoutes);
router.use('/reports', reportRoutes);
router.use('/validations', validationRoutes);

module.exports = router;
