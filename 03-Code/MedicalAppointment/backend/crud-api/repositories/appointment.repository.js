/**
 * Appointment Repository
 * Data access layer for Appointment entity
 * 
 * @module crud-api/repositories/AppointmentRepository
 */

const BaseRepository = require('../../shared/repositories/BaseRepository');
const { AppointmentStatus } = require('../../shared/constants/app.constants');

class AppointmentRepository extends BaseRepository {
  constructor() {
    super('appointments');
  }

  /**
   * Default select fields for appointments
   */
  get defaultSelect() {
    return `
      id,
      patient_user_id,
      doctor_id,
      room_id,
      consultation_room_id,
      scheduled_start,
      scheduled_end,
      status_id,
      reason,
      created_at,
      updated_at,
      created_by_user_id,
      confirmed_at,
      started_at,
      completed_at,
      checked_in_at,
      appointment_status (
        id,
        code,
        label
      ),
      consultation_rooms!appointments_consultation_room_id_fkey (
        id,
        name,
        room_number
      )
    `;
  }

  /**
   * Find appointment with full details
   * @param {string} id - Appointment ID
   * @param {boolean} includeCancelled - Whether to include cancelled appointments (default: false)
   * @returns {Promise<Object|null>}
   */
  async findWithDetails(id, includeCancelled = false) {
    let query = this.db
      .from(this.tableName)
      .select(`
        id,
        patient_user_id,
        doctor_id,
        room_id,
        consultation_room_id,
        scheduled_start,
        scheduled_end,
        status_id,
        reason,
        created_at,
        updated_at,
        confirmed_at,
        started_at,
        completed_at,
        checked_in_at,
        patient:patient_user_id (
          id,
          first_name,
          last_name,
          email,
          phone_number,
          cedula
        ),
        doctors!appointments_doctor_id_fkey (
          id,
          professional_id,
          users (
            first_name,
            last_name,
            email
          ),
          specialties (
            id,
            name
          )
        ),
        appointment_status (
          id,
          code,
          label
        ),
        consultation_rooms!appointments_consultation_room_id_fkey (
          id,
          name,
          room_number
        )
      `)
      .eq('id', id);

    // Only filter out cancelled if not explicitly including them
    if (!includeCancelled) {
      query = query.neq('status_id', AppointmentStatus.CANCELLED);
    }

    const { data, error } = await query.single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Database error: ${error.message}`);
    }

    // If we have data, fetch patient details from patients table
    if (data && data.patient_user_id) {
      const { data: patientDetails } = await this.db
        .from('patients')
        .select('date_of_birth, gender, blood_type, allergies, medical_conditions')
        .eq('user_id', data.patient_user_id)
        .single();
      
      if (patientDetails) {
        data.patientDetails = patientDetails;
      }
    }

    return data;
  }

  /**
   * Find appointments by patient
   * @param {string} patientUserId - Patient user ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>}
   */
  async findByPatient(patientUserId, options = {}) {
    const { status, upcoming, limit, offset } = options;

    let query = this.db
      .from(this.tableName)
      .select(`
        id,
        doctor_id,
        scheduled_start,
        scheduled_end,
        reason,
        status_id,
        created_at,
        confirmed_at,
        started_at,
        completed_at,
        checked_in_at,
        appointment_status (
          id,
          code,
          label
        ),
        doctors!appointments_doctor_id_fkey (
          id,
          users (
            first_name,
            last_name
          ),
          specialties (
            name
          )
        ),
        consultation_rooms!appointments_consultation_room_id_fkey (
          name,
          room_number
        )
      `)
      .eq('patient_user_id', patientUserId);

    // Note: Show all appointments including cancelled - frontend filters by tab

    if (status) {
      query = query.eq('appointment_status.code', status);
    }

    if (upcoming) {
      query = query.gte('scheduled_start', new Date().toISOString());
    }

    query = query.order('scheduled_start', { ascending: !upcoming });

    if (limit) query = query.limit(limit);
    if (offset) query = query.range(offset, offset + (limit || 20) - 1);

    const { data, error } = await query;

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Find appointments by doctor
   * @param {string} doctorId - Doctor ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>}
   */
  async findByDoctor(doctorId, options = {}) {
    const { status, date, startDate, endDate, limit, offset } = options;

    let query = this.db
      .from(this.tableName)
      .select(`
        id,
        patient_user_id,
        scheduled_start,
        scheduled_end,
        reason,
        status_id,
        created_at,
        confirmed_at,
        started_at,
        completed_at,
        checked_in_at,
        appointment_status (
          id,
          code,
          label
        ),
        patient:patient_user_id (
          id,
          first_name,
          last_name,
          email,
          phone_number
        ),
        consultation_rooms!appointments_consultation_room_id_fkey (
          name,
          room_number
        )
      `)
      .eq('doctor_id', doctorId)
      .neq('status_id', AppointmentStatus.CANCELLED);

    if (status) {
      query = query.eq('status_id', status);
    }

    if (date) {
      const startOfDay = `${date}T00:00:00Z`;
      const endOfDay = `${date}T23:59:59Z`;
      query = query.gte('scheduled_start', startOfDay).lte('scheduled_start', endOfDay);
    }

    if (startDate) {
      query = query.gte('scheduled_start', `${startDate}T00:00:00Z`);
    }

    if (endDate) {
      query = query.lte('scheduled_start', `${endDate}T23:59:59Z`);
    }

    query = query.order('scheduled_start', { ascending: true });

    if (limit) query = query.limit(limit);
    if (offset) query = query.range(offset, offset + (limit || 20) - 1);

    const { data, error } = await query;

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Find conflicting appointments
   * @param {string} doctorId - Doctor ID
   * @param {string} start - Start datetime
   * @param {string} end - End datetime
   * @param {string} [excludeId] - Appointment ID to exclude
   * @returns {Promise<Array>}
   */
  async findConflicts(doctorId, start, end, excludeId = null) {
    let query = this.db
      .from(this.tableName)
      .select('id')
      .eq('doctor_id', doctorId)
      .in('status_id', [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED])
      .or(`and(scheduled_start.lte.${start},scheduled_end.gt.${start}),and(scheduled_start.lt.${end},scheduled_end.gte.${end}),and(scheduled_start.gte.${start},scheduled_end.lte.${end})`);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Update appointment status
   * @param {string} id - Appointment ID
   * @param {number} statusId - New status ID
   * @returns {Promise<Object>}
   */
  async updateStatus(id, statusId) {
    const updateData = { status_id: statusId };
    
    // Set timestamp fields based on status
    const now = new Date().toISOString();
    if (statusId === AppointmentStatus.CONFIRMED) {
      updateData.confirmed_at = now;
    } else if (statusId === AppointmentStatus.COMPLETED) {
      updateData.completed_at = now;
    }
    
    return this.update(id, updateData);
  }

  /**
   * Cancel appointment (soft delete via status change)
   * @param {string} id - Appointment ID
   * @returns {Promise<boolean>}
   */
  async softDelete(id) {
    const { error } = await this.db
      .from(this.tableName)
      .update({
        status_id: AppointmentStatus.CANCELLED,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return true;
  }

  /**
   * Count appointments by status for a doctor
   * @param {string} doctorId - Doctor ID
   * @returns {Promise<Object>}
   */
  async countByStatusForDoctor(doctorId) {
    const { data, error } = await this.db
      .from(this.tableName)
      .select('status_id, appointment_status(code)')
      .eq('doctor_id', doctorId)
      .neq('status_id', AppointmentStatus.CANCELLED);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    const counts = {
      scheduled: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
      no_show: 0
    };

    (data || []).forEach(apt => {
      const code = apt.appointment_status?.code;
      if (code && counts.hasOwnProperty(code)) {
        counts[code]++;
      }
    });

    return counts;
  }

  /**
   * Find unique patients for a doctor (from appointments)
   * Includes patients with completed appointments AND scheduled/confirmed appointments
   * @param {string} doctorId - Doctor UUID
   * @returns {Promise<Array>} Unique patients with their info
   */
  async findUniquePatientsByDoctor(doctorId) {
    // Get all patients with any relevant appointment status (not cancelled)
    const { data, error } = await this.db
      .from('appointments')
      .select(`
        patient_user_id,
        status_id,
        scheduled_start,
        appointment_status(code),
        users!appointments_patient_user_id_fkey (
          id,
          first_name,
          last_name,
          email,
          phone_number,
          cedula
        )
      `)
      .eq('doctor_id', doctorId)
      .neq('status_id', AppointmentStatus.CANCELLED);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    // Get unique patients and track their last appointment
    const patientsMap = new Map();
    (data || []).forEach(apt => {
      if (apt.users && apt.users.id) {
        const existingPatient = patientsMap.get(apt.users.id);
        const currentDate = apt.scheduled_start ? new Date(apt.scheduled_start) : null;
        
        if (!existingPatient) {
          patientsMap.set(apt.users.id, {
            ...apt.users,
            last_appointment: apt.scheduled_start,
            has_completed_appointment: apt.appointment_status?.code === 'completed'
          });
        } else {
          // Update last appointment if this one is more recent
          const existingDate = existingPatient.last_appointment ? new Date(existingPatient.last_appointment) : null;
          if (currentDate && (!existingDate || currentDate > existingDate)) {
            existingPatient.last_appointment = apt.scheduled_start;
          }
          // Track if they have any completed appointment
          if (apt.appointment_status?.code === 'completed') {
            existingPatient.has_completed_appointment = true;
          }
        }
      }
    });

    return Array.from(patientsMap.values());
  }

  /**
   * Find all appointments with full relations (for admin)
   * @param {Object} [options={}] - Query options
   * @returns {Promise<Array>}
   */
  async findAll(options = {}) {
    const { filters = {}, limit, offset } = options;

    let query = this.db
      .from(this.tableName)
      .select(`
        id,
        patient_user_id,
        doctor_id,
        scheduled_start,
        scheduled_end,
        status_id,
        reason,
        created_at,
        completed_at,
        checked_in_at,
        consultation_room_id,
        appointment_status (
          id,
          code,
          label
        ),
        patient:patient_user_id (
          id,
          first_name,
          last_name,
          email
        ),
        doctors!appointments_doctor_id_fkey (
          id,
          users (
            first_name,
            last_name
          ),
          specialties (
            id,
            name
          )
        ),
        consultation_rooms!appointments_consultation_room_id_fkey (
          id,
          name,
          room_number
        ),
        consultation_notes (
          id,
          diagnosis,
          follow_up_required
        )
      `);

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value);
      }
    });

    query = query.order('scheduled_start', { ascending: false });

    if (limit) query = query.limit(limit);
    if (offset) query = query.range(offset, offset + (limit || 20) - 1);

    const { data, error } = await query;

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    // Transform the data with flattened fields for frontend
    return (data || []).map(apt => ({
      ...apt,
      // Flattened patient fields
      patient_name: apt.patient 
        ? `${apt.patient.first_name || ''} ${apt.patient.last_name || ''}`.trim() || 'N/A'
        : 'N/A',
      patient_email: apt.patient?.email || null,
      // Flattened doctor fields  
      doctor_name: apt.doctors?.users
        ? `${apt.doctors.users.first_name || ''} ${apt.doctors.users.last_name || ''}`.trim() || 'N/A'
        : 'N/A',
      // Specialty
      specialty_name: apt.doctors?.specialties?.name || 'N/A',
      specialty_id: apt.doctors?.specialties?.id || null,
      // Status fields
      status_code: apt.appointment_status?.code || 'unknown',
      status_label: apt.appointment_status?.label || 'Desconocido',
      // Room fields
      room_name: apt.consultation_rooms?.name || null,
      room_number: apt.consultation_rooms?.room_number || null,
      // Legacy fields for compatibility
      appointment_date: apt.scheduled_start,
      start_time: apt.scheduled_start ? new Date(apt.scheduled_start).toTimeString().slice(0, 5) : null,
      patient: apt.patient,
      doctor: apt.doctors ? {
        id: apt.doctors.id,
        first_name: apt.doctors.users?.first_name,
        last_name: apt.doctors.users?.last_name
      } : null,
      specialty: apt.doctors?.specialties || null,
      consultation_note: apt.consultation_notes?.[0] || null
    }));
  }

  hasSoftDelete() {
    return false; // Uses status_id = CANCELLED instead of is_deleted column
  }
}

module.exports = new AppointmentRepository();
