/**
 * Schedule Exception Repository
 * Data access layer for Schedule Exception entity
 * 
 * @module crud-api/repositories/ScheduleExceptionRepository
 */

const BaseRepository = require('../../shared/repositories/BaseRepository');

class ScheduleExceptionRepository extends BaseRepository {
  constructor() {
    super('schedule_exceptions');
  }

  /**
   * Find exceptions by doctor
   * @param {string} doctorId - Doctor ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>}
   */
  async findByDoctor(doctorId, options = {}) {
    const { startDate, endDate, limit, offset } = options;

    let query = this.db
      .from(this.tableName)
      .select('*')
      .eq('doctor_id', doctorId)
      .order('exception_date', { ascending: true });

    if (startDate) {
      query = query.gte('exception_date', startDate);
    }

    if (endDate) {
      query = query.lte('exception_date', endDate);
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
   * Find exceptions for specific date
   * @param {string} doctorId - Doctor ID
   * @param {string} date - Date string (YYYY-MM-DD)
   * @returns {Promise<Array>}
   */
  async findByDoctorAndDate(doctorId, date) {
    const { data, error } = await this.db
      .from(this.tableName)
      .select('*')
      .eq('doctor_id', doctorId)
      .eq('exception_date', date);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Check if date has blocking exception
   * @param {string} doctorId - Doctor ID
   * @param {string} date - Date string (YYYY-MM-DD)
   * @returns {Promise<boolean>}
   */
  async hasBlockingException(doctorId, date) {
    const exceptions = await this.findByDoctorAndDate(doctorId, date);
    
    return exceptions.some(
      exc => exc.is_all_day || 
             exc.exception_type === 'vacation' || 
             exc.exception_type === 'day_off'
    );
  }

  /**
   * Create vacation exception
   * @param {string} doctorId - Doctor ID
   * @param {string} startDate - Start date
   * @param {string} endDate - End date
   * @param {string} [reason] - Reason for vacation
   * @returns {Promise<Array>}
   */
  async createVacation(doctorId, startDate, endDate, reason = null) {
    const dates = [];
    const current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
      dates.push({
        doctor_id: doctorId,
        exception_date: current.toISOString().split('T')[0],
        exception_type: 'vacation',
        is_all_day: true,
        reason
      });
      current.setDate(current.getDate() + 1);
    }

    const { data, error } = await this.db
      .from(this.tableName)
      .insert(dates)
      .select();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete exceptions for date range
   * @param {string} doctorId - Doctor ID
   * @param {string} startDate - Start date
   * @param {string} endDate - End date
   * @returns {Promise<boolean>}
   */
  async deleteByDateRange(doctorId, startDate, endDate) {
    const { error } = await this.db
      .from(this.tableName)
      .delete()
      .eq('doctor_id', doctorId)
      .gte('exception_date', startDate)
      .lte('exception_date', endDate);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return true;
  }
}

module.exports = new ScheduleExceptionRepository();
