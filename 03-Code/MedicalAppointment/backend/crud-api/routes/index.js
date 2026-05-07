/**
 * Routes Index
 * Exports all CRUD API routes
 * 
 * @module crud-api/routes/index
 */

const userRoutes = require('./user.routes');
const patientRoutes = require('./patient.routes');
const doctorRoutes = require('./doctor.routes');
const appointmentRoutes = require('./appointment.routes');
const specialtyRoutes = require('./specialty.routes');
const scheduleRoutes = require('./schedule.routes');
const medicalRecordRoutes = require('./medicalRecord.routes');
const consultationNoteRoutes = require('./consultationNote.routes');
const prescriptionRoutes = require('./prescription.routes');
const prescriptionRenewalRoutes = require('./prescriptionRenewal.routes');
const billingRoutes = require('./billing.routes');
const consultationRoomRoutes = require('./consultationRoom.routes');
const waitingListRoutes = require('./waitingList.routes');
const doctorRatingRoutes = require('./doctorRating.routes');
const medicalServiceRoutes = require('./medicalService.routes');
const billingItemRoutes = require('./billingItem.routes');
const insuranceProviderRoutes = require('./insuranceProvider.routes');
const securityRoutes = require('./security.routes');
const satisfactionSurveyRoutes = require('./satisfactionSurvey.routes');

/**
 * Register all routes
 * @param {Express.Application} app - Express application
 */
const registerRoutes = (app) => {
  const API_PREFIX = '/api/v1';

  // Core resources
  app.use(`${API_PREFIX}/users`, userRoutes);
  app.use(`${API_PREFIX}/patients`, patientRoutes);
  app.use(`${API_PREFIX}/doctors`, doctorRoutes);
  app.use(`${API_PREFIX}/appointments`, appointmentRoutes);
  app.use(`${API_PREFIX}/specialties`, specialtyRoutes);
  app.use(`${API_PREFIX}/schedules`, scheduleRoutes);
  
  // Medical records
  app.use(`${API_PREFIX}/medical-records`, medicalRecordRoutes);
  app.use(`${API_PREFIX}/consultation-notes`, consultationNoteRoutes);
  app.use(`${API_PREFIX}/prescriptions`, prescriptionRoutes);
  app.use(`${API_PREFIX}/prescription-renewals`, prescriptionRenewalRoutes);
  
  // Billing and facilities
  app.use(`${API_PREFIX}/billings`, billingRoutes);
  app.use(`${API_PREFIX}/consultation-rooms`, consultationRoomRoutes);
  app.use(`${API_PREFIX}/waiting-list`, waitingListRoutes);
  app.use(`${API_PREFIX}/doctor-ratings`, doctorRatingRoutes);
  app.use(`${API_PREFIX}/medical-services`, medicalServiceRoutes);
  app.use(`${API_PREFIX}/billing-items`, billingItemRoutes);
  app.use(`${API_PREFIX}/insurance-providers`, insuranceProviderRoutes);
  
  // Security & Access Management
  app.use(`${API_PREFIX}/security`, securityRoutes);
  
  // Surveys
  app.use(`${API_PREFIX}/satisfaction-surveys`, satisfactionSurveyRoutes);
};

module.exports = { registerRoutes };
