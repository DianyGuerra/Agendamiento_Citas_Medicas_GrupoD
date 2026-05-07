/**
 * Billing Item Controller
 * Handles operations for billing line items
 * 
 * @module crud-api/controllers/BillingItemController
 */

const billingItemRepository = require('../repositories/billingItem.repository');
const billingRepository = require('../repositories/billing.repository');
const ResponseBuilder = require('../../shared/utils/responseBuilder.utils');
const { asyncHandler } = require('../../shared/middleware/errorHandler.middleware');
const { NotFoundError, ValidationError } = require('../../shared/errors');

class BillingItemController {
  /**
   * GET /billing-items/billing/:billingId
   * Get all items for a billing
   */
  getByBilling = asyncHandler(async (req, res) => {
    const { billingId } = req.params;
    const items = await billingItemRepository.findByBilling(billingId);
    return ResponseBuilder.success(res, items);
  });

  /**
   * POST /billing-items
   * Add item to billing
   */
  addItem = asyncHandler(async (req, res) => {
    const { billing_id, service_id, description, quantity, unit_price, discount_percentage, notes } = req.body;

    if (!billing_id || !description || unit_price === undefined) {
      throw new ValidationError('billing_id, description y unit_price son requeridos');
    }

    // Verify billing exists
    const billing = await billingRepository.findById(billing_id);
    if (!billing) {
      throw new NotFoundError('Factura', billing_id);
    }

    const item = await billingItemRepository.addItem({
      billing_id,
      service_id,
      description,
      quantity: quantity || 1,
      unit_price,
      discount_percentage: discount_percentage || 0,
      added_by_user_id: req.user.id,
      notes
    });

    // Recalculate billing total
    await this._updateBillingTotal(billing_id);

    return ResponseBuilder.created(res, item, 'Item agregado a la factura');
  });

  /**
   * DELETE /billing-items/:id
   * Remove item from billing
   */
  removeItem = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const item = await billingItemRepository.findById(id);
    if (!item) {
      throw new NotFoundError('Item de factura', id);
    }

    const billingId = item.billing_id;
    await billingItemRepository.removeItem(id);

    // Recalculate billing total
    await this._updateBillingTotal(billingId);

    return ResponseBuilder.success(res, null, 200, 'Item eliminado');
  });

  /**
   * Update billing total after item changes
   * @private
   */
  async _updateBillingTotal(billingId) {
    const newTotal = await billingItemRepository.calculateBillingTotal(billingId);
    await billingRepository.update(billingId, { 
      total_amount: newTotal,
      subtotal: newTotal 
    });
  }
}

module.exports = new BillingItemController();
