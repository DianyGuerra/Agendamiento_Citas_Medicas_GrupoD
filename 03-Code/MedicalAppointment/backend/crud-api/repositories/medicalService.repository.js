/**
 * Medical Service Repository
 * Data access layer for Medical Services catalog
 * 
 * @module crud-api/repositories/MedicalServiceRepository
 */

const BaseRepository = require('../../shared/repositories/BaseRepository');

class MedicalServiceRepository extends BaseRepository {
  constructor() {
    super('medical_services');
  }

  /**
   * Find services by specialty
   * @param {string} specialtyId - Specialty UUID
   * @returns {Promise<Array>}
   */
  async findBySpecialty(specialtyId) {
    const { data, error } = await this.db
      .from(this.tableName)
      .select(`
        *,
        specialty:specialties(id, name)
      `)
      .eq('specialty_id', specialtyId)
      .eq('is_active', true)
      .order('category')
      .order('name');

    if (error) throw error;
    return data || [];
  }

  /**
   * Find services by category
   * @param {string} category - Service category
   * @returns {Promise<Array>}
   */
  async findByCategory(category) {
    const { data, error } = await this.db
      .from(this.tableName)
      .select('*')
      .eq('category', category)
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return data || [];
  }

  /**
   * Find all active services with specialty info
   * @returns {Promise<Array>}
   */
  async findAllWithDetails() {
    const { data, error } = await this.db
      .from(this.tableName)
      .select(`
        *,
        specialty:specialties(id, name)
      `)
      .eq('is_active', true)
      .order('category')
      .order('name');

    if (error) throw error;
    return data || [];
  }

  /**
   * Get distinct categories
   * @returns {Promise<Array<string>>}
   */
  async getCategories() {
    const { data, error } = await this.db
      .from(this.tableName)
      .select('category')
      .eq('is_active', true);

    if (error) throw error;
    
    const categories = [...new Set(data.map(d => d.category))];
    return categories.sort((a, b) => a.localeCompare(b));
  }
}

module.exports = new MedicalServiceRepository();
