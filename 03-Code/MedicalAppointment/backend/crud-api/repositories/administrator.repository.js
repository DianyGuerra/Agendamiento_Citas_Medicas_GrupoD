/**
 * Administrator Repository
 * Data access layer for Administrator entity
 * 
 * @module crud-api/repositories/AdministratorRepository
 */

const BaseRepository = require('../../shared/repositories/BaseRepository');

class AdministratorRepository extends BaseRepository {
  constructor() {
    super('administrators');
  }

  /**
   * Find all administrators with user details
   * @returns {Promise<Array>}
   */
  async findAllWithUsers() {
    // First get all administrators
    const { data: admins, error: adminError } = await this.db
      .from(this.tableName)
      .select('*')
      .order('created_at', { ascending: false });

    if (adminError) {
      throw new Error(`Database error: ${adminError.message}`);
    }

    if (!admins || admins.length === 0) {
      return [];
    }

    // Get user IDs
    const userIds = admins.map(a => a.user_id).filter(Boolean);

    // Get users data
    const { data: users, error: userError } = await this.db
      .from('users')
      .select('id, email, first_name, last_name, is_active, created_at')
      .in('id', userIds);

    if (userError) {
      throw new Error(`Database error: ${userError.message}`);
    }

    // Map users to administrators
    const usersMap = new Map(users.map(u => [u.id, u]));
    return admins.map(admin => ({
      ...admin,
      user: usersMap.get(admin.user_id) || null
    }));
  }

  /**
   * Find administrator by user ID
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>}
   */
  async findByUserId(userId) {
    const { data: admin, error: adminError } = await this.db
      .from(this.tableName)
      .select('*')
      .eq('user_id', userId)
      .single();

    if (adminError) {
      if (adminError.code === 'PGRST116') return null;
      throw new Error(`Database error: ${adminError.message}`);
    }

    // Get user data
    const { data: user, error: userError } = await this.db
      .from('users')
      .select('id, email, first_name, last_name, is_active')
      .eq('id', userId)
      .single();

    if (userError && userError.code !== 'PGRST116') {
      throw new Error(`Database error: ${userError.message}`);
    }

    return {
      ...admin,
      user: user || null
    };
  }

  /**
   * Update administrator permissions
   * @param {string} id - Administrator ID
   * @param {Array<string>} permissions - Permissions array
   * @returns {Promise<Object>}
   */
  async updatePermissions(id, permissions) {
    const { data, error } = await this.db
      .from(this.tableName)
      .update({
        permissions,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return data;
  }

  /**
   * Toggle super admin status
   * @param {string} id - Administrator ID
   * @param {boolean} isSuperAdmin - Super admin status
   * @returns {Promise<Object>}
   */
  async toggleSuperAdmin(id, isSuperAdmin) {
    const { data, error } = await this.db
      .from(this.tableName)
      .update({
        is_super_admin: isSuperAdmin,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return data;
  }

  /**
   * Create administrator record
   * @param {Object} adminData - Administrator data
   * @returns {Promise<Object>}
   */
  async createAdmin(adminData) {
    const { data, error } = await this.db
      .from(this.tableName)
      .insert({
        user_id: adminData.user_id,
        permissions: adminData.permissions || [],
        is_super_admin: adminData.is_super_admin || false
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return data;
  }

  /**
   * Count super admins
   * @returns {Promise<number>}
   */
  async countSuperAdmins() {
    const { count, error } = await this.db
      .from(this.tableName)
      .select('id', { count: 'exact', head: true })
      .eq('is_super_admin', true);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return count || 0;
  }
}

module.exports = new AdministratorRepository();
