/**
 * Error Messages
 * Centralized error messages for consistent error handling
 * 
 * @module shared/constants/error-messages.constants
 */

const ErrorMessages = Object.freeze({
  // Authentication
  NO_TOKEN: 'Token de autenticación no proporcionado',
  INVALID_TOKEN: 'Token inválido o expirado',
  USER_NOT_FOUND: 'Usuario no encontrado',
  USER_INACTIVE: 'Usuario inactivo',
  INVALID_CREDENTIALS: 'Credenciales inválidas',
  EMAIL_EXISTS: 'El email ya está registrado',
  CEDULA_EXISTS: 'La cédula ya está registrada',
  
  // Authorization
  FORBIDDEN: 'No tienes permisos para realizar esta acción',
  ROLE_REQUIRED: 'Rol no autorizado para esta operación',
  
  // Validation
  MISSING_REQUIRED_FIELDS: 'Faltan campos requeridos',
  INVALID_DATE_FORMAT: 'Formato de fecha inválido',
  INVALID_EMAIL_FORMAT: 'Formato de email inválido',
  INVALID_ID_FORMAT: 'Formato de ID inválido',
  PASSWORD_TOO_SHORT: 'La contraseña debe tener al menos 8 caracteres',
  
  // Resources
  APPOINTMENT_NOT_FOUND: 'Cita no encontrada',
  DOCTOR_NOT_FOUND: 'Doctor no encontrado',
  PATIENT_NOT_FOUND: 'Paciente no encontrado',
  SPECIALTY_NOT_FOUND: 'Especialidad no encontrada',
  SCHEDULE_NOT_FOUND: 'Horario no encontrado',
  BILLING_NOT_FOUND: 'Factura no encontrada',
  PRESCRIPTION_NOT_FOUND: 'Receta no encontrada',
  MEDICAL_RECORD_NOT_FOUND: 'Historial médico no encontrado',
  
  // Business Logic
  SLOT_NOT_AVAILABLE: 'El horario seleccionado ya no está disponible',
  APPOINTMENT_CONFLICT: 'Existe un conflicto con otra cita',
  CANNOT_CANCEL_PAST: 'No se puede cancelar una cita pasada',
  CANNOT_RESCHEDULE_PAST: 'No se puede reprogramar una cita pasada',
  BILLING_ALREADY_EXISTS: 'Ya existe una factura para esta cita',
  DOCTOR_NOT_AVAILABLE: 'El doctor no está disponible en este horario',
  
  // Server
  INTERNAL_ERROR: 'Error interno del servidor',
  DATABASE_ERROR: 'Error de base de datos',
  SERVICE_UNAVAILABLE: 'Servicio no disponible'
});

const SuccessMessages = Object.freeze({
  CREATED: 'Recurso creado exitosamente',
  UPDATED: 'Recurso actualizado exitosamente',
  DELETED: 'Recurso eliminado exitosamente',
  APPOINTMENT_CREATED: 'Cita creada exitosamente',
  APPOINTMENT_CANCELLED: 'Cita cancelada exitosamente',
  APPOINTMENT_RESCHEDULED: 'Cita reprogramada exitosamente',
  PASSWORD_CHANGED: 'Contraseña actualizada exitosamente',
  PROFILE_UPDATED: 'Perfil actualizado exitosamente',
  EMAIL_SENT: 'Email enviado exitosamente'
});

module.exports = { ErrorMessages, SuccessMessages };
