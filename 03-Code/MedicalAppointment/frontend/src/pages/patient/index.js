/**
 * Patient Pages - Barrel Export
 * 
 * This file provides a single entry point for all patient page components.
 * Pages are organized into modular folders following Clean Code principles.
 */

// Dashboard (refactored)
export { default as PatientDashboard } from './Dashboard';

// Appointments (refactored)
export { default as PatientAppointments } from './Appointments';

// New Appointment (refactored)
export { default as NewAppointment } from './NewAppointment';

// Notifications (refactored)
export { default as PatientNotifications } from './Notifications';

// Legacy pages (to be refactored - using re-exports for compatibility)
export { default as PatientBilling } from './Billing';
export { default as PatientHistory } from './History';
export { default as PatientLab } from './Lab';
export { default as PatientPrescriptions } from './Prescriptions';
export { default as PatientProfile } from './Profile';
export { default as RateAppointment } from './Rate';
export { default as MedicalRecord } from './Record';

// Re-export shared components and utilities
export * from './shared';
