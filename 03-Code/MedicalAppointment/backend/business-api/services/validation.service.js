/**
 * Validation Service
 * Business rules validation for the medical appointment system
 * Uses CORRECT database schema: scheduled_start, status_id, doctors.active
 * appointments table does NOT have is_deleted column - uses status_id for cancellation
 * 
 * @module business-api/services/ValidationService
 */

const { supabase } = require('../../shared/config/database.config');
const { ValidationError, BusinessError } = require('../../shared/errors');
const { timeToMinutes } = require('../../shared/utils/helpers.utils');
const { AppointmentStatus } = require('../../shared/constants/app.constants');

class ValidationService {
  /**
   * Validate appointment booking rules
   * @param {Object} appointmentData - Appointment data to validate
   * @returns {Promise<Object>} Validation result
   */
  async validateAppointmentBooking(appointmentData) {
    const errors = [];
    const warnings = [];
    
    const { patient_user_id, doctor_id, scheduled_start } = appointmentData;

    // Parse scheduled_start timestamp
    const appointmentDateTime = new Date(scheduled_start);
    const now = new Date();
    
    // 1. Validate date is not in the past
    if (appointmentDateTime < now) {
      errors.push({
        field: 'scheduled_start',
        message: 'No se puede agendar una cita en el pasado'
      });
    }

    // 2. Validate not too far in the future (e.g., max 6 months)
    const maxFutureDate = new Date();
    maxFutureDate.setMonth(maxFutureDate.getMonth() + 6);
    
    if (appointmentDateTime > maxFutureDate) {
      errors.push({
        field: 'scheduled_start',
        message: 'No se puede agendar una cita con más de 6 meses de anticipación'
      });
    }

    // 3. Validate time is within business hours
    const appointmentHour = appointmentDateTime.getHours();
    const appointmentMinutes = appointmentHour * 60 + appointmentDateTime.getMinutes();
    const businessStart = 8 * 60; // 08:00
    const businessEnd = 20 * 60;  // 20:00
    
    if (appointmentMinutes < businessStart || appointmentMinutes > businessEnd) {
      errors.push({
        field: 'scheduled_start',
        message: 'La cita debe estar dentro del horario de atención (8:00 - 20:00)'
      });
    }

    // 4. Check patient has active account
    const patientCheck = await this._checkPatientStatus(patient_user_id);
    if (!patientCheck.isActive) {
      errors.push({
        field: 'patient_user_id',
        message: 'La cuenta del paciente no está activa'
      });
    }

    // 5. Check doctor is available
    const doctorCheck = await this._checkDoctorStatus(doctor_id);
    if (!doctorCheck.isActive) {
      errors.push({
        field: 'doctor_id',
        message: 'El doctor no está disponible'
      });
    }

    // 6. Check for existing appointments
    const conflictCheck = await this._checkAppointmentConflicts(
      patient_user_id, doctor_id, scheduled_start
    );
    
    if (conflictCheck.patientConflict) {
      errors.push({
        field: 'scheduled_start',
        message: 'Ya tienes una cita programada en ese horario'
      });
    }
    
    if (conflictCheck.doctorConflict) {
      errors.push({
        field: 'scheduled_start',
        message: 'El doctor ya tiene una cita en ese horario'
      });
    }

    // 7. Warning for weekend appointments
    const dayOfWeek = appointmentDateTime.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      warnings.push({
        field: 'scheduled_start',
        message: 'Estás agendando una cita para fin de semana. Verifica la disponibilidad.'
      });
    }

    // 8. Warning for appointments less than 24h away
    const hoursUntil = (appointmentDateTime - now) / (1000 * 60 * 60);
    if (hoursUntil < 24 && hoursUntil > 0) {
      warnings.push({
        field: 'scheduled_start',
        message: 'La cita es en menos de 24 horas. Las cancelaciones podrían no ser reembolsables.'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      validatedAt: new Date().toISOString()
    };
  }

  /**
   * Validate patient profile completeness
   * @param {string} patientUserId - Patient user UUID
   * @returns {Promise<Object>} Validation result
   */
  async validatePatientProfile(patientUserId) {
    const { data: user, error: userError } = await supabase
      .from('users')
      .select(`
        *,
        patients(*)
      `)
      .eq('id', patientUserId)
      .single();

    if (userError || !user) {
      throw new ValidationError('Usuario no encontrado');
    }

    const missingFields = [];
    const completeness = { total: 10, filled: 0 };

    // Required user fields
    const userFields = ['first_name', 'last_name', 'email', 'phone'];
    userFields.forEach(field => {
      if (user[field]) {
        completeness.filled++;
      } else {
        missingFields.push({ field, category: 'user', required: true });
      }
    });

    // Patient-specific fields
    const patient = user.patients;
    if (patient) {
      const patientFields = ['date_of_birth', 'gender', 'address', 'emergency_contact_name', 'blood_type', 'insurance_provider_id'];
      
      patientFields.forEach(field => {
        if (patient[field]) {
          completeness.filled++;
        } else {
          missingFields.push({
            field,
            category: 'patient',
            required: ['date_of_birth', 'gender'].includes(field)
          });
        }
      });
    } else {
      missingFields.push({ field: 'patient_record', category: 'patient', required: true });
    }

    const percentage = Math.round((completeness.filled / completeness.total) * 100);

    return {
      isComplete: missingFields.filter(f => f.required).length === 0,
      completenessPercentage: percentage,
      missingFields,
      recommendations: this._getProfileRecommendations(missingFields)
    };
  }

  /**
   * Validate schedule configuration
   * @param {Object} scheduleData - Schedule to validate
   * @returns {Object} Validation result
   */
  validateScheduleConfiguration(scheduleData) {
    const errors = [];
    const { day_of_week, start_time, end_time } = scheduleData;

    // Validate day of week (0-6 numeric in database)
    if (typeof day_of_week === 'number') {
      if (day_of_week < 0 || day_of_week > 6) {
        errors.push({
          field: 'day_of_week',
          message: 'Día de la semana inválido (debe ser 0-6)'
        });
      }
    } else if (typeof day_of_week === 'string') {
      const validDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      if (!validDays.includes(day_of_week.toLowerCase())) {
        errors.push({
          field: 'day_of_week',
          message: 'Día de la semana inválido'
        });
      }
    }

    // Validate times
    const startMinutes = timeToMinutes(start_time);
    const endMinutes = timeToMinutes(end_time);

    if (isNaN(startMinutes) || isNaN(endMinutes)) {
      errors.push({
        field: 'time',
        message: 'Formato de hora inválido. Use HH:MM'
      });
    } else if (startMinutes >= endMinutes) {
      errors.push({
        field: 'end_time',
        message: 'La hora de fin debe ser posterior a la hora de inicio'
      });
    }

    // Validate minimum duration (at least 1 hour)
    if (endMinutes - startMinutes < 60) {
      errors.push({
        field: 'duration',
        message: 'El horario debe tener al menos 1 hora de duración'
      });
    }

    // Validate reasonable hours
    if (startMinutes < timeToMinutes('06:00') || endMinutes > timeToMinutes('22:00')) {
      errors.push({
        field: 'time',
        message: 'El horario debe estar entre 06:00 y 22:00'
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate medical record data
   * @param {Object} recordData - Medical record data
   * @returns {Object} Validation result
   */
  validateMedicalRecord(recordData) {
    const errors = [];
    const warnings = [];

    // Validate blood type if provided
    if (recordData.blood_type) {
      const validBloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
      if (!validBloodTypes.includes(recordData.blood_type)) {
        errors.push({
          field: 'blood_type',
          message: 'Tipo de sangre inválido'
        });
      }
    }

    // Validate allergies format (should be array or comma-separated)
    if (recordData.allergies && typeof recordData.allergies === 'string') {
      if (recordData.allergies.length > 1000) {
        errors.push({
          field: 'allergies',
          message: 'La lista de alergias es demasiado larga'
        });
      }
    }

    // Warning for empty critical fields
    const criticalFields = ['allergies', 'chronic_conditions', 'current_medications'];
    criticalFields.forEach(field => {
      if (!recordData[field]) {
        warnings.push({
          field,
          message: `Se recomienda completar ${field} para mejor atención médica`
        });
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate prescription data
   * @param {Object} prescriptionData - Prescription data
   * @returns {Object} Validation result
   */
  validatePrescription(prescriptionData) {
    const errors = [];
    const { medications, duration_days, patient_user_id, doctor_id } = prescriptionData;

    // Validate medications array
    if (!medications || !Array.isArray(medications) || medications.length === 0) {
      errors.push({
        field: 'medications',
        message: 'Debe incluir al menos un medicamento'
      });
    } else {
      medications.forEach((med, index) => {
        if (!med.name) {
          errors.push({
            field: `medications[${index}].name`,
            message: 'El nombre del medicamento es requerido'
          });
        }
        if (!med.dosage) {
          errors.push({
            field: `medications[${index}].dosage`,
            message: 'La dosis es requerida'
          });
        }
      });
    }

    // Validate duration
    if (duration_days && (isNaN(duration_days) || duration_days < 1 || duration_days > 365)) {
      errors.push({
        field: 'duration_days',
        message: 'La duración debe ser entre 1 y 365 días'
      });
    }

    // Validate patient and doctor exist
    if (!patient_user_id) {
      errors.push({
        field: 'patient_user_id',
        message: 'Paciente es requerido'
      });
    }

    if (!doctor_id) {
      errors.push({
        field: 'doctor_id',
        message: 'Doctor es requerido'
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // ===== Private Methods =====

  async _checkPatientStatus(patientUserId) {
    const { data, error } = await supabase
      .from('users')
      .select('is_active')
      .eq('id', patientUserId)
      .single();

    return { isActive: data?.is_active || false };
  }

  async _checkDoctorStatus(doctorId) {
    // doctors table uses 'active' column (NOT is_active)
    const { data, error } = await supabase
      .from('doctors')
      .select('active, users(is_active)')
      .eq('id', doctorId)
      .single();

    return { 
      isActive: data?.active && data?.users?.is_active || false 
    };
  }

  async _checkAppointmentConflicts(patientId, doctorId, scheduledStart) {
    const startDate = new Date(scheduledStart);
    const dateStr = startDate.toISOString().split('T')[0];
    
    // Create time range for the same 30-minute slot
    const slotStart = new Date(startDate);
    const slotEnd = new Date(startDate.getTime() + 30 * 60 * 1000);

    // Check patient conflicts using scheduled_start and status_id != CANCELLED
    const { data: patientApts } = await supabase
      .from('appointments')
      .select(`
        id,
        scheduled_start,
        status_id,
        appointment_status!inner(code)
      `)
      .eq('patient_user_id', patientId)
      .gte('scheduled_start', `${dateStr}T00:00:00`)
      .lte('scheduled_start', `${dateStr}T23:59:59`)
      .neq('status_id', AppointmentStatus.CANCELLED)
      .in('appointment_status.code', ['scheduled', 'confirmed']);

    // Check doctor conflicts
    const { data: doctorApts } = await supabase
      .from('appointments')
      .select(`
        id,
        scheduled_start,
        status_id,
        appointment_status!inner(code)
      `)
      .eq('doctor_id', doctorId)
      .gte('scheduled_start', `${dateStr}T00:00:00`)
      .lte('scheduled_start', `${dateStr}T23:59:59`)
      .neq('status_id', AppointmentStatus.CANCELLED)
      .in('appointment_status.code', ['scheduled', 'confirmed']);

    // Check for time overlap (within 30 minutes)
    const checkOverlap = (appointments) => {
      return (appointments || []).some(apt => {
        const existingStart = new Date(apt.scheduled_start);
        const timeDiff = Math.abs(startDate - existingStart) / (1000 * 60);
        return timeDiff < 30;
      });
    };

    return {
      patientConflict: checkOverlap(patientApts),
      doctorConflict: checkOverlap(doctorApts)
    };
  }

  _getProfileRecommendations(missingFields) {
    const recommendations = [];

    if (missingFields.some(f => f.field === 'emergency_contact_name')) {
      recommendations.push('Agrega un contacto de emergencia para casos urgentes');
    }

    if (missingFields.some(f => f.field === 'insurance_provider_id')) {
      recommendations.push('Agrega tu información de seguro para agilizar la facturación');
    }

    if (missingFields.some(f => f.field === 'blood_type')) {
      recommendations.push('Conocer tu tipo de sangre puede ser vital en emergencias');
    }

    return recommendations;
  }
}

module.exports = new ValidationService();
