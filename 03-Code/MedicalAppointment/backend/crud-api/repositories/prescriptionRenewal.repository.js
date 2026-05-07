/**
 * Prescription Renewal Repository
 * Data access layer for Prescription Renewals
 * 
 * @module crud-api/repositories/PrescriptionRenewalRepository
 */

const BaseRepository = require('../../shared/repositories/BaseRepository');

class PrescriptionRenewalRepository extends BaseRepository {
  constructor() {
    super('prescription_renewals');
  }

  /**
   * Create a renewal request
   * @param {Object} data - Renewal data
   * @returns {Promise<Object>}
   */
  async createRenewalRequest(data) {
    const { data: renewal, error } = await this.db
      .from(this.tableName)
      .insert({
        original_prescription_id: data.original_prescription_id,
        patient_user_id: data.patient_user_id,
        doctor_id: data.doctor_id,
        request_reason: data.reason,
        patient_notes: data.notes,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Error creating renewal request: ${error.message}`);
    }

    return renewal;
  }

  /**
   * Find renewals by patient
   * @param {string} patientUserId - Patient user ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>}
   */
  async findByPatient(patientUserId, options = {}) {
    const { limit = 20, offset = 0, status } = options;

    let query = this.db
      .from(this.tableName)
      .select(`
        id,
        original_prescription_id,
        new_prescription_id,
        status,
        request_reason,
        patient_notes,
        doctor_response,
        rejection_reason,
        requested_at,
        reviewed_at,
        created_at,
        prescriptions!original_prescription_id (
          id,
          diagnosis,
          medications,
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
        )
      `)
      .eq('patient_user_id', patientUserId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (limit) {
      query = query.limit(limit);
    }

    if (offset) {
      query = query.range(offset, offset + limit - 1);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Error fetching renewals: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Find renewals by doctor
   * @param {string} doctorId - Doctor ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>}
   */
  async findByDoctor(doctorId, options = {}) {
    const { limit = 20, offset = 0, status } = options;

    let query = this.db
      .from(this.tableName)
      .select(`
        id,
        original_prescription_id,
        new_prescription_id,
        patient_user_id,
        status,
        request_reason,
        patient_notes,
        doctor_response,
        rejection_reason,
        requested_at,
        reviewed_at,
        created_at,
        prescriptions!original_prescription_id (
          id,
          diagnosis,
          medications,
          instructions,
          duration
        ),
        users!patient_user_id (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('doctor_id', doctorId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (limit) {
      query = query.limit(limit);
    }

    if (offset) {
      query = query.range(offset, offset + limit - 1);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Error fetching renewals: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Find pending renewals count for doctor
   * @param {string} doctorId - Doctor ID
   * @returns {Promise<number>}
   */
  async countPendingByDoctor(doctorId) {
    const { count, error } = await this.db
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .eq('doctor_id', doctorId)
      .eq('status', 'pending');

    if (error) {
      throw new Error(`Error counting renewals: ${error.message}`);
    }

    return count || 0;
  }

  /**
   * Update renewal status (approve/reject)
   * @param {string} id - Renewal ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>}
   */
  async updateStatus(id, updateData) {
    const { data, error } = await this.db
      .from(this.tableName)
      .update({
        status: updateData.status,
        doctor_response: updateData.doctor_response,
        rejection_reason: updateData.rejection_reason,
        new_prescription_id: updateData.new_prescription_id,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error updating renewal: ${error.message}`);
    }

    return data;
  }

  /**
   * Check if there's already a pending renewal for a prescription
   * @param {string} prescriptionId - Original prescription ID
   * @param {string} patientUserId - Patient user ID
   * @returns {Promise<boolean>}
   */
  async hasPendingRenewal(prescriptionId, patientUserId) {
    const { data, error } = await this.db
      .from(this.tableName)
      .select('id')
      .eq('original_prescription_id', prescriptionId)
      .eq('patient_user_id', patientUserId)
      .eq('status', 'pending')
      .maybeSingle();

    if (error) {
      throw new Error(`Error checking pending renewal: ${error.message}`);
    }

    return !!data;
  }

  /**
   * Find renewal by ID with full details
   * @param {string} id - Renewal ID
   * @returns {Promise<Object>}
   */
  async findByIdWithDetails(id) {
    const { data, error } = await this.db
      .from(this.tableName)
      .select(`
        id,
        original_prescription_id,
        new_prescription_id,
        patient_user_id,
        doctor_id,
        status,
        request_reason,
        patient_notes,
        doctor_response,
        rejection_reason,
        requested_at,
        reviewed_at,
        created_at,
        prescriptions!original_prescription_id (
          id,
          diagnosis,
          medications,
          instructions,
          duration
        ),
        users!patient_user_id (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Error fetching renewal: ${error.message}`);
    }

    return data;
  }
}

module.exports = new PrescriptionRenewalRepository();
