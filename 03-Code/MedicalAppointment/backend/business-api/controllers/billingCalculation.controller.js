/**
 * Billing Calculation Controller
 * Handles HTTP requests for billing calculations
 * 
 * @module business-api/controllers/BillingCalculationController
 */

const billingCalculationService = require('../services/billingCalculation.service');
const ResponseBuilder = require('../../shared/utils/responseBuilder.utils');
const { asyncHandler } = require('../../shared/middleware/errorHandler.middleware');
const { ValidationError } = require('../../shared/errors');

class BillingCalculationController {
  /**
   * GET /billing-calculations/calculate/:appointmentId
   * Calculate billing for an appointment
   */
  calculateBilling = asyncHandler(async (req, res) => {
    const { appointmentId } = req.params;

    const calculation = await billingCalculationService.calculateBilling(appointmentId);

    return ResponseBuilder.success(res, calculation);
  });

  /**
   * POST /billing-calculations/generate/:appointmentId
   * Generate billing record from calculation
   */
  generateBilling = asyncHandler(async (req, res) => {
    const { appointmentId } = req.params;

    const billing = await billingCalculationService.generateBillingRecord(appointmentId);

    return ResponseBuilder.created(res, billing, 'Factura generada exitosamente');
  });

  /**
   * POST /billing-calculations/payment/:billingId
   * Process payment for a billing
   */
  processPayment = asyncHandler(async (req, res) => {
    const { billingId } = req.params;
    const { payment_method, transaction_reference } = req.body;

    if (!payment_method) {
      throw new ValidationError('payment_method es requerido');
    }

    const billing = await billingCalculationService.processPayment(billingId, {
      payment_method,
      transaction_reference
    });

    return ResponseBuilder.success(res, billing, 200, 'Pago procesado exitosamente');
  });

  /**
   * POST /billing-calculations/insurance-claim/:billingId
   * Apply insurance claim to billing
   */
  applyInsuranceClaim = asyncHandler(async (req, res) => {
    const { billingId } = req.params;
    const { claim_number, approved_amount } = req.body;

    if (!claim_number || approved_amount === undefined) {
      throw new ValidationError('claim_number y approved_amount son requeridos');
    }

    const billing = await billingCalculationService.applyInsuranceClaim(billingId, {
      claim_number,
      approved_amount
    });

    return ResponseBuilder.success(res, billing, 200, 'Reclamo de seguro aplicado');
  });

  /**
   * GET /billing-calculations/statistics
   * Get billing statistics
   */
  getStatistics = asyncHandler(async (req, res) => {
    const { startDate, endDate, doctorId } = req.query;

    const statistics = await billingCalculationService.getBillingStatistics({
      startDate,
      endDate,
      doctorId
    });

    return ResponseBuilder.success(res, statistics);
  });

  /**
   * GET /billing-calculations/my-billings
   * Get current patient's billings
   */
  getMyBillings = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const billings = await billingCalculationService.getPatientBillings(userId);

    return ResponseBuilder.success(res, billings);
  });
}

module.exports = new BillingCalculationController();
