/**
 * Schedule Repository
 * Data access layer for Doctor Schedule entity
 * 
 * @module crud-api/repositories/ScheduleRepository
 */

const BaseRepository = require('../../shared/repositories/BaseRepository');

class ScheduleRepository extends BaseRepository {
  constructor() {
    super('doctor_schedules');
  }

  /**
   * Find schedules by doctor
   * @param {string} doctorId - Doctor ID
   * @returns {Promise<Array>}
   */
  async findByDoctor(doctorId) {
    const { data, error } = await this.db
      .from(this.tableName)
      .select('*')
      .eq('doctor_id', doctorId)
      .order('day_of_week', { ascending: true });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Find schedule for specific day
   * @param {string} doctorId - Doctor ID
   * @param {number} dayOfWeek - Day of week (0-6)
   * @returns {Promise<Object|null>}
   */
  async findByDoctorAndDay(doctorId, dayOfWeek) {
    const { data, error } = await this.db
      .from(this.tableName)
      .select('*')
      .eq('doctor_id', doctorId)
      .eq('day_of_week', dayOfWeek)
      .eq('is_working_day', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Database error: ${error.message}`);
    }

    return data;
  }

  /**
   * Find working days for doctor
   * @param {string} doctorId - Doctor ID
   * @returns {Promise<Array>}
   */
  async findWorkingDays(doctorId) {
    const { data, error } = await this.db
      .from(this.tableName)
      .select('day_of_week, start_time, end_time, break_start_time, break_end_time')
      .eq('doctor_id', doctorId)
      .eq('is_working_day', true)
      .order('day_of_week', { ascending: true });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Upsert schedule (create or update)
   * Uses delete + insert pattern to avoid requiring unique constraint
   * @param {string} doctorId - Doctor ID
   * @param {number} dayOfWeek - Day of week
   * @param {Object} scheduleData - Schedule data
   * @returns {Promise<Object>}
   */
  async upsert(doctorId, dayOfWeek, scheduleData) {
    // First, check if record exists
    const { data: existing } = await this.db
      .from(this.tableName)
      .select('id')
      .eq('doctor_id', doctorId)
      .eq('day_of_week', dayOfWeek)
      .maybeSingle();

    const now = new Date().toISOString();

    if (existing) {
      // Update existing record
      const { data, error } = await this.db
        .from(this.tableName)
        .update({
          ...scheduleData,
          updated_at: now
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }
      return data;
    } else {
      // Insert new record
      const { data, error } = await this.db
        .from(this.tableName)
        .insert({
          doctor_id: doctorId,
          day_of_week: dayOfWeek,
          ...scheduleData,
          created_at: now,
          updated_at: now
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }
      return data;
    }
  }

  /**
   * Delete schedules by doctor
   * @param {string} doctorId - Doctor ID
   * @returns {Promise<boolean>}
   */
  async deleteByDoctor(doctorId) {
    const { error } = await this.db
      .from(this.tableName)
      .delete()
      .eq('doctor_id', doctorId);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return true;
  }
}

module.exports = new ScheduleRepository();
