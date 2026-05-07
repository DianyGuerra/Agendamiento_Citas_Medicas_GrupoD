/**
 * Consultation Room Repository
 * Data access layer for Consultation Room entity
 * 
 * @module crud-api/repositories/ConsultationRoomRepository
 */

const BaseRepository = require('../../shared/repositories/BaseRepository');

class ConsultationRoomRepository extends BaseRepository {
  constructor() {
    super('consultation_rooms');
  }

  /**
   * Find all active rooms
   * @returns {Promise<Array>}
   */
  async findAllActive() {
    const { data, error } = await this.db
      .from(this.tableName)
      .select('*')
      .eq('is_available', true)
      .order('room_number', { ascending: true });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Find available room
   * @returns {Promise<Object|null>}
   */
  async findAvailable() {
    const { data, error } = await this.db
      .from(this.tableName)
      .select('*')
      .eq('is_available', true)
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Database error: ${error.message}`);
    }

    return data;
  }

  /**
   * Find room by number
   * @param {string} roomNumber - Room number
   * @returns {Promise<Object|null>}
   */
  async findByNumber(roomNumber) {
    const { data, error } = await this.db
      .from(this.tableName)
      .select('*')
      .eq('room_number', roomNumber)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Database error: ${error.message}`);
    }

    return data;
  }

  /**
   * Update room availability
   * @param {string} id - Room ID
   * @param {boolean} isAvailable - Availability status
   * @returns {Promise<Object>}
   */
  async updateAvailability(id, isAvailable) {
    return this.update(id, { is_available: isAvailable });
  }

  /**
   * Soft delete (make unavailable)
   * @param {string} id - Room ID
   * @returns {Promise<boolean>}
   */
  async softDelete(id) {
    await this.updateAvailability(id, false);
    return true;
  }

  hasSoftDelete() {
    return false; // Uses is_available field
  }
}

module.exports = new ConsultationRoomRepository();
