/**
 * Medical Record Repository
 * Data access layer for Medical Record entity
 * 
 * @module crud-api/repositories/MedicalRecordRepository
 */

const BaseRepository = require('../../shared/repositories/BaseRepository');

class MedicalRecordRepository extends BaseRepository {
  constructor() {
    super('medical_records');
  }

  /**
   * Find medical record by patient user ID
   * @param {string} patientUserId - Patient user ID
   * @returns {Promise<Object|null>}
   */
  async findByPatient(patientUserId) {
    const { data, error } = await this.db
      .from(this.tableName)
      .select(`
        *,
        doctors (
          id,
          users (
            first_name,
            last_name
          )
        )
      `)
      .eq('patient_user_id', patientUserId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Database error: ${error.message}`);
    }

    return data;
  }

  /**
   * Create or get medical record for patient
   * @param {string} patientUserId - Patient user ID
   * @returns {Promise<Object>}
   */
  async findOrCreate(patientUserId) {
    let record = await this.findByPatient(patientUserId);
    
    if (!record) {
      record = await this.create({ patient_user_id: patientUserId });
    }
    
    return record;
  }

  /**
   * Update medical record by patient
   * @param {string} patientUserId - Patient user ID
   * @param {Object} data - Update data
   * @returns {Promise<Object>}
   */
  async updateByPatient(patientUserId, data) {
    const { data: updated, error } = await this.db
      .from(this.tableName)
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('patient_user_id', patientUserId)
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return updated;
  }
}

module.exports = new MedicalRecordRepository();
