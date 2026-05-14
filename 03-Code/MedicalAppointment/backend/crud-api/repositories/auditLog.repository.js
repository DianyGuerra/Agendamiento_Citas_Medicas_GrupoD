/**
 * Audit Log Repository
 * Data access layer for Audit Log entity
 * 
 * @module crud-api/repositories/AuditLogRepository
 */

const BaseRepository = require('../../shared/repositories/BaseRepository');

class AuditLogRepository extends BaseRepository {
  constructor() {
    super('audit_logs');
  }

  /**
   * Find all audit logs with user details and pagination
   * @param {Object} options - Query options
   * @returns {Promise<Array>}
   */
  async findAllWithDetails(options = {}) {
    const { limit = 50, offset = 0, userId, action, tableName, startDate, endDate } = options;

    let query = this.db
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
      .order('timestamp', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (action) {
      query = query.ilike('action', `%${action}%`);
    }

    if (tableName) {
      query = query.eq('table_name', tableName);
    }

    if (startDate) {
      query = query.gte('timestamp', startDate);
    }

    if (endDate) {
      query = query.lte('timestamp', endDate);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Find audit logs by user ID
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>}
   */
  async findByUserId(userId, options = {}) {
    const { limit = 50, offset = 0 } = options;

    const { data, error } = await this.db
      .from(this.tableName)
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Create audit log entry
   * @param {Object} logData - Audit log data
   * @returns {Promise<Object>}
   */
  async createLog(logData) {
    const { data, error } = await this.db
      .from(this.tableName)
      .insert({
        user_id: logData.user_id,
        action: logData.action,
        table_name: logData.table_name,
        record_id: logData.record_id,
        old_values: logData.old_values || null,
        new_values: logData.new_values || null,
        description: logData.description,
        ip_address: logData.ip_address,
        user_agent: logData.user_agent,
        timestamp: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return data;
  }

  /**
   * Get count with filters
   * @param {Object} filters - Query filters
   * @returns {Promise<number>}
   */
  async countWithFilters(filters = {}) {
    let query = this.db
      .from(this.tableName)
      .select('*', { count: 'exact', head: true });

    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }

    if (filters.action) {
      query = query.ilike('action', `%${filters.action}%`);
    }

    if (filters.tableName) {
      query = query.eq('table_name', filters.tableName);
    }

    const { count, error } = await query;

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return count || 0;
  }

  /**
   * Get distinct table names for filter dropdown
   * @returns {Promise<Array<string>>}
   */
  async getDistinctTableNames() {
    const { data, error } = await this.db
      .from(this.tableName)
      .select('table_name')
      .not('table_name', 'is', null);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    // Get unique values
    const uniqueTables = [...new Set(data.map(d => d.table_name))].sort((a, b) => a.localeCompare(b));
    return uniqueTables;
  }

  /**
   * Get distinct actions for filter dropdown
   * @returns {Promise<Array<string>>}
   */
  async getDistinctActions() {
    const { data, error } = await this.db
      .from(this.tableName)
      .select('action')
      .not('action', 'is', null);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    const uniqueActions = [...new Set(data.map(d => d.action))].sort((a, b) => a.localeCompare(b));
    return uniqueActions;
  }
}

module.exports = new AuditLogRepository();
