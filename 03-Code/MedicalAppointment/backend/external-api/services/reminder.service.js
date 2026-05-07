/**
 * Reminder Service
 * Handles scheduling and sending appointment reminders
 * 
 * @module external-api/services/ReminderService
 */

const { supabase } = require('../../shared/config/database.config');
const emailService = require('./email.service');
const { AppointmentStatus } = require('../../shared/constants/app.constants');

class ReminderService {
  /**
   * Get appointments that need reminders
   * @param {number} hoursAhead - Hours before appointment
   * @returns {Promise<Array>} Appointments needing reminders
   */
  async getAppointmentsForReminder(hoursAhead = 24) {
    const now = new Date();
    const targetTime = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);
    
    // Get date and approximate time window
    const startWindow = new Date(targetTime.getTime() - 30 * 60 * 1000); // 30 min before
    const endWindow = new Date(targetTime.getTime() + 30 * 60 * 1000); // 30 min after

    const { data, error } = await supabase
      .from('appointments')
      .select(`
        id,
        scheduled_start,
        scheduled_end,
        patient_user_id,
        status_id,
        consultation_room_id,
        appointment_status(code),
        patient:patient_user_id(id, email, first_name, last_name),
        doctors!appointments_doctor_id_fkey(
          id,
          users(first_name, last_name),
          specialties(name)
        ),
        consultation_rooms!appointments_consultation_room_id_fkey(name, room_number)
      `)
      .gte('scheduled_start', startWindow.toISOString())
      .lt('scheduled_start', endWindow.toISOString())
      .in('status_id', [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED]);

    if (error) throw error;

    return data || [];
  }

  /**
   * Send reminder for an appointment
   * @param {Object} appointment - Appointment data
   * @param {number} hoursUntil - Hours until appointment
   */
  async sendReminder(appointment, hoursUntil) {
    const appointmentDate = new Date(appointment.scheduled_start);
    const patient = appointment.patient;
    const doctor = appointment.doctors;
    const room = appointment.consultation_rooms;
    
    if (!patient?.email) {
      console.log('[Reminder] No patient email found, skipping');
      return { success: false, reason: 'no_email' };
    }
    
    const patientEmail = patient.email;
    const patientName = `${patient.first_name || ''} ${patient.last_name || ''}`.trim();
    const doctorName = `${doctor?.users?.first_name || ''} ${doctor?.users?.last_name || ''}`.trim() || 'Doctor';
    const specialty = doctor?.specialties?.name || 'Medicina General';
    const roomInfo = room ? `${room.name || ''} ${room.room_number || ''}`.trim() : null;
    
    const dateStr = appointmentDate.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const timeStr = appointmentDate.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    await emailService.sendAppointmentReminder({
      patientEmail,
      patientName,
      doctorName,
      specialty,
      date: dateStr,
      time: timeStr,
      room: roomInfo,
      hoursUntil
    });

    // Log reminder sent - using correct column names from schema
    // reminders table has: appointment_id, reminder_type, scheduled_send_time, sent_at, send_status, message_content, recipient_email, recipient_phone, retry_count, created_at
    await supabase.from('reminders').insert({
      appointment_id: appointment.id,
      reminder_type: 'email',
      scheduled_send_time: appointmentDate.toISOString(),
      sent_at: new Date().toISOString(),
      send_status: 'sent',
      message_content: `Recordatorio de cita en ${hoursUntil} horas`,
      recipient_email: patientEmail,
      retry_count: 0,
      created_at: new Date().toISOString()
    });

    return { success: true, appointmentId: appointment.id };
  }

  /**
   * Process all due reminders
   * @param {Array} reminderHours - Array of hours before to send reminders
   */
  async processReminders(reminderHours = [24, 2]) {
    const results = {
      processed: 0,
      sent: 0,
      errors: []
    };

    for (const hours of reminderHours) {
      try {
        const appointments = await this.getAppointmentsForReminder(hours);
        results.processed += appointments.length;

        for (const appointment of appointments) {
          try {
            // Check if reminder was already sent
            const alreadySent = await this._checkReminderSent(appointment.id, hours);
            
            if (!alreadySent) {
              await this.sendReminder(appointment, hours);
              results.sent++;
            }
          } catch (err) {
            results.errors.push({
              appointmentId: appointment.id,
              error: err.message
            });
          }
        }
      } catch (err) {
        results.errors.push({
          hours,
          error: err.message
        });
      }
    }

    return results;
  }

  /**
   * Create a scheduled reminder
   * @param {Object} reminderData - Reminder configuration
   */
  async createReminder(reminderData) {
    const { appointment_id, reminder_type, scheduled_send_time, recipient_email, recipient_phone, message_content } = reminderData;

    const { data, error } = await supabase
      .from('reminders')
      .insert({
        appointment_id,
        reminder_type: reminder_type || 'email',
        scheduled_send_time,
        send_status: 'pending',
        recipient_email,
        recipient_phone,
        message_content,
        retry_count: 0,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  }

  /**
   * Get reminder history for an appointment
   * @param {string} appointmentId - Appointment UUID
   */
  async getReminderHistory(appointmentId) {
    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('appointment_id', appointmentId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data || [];
  }

  /**
   * Cancel pending reminders for an appointment
   * @param {string} appointmentId - Appointment UUID
   */
  async cancelReminders(appointmentId) {
    const { data, error } = await supabase
      .from('reminders')
      .update({ send_status: 'cancelled' })
      .eq('appointment_id', appointmentId)
      .eq('send_status', 'pending')
      .select();

    if (error) throw error;

    return { cancelled: data?.length || 0 };
  }

  /**
   * Get pending reminders count
   */
  async getPendingCount() {
    const { count, error } = await supabase
      .from('reminders')
      .select('*', { count: 'exact', head: true })
      .eq('send_status', 'pending');

    if (error) throw error;

    return count || 0;
  }

  // ===== Private Methods =====

  /**
   * Check if a reminder was already sent for an appointment within a time window
   * Since we don't have hours_before column, we check by scheduled_send_time proximity
   */
  async _checkReminderSent(appointmentId, hoursBefore) {
    // Calculate the target time window
    const now = new Date();
    const targetTime = new Date(now.getTime() + hoursBefore * 60 * 60 * 1000);
    const windowStart = new Date(targetTime.getTime() - 2 * 60 * 60 * 1000); // 2 hours before
    const windowEnd = new Date(targetTime.getTime() + 2 * 60 * 60 * 1000); // 2 hours after

    const { data, error } = await supabase
      .from('reminders')
      .select('id')
      .eq('appointment_id', appointmentId)
      .eq('send_status', 'sent')
      .gte('scheduled_send_time', windowStart.toISOString())
      .lte('scheduled_send_time', windowEnd.toISOString())
      .limit(1);

    return data && data.length > 0;
  }
}

module.exports = new ReminderService();
