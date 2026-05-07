/**
 * Specialty Repository
 * Data access layer for Specialty entity
 * 
 * Note: specialties table only has: id, name, description, consultation_fee
 * NO is_active, NO created_at, NO updated_at columns
 * 
 * @module crud-api/repositories/SpecialtyRepository
 */

const BaseRepository = require('../../shared/repositories/BaseRepository');

class SpecialtyRepository extends BaseRepository {
  constructor() {
    super('specialties');
  }

  /**
   * Override create - specialties table has no created_at column
   * @param {Object} data - Record data
   * @returns {Promise<Object>}
   */
  async create(data) {
    const { data: created, error } = await this.db
      .from(this.tableName)
      .insert([{
        name: data.name,
        description: data.description || null,
        consultation_fee: data.consultation_fee || null
      }])
      .select('id, name, description, consultation_fee')
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return created;
  }

  /**
   * Override update - specialties table has no updated_at column
   * @param {string} id - Record ID
   * @param {Object} data - Update data
   * @returns {Promise<Object>}
   */
  async update(id, data) {
    // Filter out undefined values
    const updateData = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.consultation_fee !== undefined) updateData.consultation_fee = data.consultation_fee;

    const { data: updated, error } = await this.db
      .from(this.tableName)
      .update(updateData)
      .eq('id', id)
      .select('id, name, description, consultation_fee')
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return updated;
  }

  /**
   * Find all specialties
   * @param {Object} options - Query options
   * @returns {Promise<Array>}
   */
  async findAllActive(options = {}) {
    const { limit, offset } = options;

    // Note: specialties table does NOT have is_active or created_at columns
    let query = this.db
      .from(this.tableName)
      .select('id, name, description, consultation_fee')
      .order('name', { ascending: true });

    if (limit) query = query.limit(limit);
    if (offset) query = query.range(offset, offset + (limit || 50) - 1);

    const { data, error } = await query;

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Find specialty by name
   * @param {string} name - Specialty name
   * @returns {Promise<Object|null>}
   */
  async findByName(name) {
    const { data, error } = await this.db
      .from(this.tableName)
      .select('id, name, description, consultation_fee')
      .ilike('name', name)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Database error: ${error.message}`);
    }

    return data;
  }

  /**
   * Find specialty with doctor count
   * @param {string} id - Specialty ID
   * @returns {Promise<Object|null>}
   */
  async findWithDoctorCount(id) {
    const { data: specialty, error } = await this.db
      .from(this.tableName)
      .select('id, name, description, consultation_fee')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Database error: ${error.message}`);
    }

    // Count doctors
    const { count } = await this.db
      .from('doctors')
      .select('*', { count: 'exact', head: true })
      .eq('specialty_id', id)
      .eq('active', true);

    return {
      ...specialty,
      doctor_count: count || 0
    };
  }

  /**
   * Get specialty statistics
   * @returns {Promise<Object>}
   */
  async getStats() {
    // Get total specialties count
    const { count: totalSpecialties } = await this.db
      .from(this.tableName)
      .select('*', { count: 'exact', head: true });

    // Get specialties with doctor counts
    const { data: specialties, error } = await this.db
      .from(this.tableName)
      .select('id, name');

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    // Get doctor counts per specialty
    const { data: doctorCounts } = await this.db
      .from('doctors')
      .select('specialty_id')
      .eq('active', true);

    const countBySpecialty = {};
    (doctorCounts || []).forEach(d => {
      countBySpecialty[d.specialty_id] = (countBySpecialty[d.specialty_id] || 0) + 1;
    });

    // Total active doctors
    const totalDoctors = doctorCounts?.length || 0;

    // Specialty with most doctors
    let topSpecialty = null;
    let maxCount = 0;
    specialties?.forEach(s => {
      const count = countBySpecialty[s.id] || 0;
      if (count > maxCount) {
        maxCount = count;
        topSpecialty = s.name;
      }
    });

    return {
      // Frontend expects these names
      total: totalSpecialties || 0,
      active: totalSpecialties || 0, // All specialties are "active" (no is_active column)
      withDoctors: Object.keys(countBySpecialty).length,
      newThisMonth: 0, // Not trackable - no created_at column
      // Extra stats
      total_doctors: totalDoctors,
      top_specialty: topSpecialty,
      top_specialty_doctors: maxCount
    };
  }

  /**
   * Soft delete specialty - NOT SUPPORTED
   * specialties table has no is_active column
   * @param {string} id - Specialty ID
   * @returns {Promise<boolean>}
   */
  async softDelete(id) {
    // specialties table has no is_active column - do actual delete
    const { error } = await this.db
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return true;
  }

  hasSoftDelete() {
    return false; // specialties table has no is_active column
  }
}

module.exports = new SpecialtyRepository();
