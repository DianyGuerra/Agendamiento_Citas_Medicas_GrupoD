/**
 * Application Constants
 * Centralized constants for the entire application
 * 
 * @module shared/constants/app.constants
 */

// These IDs MUST match the appointment_status table in database
const AppointmentStatus = Object.freeze({
  SCHEDULED: 1,    // id=1, code='scheduled', label='Programada'
  COMPLETED: 2,    // id=2, code='completed', label='Completada'
  CANCELLED: 3,    // id=3, code='cancelled', label='Cancelada'
  NO_SHOW: 4,      // id=4, code='no_show', label='No asistió'
  CONFIRMED: 5     // id=5, code='confirmed', label='Confirmado'
});

const AppointmentStatusCode = Object.freeze({
  SCHEDULED: 'scheduled',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show',
  CONFIRMED: 'confirmed'
});

const UserRole = Object.freeze({
  ADMIN: 'admin',
  DOCTOR: 'doctor',
  PATIENT: 'patient'
});

const BillingStatus = Object.freeze({
  PENDING: 'pending',
  PAID: 'paid',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded'
});

const ReminderType = Object.freeze({
  APPOINTMENT: 'appointment_reminder',
  FOLLOW_UP: 'follow_up',
  PRESCRIPTION: 'prescription_reminder'
});

const ReminderStatus = Object.freeze({
  PENDING: 'pending',
  SENT: 'sent',
  FAILED: 'failed'
});

const DaysOfWeek = Object.freeze({
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6
});

const DEFAULT_APPOINTMENT_DURATION_MINUTES = 30;
const DEFAULT_REMINDER_HOURS_BEFORE = 24;
const DEFAULT_PAGINATION_LIMIT = 20;
const MAX_PAGINATION_LIMIT = 100;

module.exports = {
  AppointmentStatus,
  AppointmentStatusCode,
  UserRole,
  BillingStatus,
  ReminderType,
  ReminderStatus,
  DaysOfWeek,
  DEFAULT_APPOINTMENT_DURATION_MINUTES,
  DEFAULT_REMINDER_HOURS_BEFORE,
  DEFAULT_PAGINATION_LIMIT,
  MAX_PAGINATION_LIMIT
};
