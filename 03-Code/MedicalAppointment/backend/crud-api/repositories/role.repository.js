/**
 * Role Repository
 * Data access layer for Role entity
 * 
 * @module crud-api/repositories/RoleRepository
 */

const BaseRepository = require('../../shared/repositories/BaseRepository');

class RoleRepository extends BaseRepository {
  constructor() {
    super('roles');
  }

  /**
   * Find all roles with user count
   * @returns {Promise<Array>}
   */
  async findAllWithUserCount() {
    const { data: roles, error } = await this.db
      .from(this.tableName)
      .select('*')
      .order('name');

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    // Get user counts for each role
    const rolesWithCounts = await Promise.all(
      roles.map(async (role) => {
        const { count } = await this.db
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('role_id', role.id);
        
        return { ...role, user_count: count || 0 };
      })
    );

    return rolesWithCounts;
  }

  /**
   * Find role by code
   * @param {string} code - Role code
   * @returns {Promise<Object|null>}
   */
  async findByCode(code) {
    const { data, error } = await this.db
      .from(this.tableName)
      .select('*')
      .eq('code', code)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Database error: ${error.message}`);
    }

    return data;
  }

  /**
   * Check if role is a core role (cannot be deleted)
   * @param {string} code - Role code
   * @returns {boolean}
   */
  isCoreRole(code) {
    const coreRoles = ['admin', 'doctor', 'patient'];
    return coreRoles.includes(code?.toLowerCase());
  }
}

module.exports = new RoleRepository();
