/**
 * Insurance Provider Repository
 * Data access layer for Insurance Providers
 * 
 * @module crud-api/repositories/InsuranceProviderRepository
 */

const BaseRepository = require('../../shared/repositories/BaseRepository');

class InsuranceProviderRepository extends BaseRepository {
  constructor() {
    super('insurance_providers');
  }

  /**
   * Find by code
   * @param {string} code - Provider code
   * @returns {Promise<Object|null>}
   */
  async findByCode(code) {
    const { data, error } = await this.db
      .from(this.tableName)
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  /**
   * Find all active providers
   * @returns {Promise<Array>}
   */
  async findAllActive() {
    const { data, error } = await this.db
      .from(this.tableName)
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return data || [];
  }

  /**
   * Get discount rate for provider
   * @param {string} providerId - Provider UUID
   * @returns {Promise<number>}
   */
  async getDiscountRate(providerId) {
    const { data, error } = await this.db
      .from(this.tableName)
      .select('discount_percentage')
      .eq('id', providerId)
      .single();

    if (error) return 0;
    return Number.parseFloat(data?.discount_percentage || 0);
  }
}

module.exports = new InsuranceProviderRepository();
