/**
 * User Repository
 * Data access layer for User entity
 * 
 * @module crud-api/repositories/UserRepository
 */

const BaseRepository = require('../../shared/repositories/BaseRepository');

class UserRepository extends BaseRepository {
  constructor() {
    super('users');
  }

  /**
   * Find user by email
   * @param {string} email - User email
   * @returns {Promise<Object|null>}
   */
  async findByEmail(email) {
    const { data, error } = await this.db
      .from(this.tableName)
      .select(`
        *,
        roles:role_id (id, name, code)
      `)
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Database error: ${error.message}`);
    }

    return data;
  }

  /**
   * Find user by cedula
   * @param {string} cedula - User cedula
   * @returns {Promise<Object|null>}
   */
  async findByCedula(cedula) {
    const { data, error } = await this.db
      .from(this.tableName)
      .select('*')
      .eq('cedula', cedula)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Database error: ${error.message}`);
    }

    return data;
  }

  /**
   * Find user with role details
   * @param {string} id - User ID
   * @returns {Promise<Object|null>}
   */
  async findWithRole(id) {
    const { data, error } = await this.db
      .from(this.tableName)
      .select(`
        id,
        email,
        first_name,
        last_name,
        cedula,
        phone_number,
        is_active,
        created_at,
        updated_at,
        roles:role_id (
          id,
          name,
          code
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
   * Find users by role
   * @param {string} roleName - Role name
   * @param {Object} options - Query options
   * @returns {Promise<Array>}
   */
  async findByRole(roleName, options = {}) {
    const { limit, offset } = options;

    let query = this.db
      .from(this.tableName)
      .select(`
        id,
        email,
        first_name,
        last_name,
        cedula,
        phone_number,
        is_active,
        created_at,
        roles!inner (name)
      `)
      .eq('roles.name', roleName)
      .eq('is_active', true)
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
   * Update user active status (soft delete)
   * @param {string} id - User ID
   * @param {boolean} isActive - Active status
   * @returns {Promise<Object>}
   */
  async updateActiveStatus(id, isActive) {
    return this.update(id, { is_active: isActive });
  }

  /**
   * Soft delete implementation
   * @param {string} id - User ID
   * @returns {Promise<boolean>}
   */
  async softDelete(id) {
    return this.updateActiveStatus(id, false);
  }

  hasSoftDelete() {
    return false; // Users use is_active instead
  }
}

module.exports = new UserRepository();
