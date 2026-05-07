/**
 * Billing Item Repository
 * Data access layer for Billing Line Items
 * 
 * @module crud-api/repositories/BillingItemRepository
 */

const BaseRepository = require('../../shared/repositories/BaseRepository');

class BillingItemRepository extends BaseRepository {
  constructor() {
    super('billing_items');
  }

  /**
   * Find items by billing ID
   * @param {string} billingId - Billing UUID
   * @returns {Promise<Array>}
   */
  async findByBilling(billingId) {
    const { data, error } = await this.db
      .from(this.tableName)
      .select(`
        *,
        service:medical_services(id, name, category),
        added_by:users!added_by_user_id(id, first_name, last_name)
      `)
      .eq('billing_id', billingId)
      .order('created_at');

    if (error) throw error;
    return data || [];
  }

  /**
   * Add item to billing
   * @param {Object} itemData - Item data
   * @returns {Promise<Object>}
   */
  async addItem(itemData) {
    const { data, error } = await this.db
      .from(this.tableName)
      .insert({
        billing_id: itemData.billing_id,
        service_id: itemData.service_id || null,
        description: itemData.description,
        quantity: itemData.quantity || 1,
        unit_price: itemData.unit_price,
        discount_percentage: itemData.discount_percentage || 0,
        total_price: this._calculateTotal(itemData),
        added_by_user_id: itemData.added_by_user_id,
        notes: itemData.notes
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Remove item from billing
   * @param {string} itemId - Item UUID
   * @returns {Promise<boolean>}
   */
  async removeItem(itemId) {
    const { error } = await this.db
      .from(this.tableName)
      .delete()
      .eq('id', itemId);

    if (error) throw error;
    return true;
  }

  /**
   * Calculate billing total from items
   * @param {string} billingId - Billing UUID
   * @returns {Promise<number>}
   */
  async calculateBillingTotal(billingId) {
    const items = await this.findByBilling(billingId);
    return items.reduce((sum, item) => sum + parseFloat(item.total_price || 0), 0);
  }

  /**
   * Calculate item total
   * @private
   */
  _calculateTotal(item) {
    const subtotal = (item.quantity || 1) * item.unit_price;
    const discount = subtotal * ((item.discount_percentage || 0) / 100);
    return subtotal - discount;
  }
}

module.exports = new BillingItemRepository();
