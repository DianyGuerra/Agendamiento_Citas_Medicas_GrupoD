/**
 * Doctor Repository
 * Data access layer for Doctor entity
 * 
 * @module crud-api/repositories/DoctorRepository
 */

const BaseRepository = require('../../shared/repositories/BaseRepository');

class DoctorRepository extends BaseRepository {
  constructor() {
    super('doctors');
  }

  /**
   * Find doctor by user ID
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>}
   */
  async findByUserId(userId) {
    const { data, error } = await this.db
      .from(this.tableName)
      .select(`
        *,
        users (
          id,
          email,
          first_name,
          last_name,
          phone_number,
          cedula
        ),
        specialties (
          id,
          name,
          description
        )
      `)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Database error: ${error.message}`);
    }

    return data;
  }

  /**
   * Find doctor with full details
   * @param {string} id - Doctor ID
   * @returns {Promise<Object|null>}
   */
  async findWithDetails(id) {
    const { data, error } = await this.db
      .from(this.tableName)
      .select(`
        id,
        professional_id,
        specialty_id,
        user_id,
        bio,
        active,
        created_at,
        updated_at,
        users (
          id,
          email,
          first_name,
          last_name,
          phone_number,
          cedula,
          is_active
        ),
        specialties (
          id,
          name,
          description,
          consultation_fee
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
   * Find doctors by specialty
   * @param {string} specialtyId - Specialty ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>}
   */
  async findBySpecialty(specialtyId, options = {}) {
    const { limit, offset, activeOnly = true } = options;

    let query = this.db
      .from(this.tableName)
      .select(`
        id,
        professional_id,
        user_id,
        bio,
        active,
        users!inner (
          id,
          first_name,
          last_name,
          email,
          phone_number,
          cedula,
          is_active
        ),
        specialties (
          id,
          name,
          consultation_fee
        )
      `)
      .eq('specialty_id', specialtyId);

    if (activeOnly) {
      query = query.eq('active', true).eq('users.is_active', true);
    }

    // Note: Supabase doesn't support ordering by related table columns directly
    // We'll sort in JavaScript after fetching

    if (limit) query = query.limit(limit);
    if (offset) query = query.range(offset, offset + (limit || 20) - 1);

    const { data, error } = await query;

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    // Sort by last_name in JavaScript
    const sortedData = (data || []).sort((a, b) => {
      const lastNameA = (a.users?.last_name || '').toLowerCase();
      const lastNameB = (b.users?.last_name || '').toLowerCase();
      return lastNameA.localeCompare(lastNameB);
    });

    return sortedData.map(this.formatDoctorResponse);
  }

  /**
   * Find all doctors with filters
   * @param {Object} options - Query options
   * @returns {Promise<Array>}
   */
  async findAllWithDetails(options = {}) {
    const { limit, offset, activeOnly = true, search } = options;

    let query = this.db
      .from(this.tableName)
      .select(`
        id,
        professional_id,
        specialty_id,
        user_id,
        bio,
        active,
        created_at,
        updated_at,
        users (
          id,
          first_name,
          last_name,
          email,
          phone_number,
          cedula,
          is_active
        ),
        specialties (
          id,
          name,
          consultation_fee
        )
      `);

    if (activeOnly) {
      query = query.eq('active', true);
    }

    query = query.order('created_at', { ascending: false });

    if (limit) query = query.limit(limit);
    if (offset) query = query.range(offset, offset + (limit || 20) - 1);

    const { data, error } = await query;

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    let results = (data || []).map(this.formatDoctorResponse);

    // Filter active users and apply search
    if (activeOnly) {
      results = results.filter(d => d.is_active);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      results = results.filter(d => 
        d.first_name?.toLowerCase().includes(searchLower) ||
        d.last_name?.toLowerCase().includes(searchLower) ||
        d.email?.toLowerCase().includes(searchLower)
      );
    }

    return results;
  }

  /**
   * Update doctor active status
   * @param {string} id - Doctor ID
   * @param {boolean} active - Active status
   * @returns {Promise<Object>}
   */
  async updateActiveStatus(id, active) {
    return this.update(id, { active });
  }

  /**
   * Soft delete (deactivate doctor)
   * @param {string} id - Doctor ID
   * @returns {Promise<boolean>}
   */
  async softDelete(id) {
    await this.updateActiveStatus(id, false);
    return true;
  }

  /**
   * Format doctor response
   * @param {Object} doctor - Raw doctor data
   * @returns {Object} Formatted doctor
   */
  formatDoctorResponse(doctor) {
    return {
      id: doctor.id,
      professional_id: doctor.professional_id,
      specialty_id: doctor.specialty_id,
      user_id: doctor.user_id,
      first_name: doctor.users?.first_name,
      last_name: doctor.users?.last_name,
      email: doctor.users?.email,
      phone_number: doctor.users?.phone_number,
      cedula: doctor.users?.cedula,
      is_active: doctor.users?.is_active,
      specialty_name: doctor.specialties?.name,
      specialty: doctor.specialties,
      bio: doctor.bio,
      active: doctor.active,
      status: doctor.active ? 'active' : 'inactive',
      consultation_fee: doctor.specialties?.consultation_fee,
      created_at: doctor.created_at,
      updated_at: doctor.updated_at
    };
  }

  hasSoftDelete() {
    return false; // Uses active field instead
  }
}

module.exports = new DoctorRepository();
