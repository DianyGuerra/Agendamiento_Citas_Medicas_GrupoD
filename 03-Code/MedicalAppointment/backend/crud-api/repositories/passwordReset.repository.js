/**
 * Password Reset Repository
 * Data access layer for Password Reset entity
 * 
 * @module crud-api/repositories/PasswordResetRepository
 */

const BaseRepository = require('../../shared/repositories/BaseRepository');
const crypto = require('crypto');

class PasswordResetRepository extends BaseRepository {
  constructor() {
    super('password_resets');
  }

  /**
   * Find all password resets for a user
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>}
   */
  async findByUserId(userId, options = {}) {
    const { limit = 10 } = options;

    const { data, error } = await this.db
      .from(this.tableName)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Create password reset token
   * @param {string} userId - User ID
   * @param {number} expiresInHours - Token expiration in hours (default 24)
   * @returns {Promise<Object>}
   */
  async createToken(userId, expiresInHours = 24) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);

    const { data, error } = await this.db
      .from(this.tableName)
      .insert({
        user_id: userId,
        token,
        expires_at: expiresAt.toISOString(),
        used: false
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return data;
  }

  /**
   * Find valid token
   * @param {string} token - Reset token
   * @returns {Promise<Object|null>}
   */
  async findValidToken(token) {
    const { data, error } = await this.db
      .from(this.tableName)
      .select(`
        *,
        users:user_id (
          id,
          email,
          first_name,
          last_name
        )
      `)
      .eq('token', token)
      .eq('used', false)
      .gte('expires_at', new Date().toISOString())
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Database error: ${error.message}`);
    }

    return data;
  }

  /**
   * Mark token as used
   * @param {string} id - Reset ID
   * @returns {Promise<Object>}
   */
  async markAsUsed(id) {
    const { data, error } = await this.db
      .from(this.tableName)
      .update({ used: true })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return data;
  }

  /**
   * Invalidate all active tokens for a user
   * @param {string} userId - User ID
   * @returns {Promise<number>} Number of tokens invalidated
   */
  async invalidateUserTokens(userId) {
    const { data, error } = await this.db
      .from(this.tableName)
      .update({ used: true })
      .eq('user_id', userId)
      .eq('used', false)
      .select();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return data?.length || 0;
  }

  /**
   * Get active tokens count for a user
   * @param {string} userId - User ID
   * @returns {Promise<number>}
   */
  async getActiveTokensCount(userId) {
    const { count, error } = await this.db
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('used', false)
      .gte('expires_at', new Date().toISOString());

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return count || 0;
  }
}

module.exports = new PasswordResetRepository();
