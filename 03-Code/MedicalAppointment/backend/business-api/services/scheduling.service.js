/**
 * Scheduling Service
 * Business logic for appointment scheduling operations
 * 
 * @module business-api/services/SchedulingService
 */

const { supabase } = require('../../shared/config/database.config');
const { BusinessError, NotFoundError, ValidationError } = require('../../shared/errors');
const availabilityService = require('./availability.service');
const { AppointmentStatus } = require('../../shared/constants/app.constants');
const emailService = require('../../external-api/services/email.service');

class SchedulingService {
  /**
   * Schedule a new appointment
   * @param {Object} appointmentData - Appointment data
   * @returns {Promise<Object>} Created appointment
   */
  async scheduleAppointment(appointmentData) {
    const { patient_user_id, doctor_id, scheduled_start, reason } = appointmentData;

    // Validate required fields
    this._validateRequired(appointmentData);

    // Check doctor exists and is active
    const doctor = await this._verifyDoctor(doctor_id);
    if (!doctor) {
      throw new NotFoundError('Doctor', doctor_id);
    }

    // Parse the scheduled_start to get date and time
    const startDate = new Date(scheduled_start);
    const dateStr = startDate.toISOString().split('T')[0];
    const timeStr = startDate.toTimeString().substring(0, 5);

    // Check slot is available
    const isAvailable = await availabilityService.isSlotAvailable(doctor_id, dateStr, timeStr);
    if (!isAvailable) {
      throw new BusinessError('El horario seleccionado no está disponible');
    }

    // Check for patient conflicts
    await this._checkPatientConflict(patient_user_id, scheduled_start);

    // Calculate end time (default 30 min)
    const endDate = new Date(startDate.getTime() + 30 * 60 * 1000);

    // Get the scheduled status ID
    const statusId = await this._getStatusId('scheduled');

    // Create appointment
    const { data: appointment, error } = await supabase
      .from('appointments')
      .insert({
        patient_user_id,
        doctor_id,
        scheduled_start: startDate.toISOString(),
        scheduled_end: endDate.toISOString(),
        status_id: statusId,
        reason,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select(`
        *,
        appointment_status(code, label),
        patient:patient_user_id(first_name, last_name, email),
        doctors!appointments_doctor_id_fkey(
          users(first_name, last_name),
          specialties(name)
        ),
        consultation_rooms!appointments_consultation_room_id_fkey(name, room_number)
      `)
      .single();

    if (error) {
      console.error('Error creating appointment:', error);
      throw new BusinessError('Error al crear la cita');
    }

    // Send confirmation email asynchronously (don't block the response)
    this._sendConfirmationEmail(appointment).catch(err => {
      console.error('Error sending confirmation email:', err.message);
    });

    return appointment;
  }

  /**
   * Reschedule an appointment
   * @param {string} appointmentId - Appointment UUID
   * @param {Object} newSchedule - New schedule data
   * @param {string} userId - User making the change
   * @returns {Promise<Object>} Updated appointment
   */
  async rescheduleAppointment(appointmentId, newSchedule, userId) {
    const { scheduled_start } = newSchedule;

    // Get existing appointment
    const { data: existing, error: fetchError } = await supabase
      .from('appointments')
      .select(`
        *,
        appointment_status(code),
        doctors!appointments_doctor_id_fkey(user_id)
      `)
      .eq('id', appointmentId)
      .single();

    if (fetchError || !existing) {
      throw new NotFoundError('Cita', appointmentId);
    }

    // Verify appointment can be rescheduled
    const allowedStatuses = ['scheduled', 'confirmed'];
    if (!allowedStatuses.includes(existing.appointment_status?.code)) {
      throw new BusinessError('No se puede reprogramar una cita con este estado');
    }

    // Parse new time
    const startDate = new Date(scheduled_start);
    const dateStr = startDate.toISOString().split('T')[0];
    const timeStr = startDate.toTimeString().substring(0, 5);

    // Check new slot is available
    const isAvailable = await availabilityService.isSlotAvailable(existing.doctor_id, dateStr, timeStr);
    if (!isAvailable) {
      throw new BusinessError('El nuevo horario no está disponible');
    }

    // Calculate new end time
    const endDate = new Date(startDate.getTime() + 30 * 60 * 1000);

    // Keep as 'scheduled' status when rescheduling (patient needs to re-confirm)
    // Note: 'rescheduled' status may not exist in all databases
    const statusId = await this._getStatusId('scheduled');

    // Update appointment
    const { data: updated, error } = await supabase
      .from('appointments')
      .update({
        scheduled_start: startDate.toISOString(),
        scheduled_end: endDate.toISOString(),
        status_id: statusId,
        updated_at: new Date().toISOString()
      })
      .eq('id', appointmentId)
      .select(`
        *,
        appointment_status(code, label),
        patient:patient_user_id(id, email, first_name, last_name),
        doctors!appointments_doctor_id_fkey(
          users(first_name, last_name),
          specialties(name)
        ),
        consultation_rooms!appointments_consultation_room_id_fkey(name, room_number)
      `)
      .single();

    if (error) throw error;

    // Send reschedule email asynchronously
    this._sendRescheduleEmail(updated, existing.scheduled_start, scheduled_start).catch(err => {
      console.error('Error sending reschedule email:', err.message);
    });

    return {
      appointment: updated,
      previousStart: existing.scheduled_start,
      newStart: scheduled_start
    };
  }

  /**
   * Cancel an appointment
   * @param {string} appointmentId - Appointment UUID
   * @param {string} reason - Cancellation reason
   * @param {string} userId - User cancelling
   * @returns {Promise<Object>} Cancelled appointment
   */
  async cancelAppointment(appointmentId, reason, userId) {
    const { data: appointment, error: fetchError } = await supabase
      .from('appointments')
      .select(`
        *,
        appointment_status(code),
        patient:patient_user_id(id, email, first_name, last_name),
        doctors!appointments_doctor_id_fkey(
          user_id,
          users(email, first_name, last_name),
          specialties(name)
        )
      `)
      .eq('id', appointmentId)
      .single();

    if (fetchError || !appointment) {
      throw new NotFoundError('Cita', appointmentId);
    }

    // Check if can be cancelled
    const nonCancellable = ['completed', 'cancelled', 'no_show'];
    if (nonCancellable.includes(appointment.appointment_status?.code)) {
      throw new BusinessError('Esta cita no puede ser cancelada');
    }

    // Get cancelled status ID
    const statusId = await this._getStatusId('cancelled');

    // Update status
    // Note: appointments table does NOT have 'notes' column
    const { data: cancelled, error } = await supabase
      .from('appointments')
      .update({
        status_id: statusId,
        updated_at: new Date().toISOString()
      })
      .eq('id', appointmentId)
      .select(`
        *,
        appointment_status(code, label)
      `)
      .single();

    if (error) throw error;

    // Send cancellation email asynchronously
    this._sendCancellationEmail(appointment, reason).catch(err => {
      console.error('Error sending cancellation email:', err.message);
    });

    return {
      appointment: cancelled,
      cancelledAt: new Date().toISOString(),
      cancelledBy: userId
    };
  }

  /**
   * Confirm an appointment
   * @param {string} appointmentId - Appointment UUID
   * @returns {Promise<Object>} Confirmed appointment
   */
  async confirmAppointment(appointmentId) {
    const statusId = await this._getStatusId('confirmed');

    const { data, error } = await supabase
      .from('appointments')
      .update({
        status_id: statusId,
        confirmed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', appointmentId)
      .select(`
        *,
        appointment_status(code, label)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Check-in patient for appointment
   * @param {string} appointmentId - Appointment UUID
   * @returns {Promise<Object>} Updated appointment
   */
  async checkInPatient(appointmentId) {
    const { data, error } = await supabase
      .from('appointments')
      .update({
        checked_in_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', appointmentId)
      .select(`
        *,
        appointment_status(code, label)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get appointments by date range
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} List of appointments
   */
  async getAppointmentsByDateRange(filters = {}) {
    const { startDate, endDate, doctorId, patientId, status } = filters;

    let query = supabase
      .from('appointments')
      .select(`
        *,
        appointment_status(code, label),
        patient:patient_user_id(first_name, last_name, email),
        doctors!appointments_doctor_id_fkey(
          users(first_name, last_name),
          specialties(name)
        ),
        consultation_rooms!appointments_consultation_room_id_fkey(name, room_number)
      `);

    if (startDate) query = query.gte('scheduled_start', startDate);
    if (endDate) query = query.lte('scheduled_start', endDate);
    if (doctorId) query = query.eq('doctor_id', doctorId);
    if (patientId) query = query.eq('patient_user_id', patientId);
    if (status) {
      // Need to filter by status code after fetch
    }

    query = query.order('scheduled_start', { ascending: true });

    const { data, error } = await query;

    if (error) throw error;

    // Filter by status if provided
    if (status && data) {
      return data.filter(apt => apt.appointment_status?.code === status);
    }

    return data || [];
  }

  // ===== Private Methods =====

  _validateRequired(data) {
    const required = ['patient_user_id', 'doctor_id', 'scheduled_start'];
    const missing = required.filter(field => !data[field]);
    
    if (missing.length > 0) {
      throw new ValidationError(`Campos requeridos faltantes: ${missing.join(', ')}`);
    }
  }

  async _verifyDoctor(doctorId) {
    const { data, error } = await supabase
      .from('doctors')
      .select('id, active, users(is_active)')
      .eq('id', doctorId)
      .single();

    if (error || !data) return null;
    if (!data.active || !data.users?.is_active) return null;
    
    return data;
  }

  async _checkPatientConflict(patientId, scheduledStart) {
    const startDate = new Date(scheduledStart);
    const dateStr = startDate.toISOString().split('T')[0];
    const startOfDay = `${dateStr}T00:00:00`;
    const endOfDay = `${dateStr}T23:59:59`;

    const { data } = await supabase
      .from('appointments')
      .select(`
        id,
        scheduled_start,
        appointment_status!inner(code)
      `)
      .eq('patient_user_id', patientId)
      .gte('scheduled_start', startOfDay)
      .lte('scheduled_start', endOfDay)
      .in('appointment_status.code', ['scheduled', 'confirmed']);

    // Check for time overlap (within 30 minutes)
    const conflicting = (data || []).some(apt => {
      const existingStart = new Date(apt.scheduled_start);
      const timeDiff = Math.abs(startDate - existingStart) / (1000 * 60);
      return timeDiff < 30;
    });

    if (conflicting) {
      throw new BusinessError('Ya tienes una cita programada cerca de ese horario');
    }
  }

  async _getStatusId(statusCode) {
    const { data, error } = await supabase
      .from('appointment_status')
      .select('id')
      .eq('code', statusCode)
      .single();

    if (error || !data) {
      // Fallback to common status IDs (matching actual DB values)
      const fallbacks = {
        'scheduled': 1,
        'confirmed': 2,
        'in_progress': 3,
        'completed': 4,
        'cancelled': 5,
        'no_show': 6
        // Note: 'rescheduled' status does NOT exist in database
      };
      return fallbacks[statusCode] || 1;
    }

    return data.id;
  }

  /**
   * Send appointment confirmation email
   * @param {Object} appointment - Appointment with relations
   * @private
   */
  async _sendConfirmationEmail(appointment) {
    try {
      const patient = appointment.patient;
      const doctor = appointment.doctors;
      const room = appointment.consultation_rooms;
      
      if (!patient?.email) {
        console.log('⚠️ No patient email found for appointment confirmation');
        return;
      }

      const startDate = new Date(appointment.scheduled_start);
      const dateStr = startDate.toLocaleDateString('es-ES', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      const timeStr = startDate.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });

      await emailService.sendAppointmentConfirmation({
        patientEmail: patient.email,
        patientName: `${patient.first_name} ${patient.last_name}`,
        doctorName: `${doctor?.users?.first_name || ''} ${doctor?.users?.last_name || ''}`.trim() || 'Doctor',
        specialty: doctor?.specialties?.name || 'Medicina General',
        date: dateStr,
        time: timeStr,
        room: room ? `${room.name || ''} ${room.room_number || ''}`.trim() : null,
        reason: appointment.reason
      });

      console.log(`✅ Confirmation email sent for appointment ${appointment.id}`);
    } catch (error) {
      console.error('Error sending confirmation email:', error.message);
      // Don't throw - email failure shouldn't fail the appointment creation
    }
  }

  /**
   * Send appointment cancellation email
   * @param {Object} appointment - Appointment with relations
   * @param {string} reason - Cancellation reason
   * @private
   */
  async _sendCancellationEmail(appointment, reason) {
    try {
      const patient = appointment.patient;
      const doctor = appointment.doctors;
      
      if (!patient?.email) {
        console.log('⚠️ No patient email found for cancellation notification');
        return;
      }

      const startDate = new Date(appointment.scheduled_start);
      const dateStr = startDate.toLocaleDateString('es-ES', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      const timeStr = startDate.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });

      await emailService.sendAppointmentCancellation({
        patientEmail: patient.email,
        patientName: `${patient.first_name} ${patient.last_name}`,
        doctorName: `${doctor?.users?.first_name || ''} ${doctor?.users?.last_name || ''}`.trim() || 'Doctor',
        specialty: doctor?.specialties?.name || 'Medicina General',
        date: dateStr,
        time: timeStr,
        reason
      });

      console.log(`✅ Cancellation email sent for appointment ${appointment.id}`);
    } catch (error) {
      console.error('Error sending cancellation email:', error.message);
    }
  }

  /**
   * Send appointment reschedule email
   * @param {Object} appointment - Updated appointment with relations
   * @param {string} oldScheduledStart - Previous scheduled start time
   * @param {string} newScheduledStart - New scheduled start time
   * @private
   */
  async _sendRescheduleEmail(appointment, oldScheduledStart, newScheduledStart) {
    try {
      const patient = appointment.patient;
      const doctor = appointment.doctors;
      const room = appointment.consultation_rooms;
      
      if (!patient?.email) {
        console.log('⚠️ No patient email found for reschedule notification');
        return;
      }

      const oldDate = new Date(oldScheduledStart);
      const newDate = new Date(newScheduledStart);
      
      const formatDate = (date) => date.toLocaleDateString('es-ES', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      const formatTime = (date) => date.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });

      await emailService.sendAppointmentRescheduled({
        patientEmail: patient.email,
        patientName: `${patient.first_name} ${patient.last_name}`,
        doctorName: `${doctor?.users?.first_name || ''} ${doctor?.users?.last_name || ''}`.trim() || 'Doctor',
        specialty: doctor?.specialties?.name || 'Medicina General',
        oldDate: formatDate(oldDate),
        oldTime: formatTime(oldDate),
        newDate: formatDate(newDate),
        newTime: formatTime(newDate),
        room: room ? `${room.name || ''} ${room.room_number || ''}`.trim() : null
      });

      console.log(`✅ Reschedule email sent for appointment ${appointment.id}`);
    } catch (error) {
      console.error('Error sending reschedule email:', error.message);
    }
  }

  /**
   * Mark past appointments as no_show automatically
   * This updates appointments that are scheduled/confirmed but their time has passed
   * @returns {Promise<number>} Number of appointments updated
   */
  async markPastAppointmentsAsNoShow() {
    const now = new Date().toISOString();
    const noShowStatusId = await this._getStatusId('no_show');
    const scheduledStatusId = await this._getStatusId('scheduled');
    const confirmedStatusId = await this._getStatusId('confirmed');

    const { data, error } = await supabase
      .from('appointments')
      .update({
        status_id: noShowStatusId,
        updated_at: new Date().toISOString()
      })
      .in('status_id', [scheduledStatusId, confirmedStatusId])
      .lt('scheduled_end', now)
      .select('id');

    if (error) {
      console.error('Error marking past appointments as no_show:', error);
      return 0;
    }

    return data?.length || 0;
  }
}

module.exports = new SchedulingService();
