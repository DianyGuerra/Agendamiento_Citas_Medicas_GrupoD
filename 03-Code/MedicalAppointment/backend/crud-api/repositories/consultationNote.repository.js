/**
 * Consultation Note Repository
 * Data access layer for Consultation Note entity
 * 
 * @module crud-api/repositories/ConsultationNoteRepository
 */

const BaseRepository = require('../../shared/repositories/BaseRepository');

class ConsultationNoteRepository extends BaseRepository {
  constructor() {
    super('consultation_notes');
  }

  /**
   * Find consultation note by appointment
   * @param {string} appointmentId - Appointment ID
   * @returns {Promise<Object|null>}
   */
  async findByAppointment(appointmentId) {
    const { data, error } = await this.db
      .from(this.tableName)
      .select(`
        *,
        appointments (
          id,
          scheduled_start,
          scheduled_end,
          reason,
          patient_user_id
        ),
        doctors (
          id,
          professional_id,
          users (
            first_name,
            last_name,
            email
          ),
          specialties (
            name
          )
        )
      `)
      .eq('appointment_id', appointmentId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Database error: ${error.message}`);
    }

    return data;
  }

  /**
   * Find consultation notes by patient
   * @param {string} patientUserId - Patient user ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>}
   */
  async findByPatient(patientUserId, options = {}) {
    const { limit, offset } = options;

    let query = this.db
      .from(this.tableName)
      .select(`
        *,
        appointments!inner (
          id,
          scheduled_start,
          scheduled_end,
          patient_user_id
        ),
        doctors (
          id,
          users (
            first_name,
            last_name
          ),
          specialties (
            name
          )
        )
      `)
      .eq('appointments.patient_user_id', patientUserId)
      .order('created_at', { ascending: false });

    if (limit) query = query.limit(limit);
    if (offset) query = query.range(offset, offset + (limit || 20) - 1);

    const { data, error } = await query;

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Find consultation notes by doctor
   * @param {string} doctorId - Doctor ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>}
   */
  async findByDoctor(doctorId, options = {}) {
    const { limit, offset, startDate, endDate } = options;

    let query = this.db
      .from(this.tableName)
      .select(`
        *,
        appointments (
          id,
          scheduled_start,
          patient_user_id,
          patient:patient_user_id (
            first_name,
            last_name
          )
        )
      `)
      .eq('doctor_id', doctorId)
      .order('created_at', { ascending: false });

    if (startDate) {
      query = query.gte('created_at', `${startDate}T00:00:00Z`);
    }

    if (endDate) {
      query = query.lte('created_at', `${endDate}T23:59:59Z`);
    }

    if (limit) query = query.limit(limit);
    if (offset) query = query.range(offset, offset + (limit || 20) - 1);

    const { data, error } = await query;

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Check if note exists for appointment
   * @param {string} appointmentId - Appointment ID
   * @returns {Promise<boolean>}
   */
  async existsForAppointment(appointmentId) {
    const { count, error } = await this.db
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .eq('appointment_id', appointmentId);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return count > 0;
  }
}

module.exports = new ConsultationNoteRepository();
