/**
 * Audit Utility Functions
 * Centralized audit logging helper for CRUD operations
 * 
 * @module shared/utils/audit.utils
 */

const auditLogRepository = require('../../crud-api/repositories/auditLog.repository');

/**
 * Audit action types for different operations
 */
const AuditActions = {
  // Appointments
  APPOINTMENT_CREATED: 'APPOINTMENT_CREATED',
  APPOINTMENT_UPDATED: 'APPOINTMENT_UPDATED',
  APPOINTMENT_CANCELLED: 'APPOINTMENT_CANCELLED',
  APPOINTMENT_STATUS_CHANGED: 'APPOINTMENT_STATUS_CHANGED',
  APPOINTMENT_RESCHEDULED: 'APPOINTMENT_RESCHEDULED',
  
  // Medical Records
  MEDICAL_RECORD_CREATED: 'MEDICAL_RECORD_CREATED',
  MEDICAL_RECORD_UPDATED: 'MEDICAL_RECORD_UPDATED',
  MEDICAL_RECORD_VIEWED: 'MEDICAL_RECORD_VIEWED',
  
  // Prescriptions
  PRESCRIPTION_CREATED: 'PRESCRIPTION_CREATED',
  PRESCRIPTION_UPDATED: 'PRESCRIPTION_UPDATED',
  PRESCRIPTION_CANCELLED: 'PRESCRIPTION_CANCELLED',
  
  // Billing
  BILLING_CREATED: 'BILLING_CREATED',
  BILLING_UPDATED: 'BILLING_UPDATED',
  BILLING_STATUS_CHANGED: 'BILLING_STATUS_CHANGED',
  BILLING_CANCELLED: 'BILLING_CANCELLED',
  
  // Patients
  PATIENT_CREATED: 'PATIENT_CREATED',
  PATIENT_UPDATED: 'PATIENT_UPDATED',
  PATIENT_DELETED: 'PATIENT_DELETED',
  
  // Doctors
  DOCTOR_CREATED: 'DOCTOR_CREATED',
  DOCTOR_UPDATED: 'DOCTOR_UPDATED',
  DOCTOR_DELETED: 'DOCTOR_DELETED',
  DOCTOR_ACTIVATED: 'DOCTOR_ACTIVATED',
  DOCTOR_DEACTIVATED: 'DOCTOR_DEACTIVATED',
  
  // Schedules
  SCHEDULE_CREATED: 'SCHEDULE_CREATED',
  SCHEDULE_UPDATED: 'SCHEDULE_UPDATED',
  SCHEDULE_DELETED: 'SCHEDULE_DELETED',
  
  // Consultation Notes
  CONSULTATION_NOTE_CREATED: 'CONSULTATION_NOTE_CREATED',
  CONSULTATION_NOTE_UPDATED: 'CONSULTATION_NOTE_UPDATED',
  
  // Lab Reports
  LAB_REPORT_CREATED: 'LAB_REPORT_CREATED',
  LAB_REPORT_UPDATED: 'LAB_REPORT_UPDATED'
};

/**
 * Create an audit log entry
 * @param {Object} options - Audit log options
 * @param {string} options.userId - ID of user performing the action
 * @param {string} options.action - Action type (use AuditActions constants)
 * @param {string} options.tableName - Database table affected
 * @param {string} options.recordId - ID of the affected record
 * @param {Object} options.oldValues - Previous values (for updates)
 * @param {Object} options.newValues - New values
 * @param {string} options.description - Human-readable description
 * @param {Object} options.req - Express request object (for IP and user agent)
 * @returns {Promise<Object>} Created audit log entry
 */
async function createAuditLog({
  userId,
  action,
  tableName,
  recordId,
  oldValues = null,
  newValues = null,
  description,
  req
}) {
  try {
    const logData = {
      user_id: userId,
      action,
      table_name: tableName,
      record_id: recordId,
      old_values: oldValues,
      new_values: newValues,
      description,
      ip_address: req?.ip || req?.connection?.remoteAddress || 'unknown',
      user_agent: req?.get?.('User-Agent') || 'unknown'
    };

    const auditEntry = await auditLogRepository.createLog(logData);
    return auditEntry;
  } catch (error) {
    // Log error but don't throw - audit logging shouldn't break the main operation
    console.error('[Audit] Failed to create audit log:', error.message);
    return null;
  }
}

/**
 * Helper to create audit log for CRUD operations
 * @param {string} operation - 'create' | 'update' | 'delete'
 * @param {string} entityName - Name of the entity (e.g., 'Cita', 'Factura')
 * @param {Object} options - Additional options
 */
async function auditCrudOperation(operation, entityName, {
  userId,
  tableName,
  recordId,
  oldData = null,
  newData = null,
  req,
  customDescription = null
}) {
  const actionMap = {
    create: `${entityName.toUpperCase()}_CREATED`,
    update: `${entityName.toUpperCase()}_UPDATED`,
    delete: `${entityName.toUpperCase()}_DELETED`,
    cancel: `${entityName.toUpperCase()}_CANCELLED`
  };

  const descriptionMap = {
    create: `${entityName} creado/a`,
    update: `${entityName} actualizado/a`,
    delete: `${entityName} eliminado/a`,
    cancel: `${entityName} cancelado/a`
  };

  return createAuditLog({
    userId,
    action: actionMap[operation] || operation.toUpperCase(),
    tableName,
    recordId,
    oldValues: oldData,
    newValues: newData,
    description: customDescription || descriptionMap[operation] || `Operación ${operation} en ${entityName}`,
    req
  });
}

module.exports = {
  AuditActions,
  createAuditLog,
  auditCrudOperation
};
