/**
 * Base Repository Interface
 * Abstract class defining common repository operations
 * Implements Repository Pattern for data access abstraction
 * 
 * @module shared/repositories/BaseRepository
 */

const { supabase } = require('../config/database.config');
const { NotFoundError } = require('../errors');

class BaseRepository {
  /**
   * @param {string} tableName - Database table name
   */
  constructor(tableName) {
    if (new.target === BaseRepository) {
      throw new Error('BaseRepository is abstract and cannot be instantiated directly');
    }
    this.tableName = tableName;
    this.db = supabase;
  }

  /**
   * Find a record by ID
   * @param {string} id - Record ID
   * @param {string} [select='*'] - Fields to select
   * @returns {Promise<Object|null>}
   */
  async findById(id, select = '*') {
    const { data, error } = await this.db
      .from(this.tableName)
      .select(select)
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Database error: ${error.message}`);
    }

    return data;
  }

  /**
   * Find a record by ID or throw NotFoundError
   * @param {string} id - Record ID
   * @param {string} [select='*'] - Fields to select
   * @returns {Promise<Object>}
   * @throws {NotFoundError}
   */
  async findByIdOrFail(id, select = '*') {
    const record = await this.findById(id, select);
    if (!record) {
      throw new NotFoundError(this.tableName, id);
    }
    return record;
  }

  /**
   * Find all records with optional filters
   * @param {Object} [options={}] - Query options
   * @param {Object} [options.filters] - Filter conditions
   * @param {string} [options.select='*'] - Fields to select
   * @param {string} [options.orderBy='created_at'] - Order by field
   * @param {boolean} [options.ascending=false] - Ascending order
   * @param {number} [options.limit] - Limit results
   * @param {number} [options.offset] - Offset for pagination
   * @returns {Promise<Array>}
   */
  async findAll(options = {}) {
    const {
      filters = {},
      select = '*',
      orderBy = 'created_at',
      ascending = false,
      limit,
      offset
    } = options;

    let query = this.db.from(this.tableName).select(select);

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value);
      }
    });

    // Apply soft delete filter by default
    if (this.hasSoftDelete()) {
      query = query.eq('is_deleted', false);
    }

    // Apply ordering
    query = query.order(orderBy, { ascending });

    // Apply pagination
    if (limit) {
      query = query.limit(limit);
    }
    if (offset) {
      query = query.range(offset, offset + (limit || 20) - 1);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Create a new record
   * @param {Object} data - Record data
   * @param {string} [select='*'] - Fields to return
   * @returns {Promise<Object>}
   */
  async create(data, select = '*') {
    const { data: created, error } = await this.db
      .from(this.tableName)
      .insert([{
        ...data,
        created_at: new Date().toISOString()
      }])
      .select(select)
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return created;
  }

  /**
   * Update a record by ID
   * @param {string} id - Record ID
   * @param {Object} data - Update data
   * @param {string} [select='*'] - Fields to return
   * @returns {Promise<Object>}
   */
  async update(id, data, select = '*') {
    const { data: updated, error } = await this.db
      .from(this.tableName)
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(select)
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return updated;
  }

  /**
   * Soft delete a record by ID
   * @param {string} id - Record ID
   * @returns {Promise<boolean>}
   */
  async softDelete(id) {
    const { error } = await this.db
      .from(this.tableName)
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return true;
  }

  /**
   * Hard delete a record by ID (use with caution)
   * @param {string} id - Record ID
   * @returns {Promise<boolean>}
   */
  async hardDelete(id) {
    const { error } = await this.db
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return true;
  }

  /**
   * Check if table supports soft delete
   * Override in child classes
   * @returns {boolean}
   */
  hasSoftDelete() {
    return false;
  }

  /**
   * Count records with optional filters
   * @param {Object} [filters={}] - Filter conditions
   * @returns {Promise<number>}
   */
  async count(filters = {}) {
    let query = this.db
      .from(this.tableName)
      .select('*', { count: 'exact', head: true });

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value);
      }
    });

    if (this.hasSoftDelete()) {
      query = query.eq('is_deleted', false);
    }

    const { count, error } = await query;

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return count || 0;
  }

  /**
   * Check if a record exists
   * @param {Object} filters - Filter conditions
   * @returns {Promise<boolean>}
   */
  async exists(filters) {
    const count = await this.count(filters);
    return count > 0;
  }
}

module.exports = BaseRepository;
