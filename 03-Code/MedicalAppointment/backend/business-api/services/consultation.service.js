/**
 * Consultation Service
 * Business logic for managing medical consultations
 * Uses CORRECT database schema: scheduled_start, status_id, doctors.active
 * appointments table does NOT have is_deleted column - uses status_id for cancellation
 * 
 * @module business-api/services/ConsultationService
 */

const { supabase } = require('../../shared/config/database.config');
const { BusinessError, NotFoundError } = require('../../shared/errors');
const { AppointmentStatus } = require('../../shared/constants/app.constants');
const emailService = require('../../external-api/services/email.service');
const qrCodeService = require('../../external-api/services/qrCode.service');

class ConsultationService {
  /**
   * Start a consultation workflow
   * @param {string} appointmentId - Appointment UUID
   * @param {string} doctorUserId - Doctor's user UUID
   * @param {string} roomId - Consultation room ID (optional)
   * @returns {Promise<Object>} Consultation session data
   */
  async startConsultation(appointmentId, doctorUserId, roomId = null) {
    // Get appointment details with correct schema
    const { data: appointment, error: aptError } = await supabase
      .from('appointments')
      .select(`
        *,
        appointment_status(id, code, label),
        patient:patient_user_id(id, first_name, last_name, email),
        doctors!appointments_doctor_id_fkey(
          id,
          user_id,
          specialties(name)
        )
      `)
      .eq('id', appointmentId)
      .neq('status_id', AppointmentStatus.CANCELLED)
      .single();

    if (aptError || !appointment) {
      throw new NotFoundError('Cita', appointmentId);
    }

    // Verify doctor authorization
    if (appointment.doctors?.user_id !== doctorUserId) {
      throw new BusinessError('No tienes autorización para esta consulta');
    }

    // Validate appointment can be started (check status code)
    const currentStatus = appointment.appointment_status?.code;
    const validStatuses = ['scheduled', 'confirmed'];
    if (!validStatuses.includes(currentStatus)) {
      throw new BusinessError(`No se puede iniciar una cita con estado: ${currentStatus}`);
    }

    // If room specified, verify it's available
    if (roomId) {
      await this._verifyRoomAvailable(roomId);
      await this._assignRoom(roomId, appointmentId);
    }

    // Get the in_progress status ID
    const statusId = await this._getStatusId('in_progress');

    // Update appointment status
    const { error: updateError } = await supabase
      .from('appointments')
      .update({
        status_id: statusId,
        room_id: roomId,
        updated_at: new Date().toISOString()
      })
      .eq('id', appointmentId);

    if (updateError) throw updateError;

    // Get patient's medical record
    const medicalRecord = await this._getPatientMedicalRecord(appointment.patient_user_id);

    // Get patient's recent prescriptions
    const recentPrescriptions = await this._getRecentPrescriptions(appointment.patient_user_id);

    // Get patient's consultation history
    const consultationHistory = await this._getConsultationHistory(appointment.patient_user_id);

    return {
      appointment,
      medicalRecord,
      recentPrescriptions,
      consultationHistory,
      roomId,
      startedAt: new Date().toISOString()
    };
  }

  /**
   * Complete a consultation with notes
   * @param {string} appointmentId - Appointment UUID
   * @param {Object} consultationData - Notes, diagnosis, treatment plan
   * @param {string} doctorUserId - Doctor's user UUID
   * @returns {Promise<Object>} Completed consultation data
   */
  async completeConsultation(appointmentId, consultationData, doctorUserId) {
    // Handle both formats: { notes: {...} } and { subjective, objective, ... }
    const noteData = consultationData.notes || consultationData;
    const { subjective, objective, assessment, plan, follow_up_date, follow_up_time, follow_up_required } = noteData;
    
    console.log('[CompleteConsultation] Received data:', { 
      hasNotesWrapper: !!consultationData.notes,
      follow_up_required,
      follow_up_date, 
      follow_up_time 
    });

    // Get appointment and verify doctor
    const { data: appointment, error: aptError } = await supabase
      .from('appointments')
      .select(`
        *,
        appointment_status(code),
        doctors!appointments_doctor_id_fkey(id, user_id)
      `)
      .eq('id', appointmentId)
      .neq('status_id', AppointmentStatus.CANCELLED)
      .single();

    if (aptError || !appointment) {
      throw new NotFoundError('Cita', appointmentId);
    }

    // Debug logging for authorization issues
    console.log(`[Consultation] Completing appointment ${appointmentId}`);
    console.log(`[Consultation] Authenticated user_id: ${doctorUserId}`);
    console.log(`[Consultation] Appointment doctor user_id: ${appointment.doctors?.user_id}`);

    if (appointment.doctors?.user_id !== doctorUserId) {
      throw new BusinessError(`No tienes autorización para completar esta consulta. Esta cita pertenece a otro doctor.`);
    }

    const currentStatus = appointment.appointment_status?.code;
    // Allow completing from in_progress, scheduled, or confirmed states
    const completableStatuses = ['in_progress', 'scheduled', 'confirmed'];
    if (!completableStatuses.includes(currentStatus)) {
      throw new BusinessError(`La cita no puede ser completada. Estado actual: ${currentStatus}`);
    }

    // Check if consultation note already exists for this appointment
    const { data: existingNote } = await supabase
      .from('consultation_notes')
      .select('id')
      .eq('appointment_id', appointmentId)
      .single();

    let note;
    const notePayload = {
      appointment_id: appointmentId,
      doctor_id: appointment.doctors.id,
      subjective: subjective || '',
      objective: objective || '',
      assessment: assessment || '',
      plan: plan || '',
      notes: noteData.notes || assessment || 'Consulta completada',
      follow_up_required: follow_up_required || false,
      follow_up_date: follow_up_date || null,
      follow_up_time: follow_up_time || null,
      updated_at: new Date().toISOString()
    };

    if (existingNote) {
      // Update existing note
      const { data, error: noteError } = await supabase
        .from('consultation_notes')
        .update(notePayload)
        .eq('id', existingNote.id)
        .select()
        .single();
      
      if (noteError) throw noteError;
      note = data;
    } else {
      // Create new note
      notePayload.created_at = new Date().toISOString();
      const { data, error: noteError } = await supabase
        .from('consultation_notes')
        .insert(notePayload)
        .select()
        .single();
      
      if (noteError) throw noteError;
      note = data;
    }

    // Get completed status ID
    const statusId = await this._getStatusId('completed');

    // Update appointment status
    const { error: updateError } = await supabase
      .from('appointments')
      .update({
        status_id: statusId,
        updated_at: new Date().toISOString()
      })
      .eq('id', appointmentId);

    if (updateError) throw updateError;

    // Release consultation room if assigned
    if (appointment.room_id) {
      await this._releaseRoom(appointment.room_id);
    }

    // If follow-up required and date is set, create appointment and notify patient
    let followUpAppointment = null;
    if (follow_up_required && follow_up_date) {
      console.log(`[CompleteConsultation] Creating follow-up for ${follow_up_date} at ${follow_up_time}`);
      try {
        // Create follow-up appointment
        followUpAppointment = await this._createFollowUpAppointment(
          appointment,
          follow_up_date,
          follow_up_time,
          assessment || 'Seguimiento médico'
        );
        
        // Send notification to patient
        if (followUpAppointment) {
          await this._notifyPatientFollowUp(
            appointment,
            followUpAppointment,
            assessment
          );
        }
      } catch (followUpError) {
        console.error('[Consultation] Error creating follow-up:', followUpError);
        // Don't fail the complete consultation if follow-up fails
      }
    }

    return {
      consultation: note,
      appointment: { ...appointment, status: 'completed' },
      followUpAppointment
    };
  }

  /**
   * Get consultation summary for a patient
   * @param {string} patientUserId - Patient user UUID
   * @param {number} limit - Max number of consultations
   * @returns {Promise<Array>} Consultation summaries
   */
  async getPatientConsultationSummary(patientUserId, limit = 10) {
    const { data, error } = await supabase
      .from('consultation_notes')
      .select(`
        *,
        appointments!inner(
          id,
          scheduled_start,
          patient_user_id,
          doctors!appointments_doctor_id_fkey(
            users(first_name, last_name),
            specialties(name)
          )
        )
      `)
      .eq('appointments.patient_user_id', patientUserId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data || [];
  }

  /**
   * Add prescription during consultation
   * @param {string} appointmentId - Appointment UUID
   * @param {Object} prescriptionData - Prescription details
   * @param {string} doctorUserId - Doctor's user UUID
   * @returns {Promise<Object>} Created prescription
   */
  async addPrescription(appointmentId, prescriptionData, doctorUserId) {
    const { medication_name, dosage, frequency, duration_days, instructions, diagnosis } = prescriptionData;

    // Get appointment
    const { data: appointment, error: aptError } = await supabase
      .from('appointments')
      .select(`
        *,
        doctors!appointments_doctor_id_fkey(id, user_id)
      `)
      .eq('id', appointmentId)
      .neq('status_id', AppointmentStatus.CANCELLED)
      .single();

    if (aptError || !appointment) {
      throw new NotFoundError('Cita', appointmentId);
    }

    // Debug logging for authorization issues
    console.log(`[Prescription] Adding prescription for appointment ${appointmentId}`);
    console.log(`[Prescription] Authenticated user_id: ${doctorUserId}`);
    console.log(`[Prescription] Appointment doctor user_id: ${appointment.doctors?.user_id}`);

    if (appointment.doctors?.user_id !== doctorUserId) {
      throw new BusinessError(`No tienes autorización para esta consulta. Esta cita pertenece a otro doctor.`);
    }

    // Try to get diagnosis from consultation notes if not provided
    let finalDiagnosis = diagnosis;
    if (!finalDiagnosis) {
      const { data: notes } = await supabase
        .from('consultation_notes')
        .select('assessment, diagnosis')
        .eq('appointment_id', appointmentId)
        .single();
      
      finalDiagnosis = notes?.assessment || notes?.diagnosis || 'Pendiente de diagnóstico';
    }

    // Check if prescription already exists for this appointment
    const { data: existingPrescriptions } = await supabase
      .from('prescriptions')
      .select('id')
      .eq('appointment_id', appointmentId)
      .limit(1);

    // Process medications array
    const medications = prescriptionData.medications || [];
    const medicationsJson = JSON.stringify(medications);
    
    // Extract general instructions and duration from prescription data or first medication
    let generalInstructions = instructions || prescriptionData.notes || null;
    let generalDuration = duration_days ? `${duration_days} días` : null;
    
    // If no general instructions/duration, try to extract from first medication
    if (medications.length > 0 && !generalInstructions) {
      const firstMed = medications[0];
      if (firstMed.instructions) {
        generalInstructions = medications.map(m => m.instructions).filter(Boolean).join('; ');
      }
    }
    if (medications.length > 0 && !generalDuration) {
      const firstMed = medications[0];
      if (firstMed.duration) {
        // Get max duration from all medications
        generalDuration = medications.map(m => m.duration).filter(Boolean).join(', ');
      }
    }
    
    const prescriptionPayload = {
      appointment_id: appointmentId,
      patient_user_id: appointment.patient_user_id,
      doctor_id: appointment.doctors.id,
      diagnosis: finalDiagnosis,
      medications: medicationsJson,
      instructions: generalInstructions,
      duration: generalDuration,
      updated_at: new Date().toISOString()
    };

    let prescription;
    
    if (existingPrescriptions && existingPrescriptions.length > 0) {
      // Update existing prescription
      console.log(`[Prescription] Updating existing prescription ${existingPrescriptions[0].id}`);
      console.log(`[Prescription] Medications received:`, prescriptionData.medications);
      console.log(`[Prescription] Medications JSON to save:`, medicationsJson);
      const { data, error: updateError } = await supabase
        .from('prescriptions')
        .update(prescriptionPayload)
        .eq('id', existingPrescriptions[0].id)
        .select()
        .single();
      
      if (updateError) throw updateError;
      prescription = data;
    } else {
      // Create new prescription
      console.log(`[Prescription] Creating new prescription`);
      prescriptionPayload.created_at = new Date().toISOString();
      const { data, error: insertError } = await supabase
        .from('prescriptions')
        .insert(prescriptionPayload)
        .select()
        .single();
      
      if (insertError) throw insertError;
      prescription = data;
    }

    // Generate QR code for the prescription
    try {
      await qrCodeService.generatePrescriptionQR(prescription.id);
      console.log(`[Prescription] QR code generated for prescription ${prescription.id}`);
    } catch (qrError) {
      // Log error but don't fail prescription creation
      console.error(`[Prescription] Failed to generate QR for prescription ${prescription.id}:`, qrError.message);
    }

    // Send prescription notification email asynchronously
    this._sendPrescriptionEmail(appointment, prescription, medications, finalDiagnosis).catch(err => {
      console.error(`[Prescription] Failed to send email notification:`, err.message);
    });

    return prescription;
  }

  // ===== Private Methods =====

  async _getStatusId(statusCode) {
    const { data, error } = await supabase
      .from('appointment_status')
      .select('id')
      .eq('code', statusCode)
      .single();

    if (error || !data) {
      const fallbacks = {
        'scheduled': 1,
        'confirmed': 2,
        'in_progress': 3,
        'completed': 4,
        'cancelled': 5,
        'no_show': 6
      };
      return fallbacks[statusCode] || 1;
    }

    return data.id;
  }

  async _verifyRoomAvailable(roomId) {
    const { data, error } = await supabase
      .from('consultation_rooms')
      .select('is_available')
      .eq('id', roomId)
      .single();

    if (error) throw error;

    if (!data?.is_available) {
      throw new BusinessError('La sala de consulta no está disponible');
    }
  }

  async _assignRoom(roomId, appointmentId) {
    const { error } = await supabase
      .from('consultation_rooms')
      .update({
        is_available: false,
        current_appointment_id: appointmentId,
        updated_at: new Date().toISOString()
      })
      .eq('id', roomId);

    if (error) throw error;
  }

  async _releaseRoom(roomId) {
    const { error } = await supabase
      .from('consultation_rooms')
      .update({
        is_available: true,
        current_appointment_id: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', roomId);

    if (error) throw error;
  }

  async _getPatientMedicalRecord(patientUserId) {
    const { data, error } = await supabase
      .from('medical_records')
      .select('*')
      .eq('patient_user_id', patientUserId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async _getRecentPrescriptions(patientUserId, limit = 5) {
    const { data, error } = await supabase
      .from('prescriptions')
      .select('*')
      .eq('patient_user_id', patientUserId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  async _getConsultationHistory(patientUserId, limit = 10) {
    // Use scheduled_start and join appointment_status correctly
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        id,
        scheduled_start,
        reason,
        status_id,
        appointment_status(code, label),
        doctors!appointments_doctor_id_fkey(
          users(first_name, last_name),
          specialties(name)
        ),
        consultation_notes(assessment, plan)
      `)
      .eq('patient_user_id', patientUserId)
      .neq('status_id', AppointmentStatus.CANCELLED)
      .order('scheduled_start', { ascending: false })
      .limit(limit);

    if (error) throw error;
    
    // Filter for completed only
    return (data || []).filter(apt => apt.appointment_status?.code === 'completed');
  }

  async _suggestFollowUpSlots(doctorId, targetDate) {
    const availabilityService = require('./availability.service');
    return availabilityService.getAvailableSlots(doctorId, targetDate);
  }

  /**
   * Get prescriptions for an appointment
   * @param {string} appointmentId - Appointment UUID
   * @returns {Promise<Object>} Prescriptions data
   */
  async getPrescriptionsByAppointment(appointmentId) {
    // Get prescription directly by appointment_id
    const { data: prescriptions, error } = await supabase
      .from('prescriptions')
      .select('*')
      .eq('appointment_id', appointmentId)
      .order('updated_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching prescriptions:', error);
      return { medications: [] };
    }

    if (prescriptions && prescriptions.length > 0) {
      const rx = prescriptions[0];
      // Parse medications if stored as JSON string
      let medications;  // Correccion de error de ESLint: no-unused-vars, esta variable se usa en el return
      try {
        console.log('[Prescription GET] Raw medications from DB:', rx.medications);
        medications = typeof rx.medications === 'string' ? JSON.parse(rx.medications) : rx.medications;
        console.log('[Prescription GET] Parsed medications:', medications);
      } catch (e) {
        console.error('[Prescription GET] Parse error:', e);
        medications = rx.medications ? [{ name: rx.medications }] : [];
      }
      return {
        ...rx,
        medications
      };
    }

    return { medications: [] };
  }

  /**
   * Get all appointments history for a patient (for doctor view)
   * Includes all statuses: scheduled, completed, cancelled, no_show
   * @param {string} patientUserId - Patient user UUID
   * @param {string} doctorId - Doctor UUID (optional, to filter by specific doctor)
   * @returns {Promise<Array>} All appointments with their status and notes
   */
  async getPatientAppointmentsHistory(patientUserId, doctorId = null) {
    let query = supabase
      .from('appointments')
      .select(`
        id,
        scheduled_start,
        scheduled_end,
        reason,
        status_id,
        created_at,
        appointment_status(id, code, label),
        doctors!appointments_doctor_id_fkey(
          id,
          users(first_name, last_name),
          specialties(name)
        ),
        consultation_notes(
          id,
          subjective,
          objective,
          assessment,
          plan,
          created_at
        )
      `)
      .eq('patient_user_id', patientUserId)
      .order('scheduled_start', { ascending: false });

    // If doctor specified, filter by that doctor
    if (doctorId) {
      query = query.eq('doctor_id', doctorId);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Transform data for frontend
    return (data || []).map(apt => ({
      id: apt.id,
      appointment_id: apt.id,
      scheduled_start: apt.scheduled_start,
      scheduled_end: apt.scheduled_end,
      reason: apt.reason,
      status: apt.appointment_status?.code || 'unknown',
      status_label: apt.appointment_status?.label || 'Desconocido',
      created_at: apt.created_at,
      doctor: apt.doctors ? {
        name: `${apt.doctors.users?.first_name || ''} ${apt.doctors.users?.last_name || ''}`.trim(),
        specialty: apt.doctors.specialties?.name
      } : null,
      // Include consultation notes if they exist
      notes: apt.consultation_notes?.[0] || null,
      assessment: apt.consultation_notes?.[0]?.assessment || null,
      plan: apt.consultation_notes?.[0]?.plan || null
    }));
  }

  /**
   * Create a follow-up appointment for the patient
   * @param {Object} originalAppointment - The completed appointment
   * @param {string} followUpDate - Date for follow-up (YYYY-MM-DD)
   * @param {string} followUpTime - Time for follow-up (HH:MM)
   * @param {string} reason - Reason for follow-up
   * @returns {Promise<Object>} Created appointment
   */
  async _createFollowUpAppointment(originalAppointment, followUpDate, followUpTime, reason) {
    // Use the time selected by the doctor, or default to 09:00
    let startTime = followUpTime || '09:00';
    
    // Ensure time is in HH:MM:SS format
    if (startTime.length === 5) {
      startTime = `${startTime}:00`;
    }

    // Create scheduled_start and scheduled_end
    // Store as ISO string with explicit timezone to avoid conversion issues
    // The frontend selected time is in local timezone, so we store it directly
    const scheduledStartStr = `${followUpDate}T${startTime}`;
    
    // Calculate end time (30 minutes later)
    const [hours, minutes] = startTime.split(':').map(Number);
    let endHours = hours;
    let endMinutes = minutes + 30;
    if (endMinutes >= 60) {
      endMinutes -= 60;
      endHours += 1;
    }
    const scheduledEndStr = `${followUpDate}T${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}:00`;

    console.log(`[FollowUp] Creating appointment for ${followUpDate} at ${startTime}`);
    console.log(`[FollowUp] Scheduled start: ${scheduledStartStr}, end: ${scheduledEndStr}`);

    // Get scheduled status ID
    const statusId = await this._getStatusId('scheduled');

    // Create the follow-up appointment
    const { data: followUp, error } = await supabase
      .from('appointments')
      .insert({
        patient_user_id: originalAppointment.patient_user_id,
        doctor_id: originalAppointment.doctor_id,
        scheduled_start: scheduledStartStr,
        scheduled_end: scheduledEndStr,
        status_id: statusId,
        reason: `Seguimiento: ${reason}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by_user_id: originalAppointment.doctors?.user_id
      })
      .select()
      .single();

    if (error) {
      console.error('[FollowUp] Error creating appointment:', error);
      throw error;
    }

    console.log(`[FollowUp] Created follow-up appointment ${followUp.id} for ${followUpDate}`);
    return followUp;
  }

  /**
   * Send email notification to patient about follow-up appointment
   * @param {Object} originalAppointment - The completed appointment
   * @param {Object} followUpAppointment - The created follow-up appointment
   * @param {string} diagnosis - Diagnosis from the consultation
   */
  async _notifyPatientFollowUp(originalAppointment, followUpAppointment, diagnosis) {
    // Get patient details
    const { data: patient } = await supabase
      .from('users')
      .select('email, first_name, last_name')
      .eq('id', originalAppointment.patient_user_id)
      .single();

    if (!patient?.email) {
      console.log('[FollowUp] No patient email found, skipping notification');
      return;
    }

    // Get doctor details
    const { data: doctor } = await supabase
      .from('doctors')
      .select(`
        users(first_name, last_name),
        specialties(name)
      `)
      .eq('id', originalAppointment.doctor_id)
      .single();

    const doctorName = doctor?.users 
      ? `${doctor.users.first_name} ${doctor.users.last_name}` 
      : 'Doctor';
    const specialty = doctor?.specialties?.name || 'Medicina General';

    // Format date and time
    const followUpDate = new Date(followUpAppointment.scheduled_start);
    const dateStr = followUpDate.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const timeStr = followUpDate.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });

    // Send email
    try {
      await emailService.sendFollowUpNotification({
        patientEmail: patient.email,
        patientName: `${patient.first_name} ${patient.last_name}`,
        doctorName,
        specialty,
        followUpDate: dateStr,
        followUpTime: timeStr,
        diagnosis,
        appointmentId: followUpAppointment.id
      });
      console.log(`[FollowUp] Email notification sent to ${patient.email}`);
    } catch (emailError) {
      console.error('[FollowUp] Error sending email:', emailError);
      // Don't throw - email failure shouldn't fail the operation
    }
  }

  /**
   * Send prescription notification email to patient
   * @param {Object} appointment - Appointment data
   * @param {Object} prescription - Created prescription
   * @param {Array} medications - List of medications
   * @param {string} diagnosis - Diagnosis text
   * @private
   */
  async _sendPrescriptionEmail(appointment, prescription, medications, diagnosis) {
    try {
      // Get patient details
      const { data: patient } = await supabase
        .from('users')
        .select('email, first_name, last_name')
        .eq('id', appointment.patient_user_id)
        .single();

      if (!patient?.email) {
        console.log('[Prescription] No patient email found, skipping notification');
        return;
      }

      // Get doctor details
      const { data: doctor } = await supabase
        .from('doctors')
        .select(`
          users(first_name, last_name),
          specialties(name)
        `)
        .eq('id', appointment.doctors?.id || appointment.doctor_id)
        .single();

      const doctorName = doctor?.users 
        ? `${doctor.users.first_name} ${doctor.users.last_name}` 
        : 'Doctor';
      const specialty = doctor?.specialties?.name || 'Medicina General';

      await emailService.sendPrescriptionNotification({
        patientEmail: patient.email,
        patientName: `${patient.first_name} ${patient.last_name}`,
        doctorName,
        specialty,
        diagnosis,
        medications: medications || [],
        duration: prescription.duration
      });

      console.log(`[Prescription] Email notification sent to ${patient.email}`);
    } catch (emailError) {
      console.error('[Prescription] Error sending email:', emailError.message);
      // Don't throw - email failure shouldn't fail the operation
    }
  }

  /**
   * Create missing follow-up appointment from saved consultation notes
   * Used when the original completion didn't create the follow-up
   * @param {string} appointmentId - Original appointment ID
   * @param {string} doctorUserId - Doctor's user UUID
   * @returns {Promise<Object>} Created follow-up appointment
   */
  async createMissingFollowUp(appointmentId, doctorUserId) {
    // Get the original appointment
    const { data: appointment, error: aptError } = await supabase
      .from('appointments')
      .select(`
        *,
        doctors!appointments_doctor_id_fkey(id, user_id)
      `)
      .eq('id', appointmentId)
      .single();

    if (aptError || !appointment) {
      throw new NotFoundError('Cita', appointmentId);
    }

    // Verify doctor authorization
    if (appointment.doctors?.user_id !== doctorUserId) {
      throw new BusinessError('No tienes autorización para esta cita');
    }

    // Get the consultation note
    const { data: note, error: noteError } = await supabase
      .from('consultation_notes')
      .select('*')
      .eq('appointment_id', appointmentId)
      .single();

    if (noteError || !note) {
      throw new NotFoundError('Nota de consulta');
    }

    // Check if follow-up is required
    if (!note.follow_up_required || !note.follow_up_date) {
      throw new BusinessError('Esta consulta no tiene seguimiento configurado');
    }

    // Check if follow-up appointment already exists
    const { data: existingFollowUp } = await supabase
      .from('appointments')
      .select('id')
      .eq('patient_user_id', appointment.patient_user_id)
      .eq('doctor_id', appointment.doctor_id)
      .gte('scheduled_start', `${note.follow_up_date}T00:00:00`)
      .lte('scheduled_start', `${note.follow_up_date}T23:59:59`)
      .neq('status_id', AppointmentStatus.CANCELLED)
      .single();

    if (existingFollowUp) {
      throw new BusinessError('Ya existe una cita de seguimiento para esta fecha');
    }

    // Create the follow-up appointment
    const followUpTime = note.follow_up_time ? note.follow_up_time.substring(0, 5) : '09:00';
    const followUpAppointment = await this._createFollowUpAppointment(
      appointment,
      note.follow_up_date,
      followUpTime,
      note.assessment || 'Seguimiento médico'
    );

    // Send notification
    if (followUpAppointment) {
      await this._notifyPatientFollowUp(
        appointment,
        followUpAppointment,
        note.assessment
      );
    }

    return {
      followUpAppointment,
      message: `Cita de seguimiento creada para ${note.follow_up_date} a las ${followUpTime}`
    };
  }
}

module.exports = new ConsultationService();
