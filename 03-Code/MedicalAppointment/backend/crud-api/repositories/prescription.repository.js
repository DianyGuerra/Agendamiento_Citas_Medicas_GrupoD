/**
 * Prescription Repository
 * Data access layer for Prescription entity
 * 
 * @module crud-api/repositories/PrescriptionRepository
 */

const BaseRepository = require('../../shared/repositories/BaseRepository');

class PrescriptionRepository extends BaseRepository {
  constructor() {
    super('prescriptions');
  }

  /**
   * Find all prescriptions with QR data
   * @returns {Promise<Array>}
   */
  async findAll() {
    const { data, error } = await this.db
      .from(this.tableName)
      .select(`
        id,
        patient_user_id,
        doctor_id,
        appointment_id,
        diagnosis,
        medications,
        instructions,
        duration,
        created_at,
        updated_at,
        prescription_qr_codes (
          id,
          qr_token,
          qr_image,
          verification_url,
          is_valid
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Find prescriptions by doctor
   * @param {string} doctorId - Doctor ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>}
   */
  async findByDoctor(doctorId, options = {}) {
    const { limit, offset, patientId } = options;

    // Note: prescriptions table does NOT have is_active column
    let query = this.db
      .from(this.tableName)
      .select(`
        id,
        patient_user_id,
        doctor_id,
        appointment_id,
        diagnosis,
        medications,
        instructions,
        duration,
        created_at,
        updated_at,
        patient:patient_user_id (
          first_name,
          last_name,
          email
        ),
        prescription_qr_codes (
          qr_token,
          qr_image,
          verification_url,
          is_valid
        )
      `)
      .eq('doctor_id', doctorId)
      .order('created_at', { ascending: false });

    if (patientId) {
      query = query.eq('patient_user_id', patientId);
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
   * Find prescriptions by patient
   * @param {string} patientUserId - Patient user ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>}
   */
  async findByPatient(patientUserId, options = {}) {
    const { limit, offset, activeOnly = false } = options;

    let query = this.db
      .from(this.tableName)
      .select(`
        id,
        doctor_id,
        diagnosis,
        medications,
        instructions,
        duration,
        created_at,
        doctors (
          id,
          users (
            first_name,
            last_name
          ),
          specialties (
            name
          )
        ),
        prescription_qr_codes (
          qr_token,
          qr_image,
          verification_url,
          is_valid
        )
      `)
      .eq('patient_user_id', patientUserId)
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
   * Find prescription with QR data
   * @param {string} id - Prescription ID
   * @returns {Promise<Object|null>}
   */
  async findWithQR(id) {
    const { data, error } = await this.db
      .from(this.tableName)
      .select(`
        *,
        patient:patient_user_id (
          first_name,
          last_name,
          email
        ),
        doctors (
          id,
          professional_id,
          users (
            first_name,
            last_name
          ),
          specialties (
            name
          )
        ),
        prescription_qr_codes (
          qr_token,
          verification_url,
          is_valid
        )
      `)
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Database error: ${error.message}`);
    }

    return data;
  }

  /**
   * Soft delete - prescriptions table does NOT have is_active column
   * This is a NO-OP, use hard delete instead if needed
   * @param {string} id - Prescription ID
   * @returns {Promise<boolean>}
   */
  async softDelete(id) {
    // prescriptions table does NOT have is_active column
    // Log this attempt and return true to avoid breaking flows
    console.warn(`softDelete called on prescription ${id}, but prescriptions table has no is_active column`);
    return true;
  }

  /**
   * Find prescriptions by appointment
   * @param {string} appointmentId - Appointment ID
   * @returns {Promise<Array>}
   */
  async findByAppointment(appointmentId) {
    const { data, error } = await this.db
      .from(this.tableName)
      .select(`
        id,
        doctor_id,
        diagnosis,
        medications,
        instructions,
        duration,
        created_at,
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
      .eq('appointment_id', appointmentId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return data || [];
  }

  hasSoftDelete() {
    return false; // prescriptions table has no is_active column
  }
}

module.exports = new PrescriptionRepository();
