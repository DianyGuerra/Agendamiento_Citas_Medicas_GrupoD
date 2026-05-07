/**
 * Waiting List Repository
 * Database operations for waiting list management
 * 
 * @module crud-api/repositories/WaitingListRepository
 */

const { supabase } = require('../../shared/config/database.config');

class WaitingListRepository {
  constructor() {
    this.tableName = 'waiting_list';
  }

  /**
   * Get all waiting list entries with filters
   * @param {Object} filters - Query filters
   * @returns {Promise<Array>}
   */
  async findAll(filters = {}) {
    let query = supabase
      .from(this.tableName)
      .select(`
        *,
        patient:users!waiting_list_patient_user_id_fkey(id, first_name, last_name, email),
        doctor:doctors(
          id,
          user:users(first_name, last_name),
          specialty:specialties(name)
        )
      `)
      .eq('is_active', true)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true });

    if (filters.doctor_id) {
      query = query.eq('doctor_id', filters.doctor_id);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.patient_user_id) {
      query = query.eq('patient_user_id', filters.patient_user_id);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  /**
   * Find waiting list entry by ID
   * @param {string} id - Entry ID
   * @returns {Promise<Object>}
   */
  async findById(id) {
    const { data, error } = await supabase
      .from(this.tableName)
      .select(`
        *,
        patient:users!waiting_list_patient_user_id_fkey(id, first_name, last_name, email, phone_number),
        doctor:doctors(
          id,
          user:users(first_name, last_name),
          specialty:specialties(name)
        )
      `)
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Create waiting list entry
   * @param {Object} entryData - Entry data
   * @returns {Promise<Object>}
   */
  async create(entryData) {
    const { data, error } = await supabase
      .from(this.tableName)
      .insert({
        ...entryData,
        status: 'waiting',
        is_active: true,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update waiting list entry
   * @param {string} id - Entry ID
   * @param {Object} entryData - Entry data
   * @returns {Promise<Object>}
   */
  async update(id, entryData) {
    const { data, error } = await supabase
      .from(this.tableName)
      .update({
        ...entryData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('is_active', true)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Soft delete waiting list entry
   * @param {string} id - Entry ID
   * @returns {Promise<Object>}
   */
  async delete(id) {
    const { data, error } = await supabase
      .from(this.tableName)
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update entry status
   * @param {string} id - Entry ID
   * @param {string} status - New status
   * @returns {Promise<Object>}
   */
  async updateStatus(id, status) {
    const updateData = {
      status,
      updated_at: new Date().toISOString()
    };

    if (status === 'notified') {
      updateData.notified_at = new Date().toISOString();
    }

    if (status === 'booked') {
      updateData.booked_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from(this.tableName)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get count by doctor
   * @param {string} doctorId - Doctor ID
   * @returns {Promise<number>}
   */
  async countByDoctor(doctorId) {
    const { count, error } = await supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .eq('doctor_id', doctorId)
      .eq('status', 'waiting')
      .eq('is_active', true);

    if (error) throw error;
    return count || 0;
  }
}

module.exports = new WaitingListRepository();
