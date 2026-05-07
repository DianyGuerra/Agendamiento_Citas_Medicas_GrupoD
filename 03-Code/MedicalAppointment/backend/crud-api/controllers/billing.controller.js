/**
 * Billing Controller
 * Handles HTTP requests for Billing CRUD operations
 * 
 * @module crud-api/controllers/BillingController
 */

const billingRepository = require('../repositories/billing.repository');
const appointmentRepository = require('../repositories/appointment.repository');
const doctorRepository = require('../repositories/doctor.repository');
const ResponseBuilder = require('../../shared/utils/responseBuilder.utils');
const { asyncHandler } = require('../../shared/middleware/errorHandler.middleware');
const { NotFoundError, ValidationError } = require('../../shared/errors');
const { parsePaginationQuery, createPagination } = require('../../shared/utils/helpers.utils');
const { createAuditLog, AuditActions } = require('../../shared/utils/audit.utils');

class BillingController {
  /**
   * GET /billings
   * Get billings with filters
   */
  getAll = asyncHandler(async (req, res) => {
    const { page, limit, offset } = parsePaginationQuery(req.query);
    const { patientId, doctorId, status, startDate, endDate } = req.query;
    const role = req.user.role;
    const userId = req.user.id;

    let billings;

    if (role === 'patient') {
      billings = await billingRepository.findByPatient(userId, { 
        status, 
        limit, 
        offset 
      });
    } else if (role === 'doctor') {
      const doctor = await doctorRepository.findByUserId(userId);
      if (!doctor) {
        throw new NotFoundError('Doctor');
      }
      billings = await billingRepository.findByDoctor(doctor.id, { 
        status, 
        startDate, 
        endDate, 
        limit, 
        offset 
      });
    } else {
      // Admin - can filter by any criteria
      billings = await billingRepository.findAll({
        filters: {
          patient_user_id: patientId,
          doctor_id: doctorId,
          status
        },
        limit,
        offset
      });
    }

    const pagination = createPagination(billings?.length || 0, page, limit);
    return ResponseBuilder.paginated(res, billings || [], pagination);
  });

  /**
   * GET /billings/:id
   * Get billing by ID
   */
  getById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const billing = await billingRepository.findWithDetails(id);
    
    if (!billing) {
      throw new NotFoundError('Factura', id);
    }

    return ResponseBuilder.success(res, billing);
  });

  /**
   * POST /billings
   * Create new billing
   */
  create = asyncHandler(async (req, res) => {
    const { 
      appointment_id, 
      patient_user_id, 
      doctor_id,
      base_amount,
      specialty_multiplier,
      duration_multiplier,
      insurance_discount_percentage,
      additional_charges,
      notes
    } = req.body;

    // Validate required fields
    if (!appointment_id || !patient_user_id || !doctor_id || !base_amount) {
      throw new ValidationError('appointment_id, patient_user_id, doctor_id y base_amount son requeridos');
    }

    // Check appointment exists
    const appointment = await appointmentRepository.findById(appointment_id);
    if (!appointment) {
      throw new NotFoundError('Cita', appointment_id);
    }

    // Check if billing already exists for this appointment
    const existingBilling = await billingRepository.findByAppointment(appointment_id);
    if (existingBilling) {
      throw new ValidationError('Ya existe una factura para esta cita');
    }

    // Calculate amounts
    const specialtyMult = specialty_multiplier || 1.00;
    const durationMult = duration_multiplier || 1.00;
    const insuranceDiscount = insurance_discount_percentage || 0;
    const additionalChrg = additional_charges || 0;

    const subtotal = base_amount * specialtyMult * durationMult;
    const insuranceDiscountAmount = (subtotal * insuranceDiscount) / 100;
    const totalAmount = subtotal - insuranceDiscountAmount + additionalChrg;

    const billing = await billingRepository.create({
      appointment_id,
      patient_user_id,
      doctor_id,
      base_amount,
      specialty_multiplier: specialtyMult,
      duration_multiplier: durationMult,
      insurance_discount_percentage: insuranceDiscount,
      insurance_discount_amount: insuranceDiscountAmount,
      additional_charges: additionalChrg,
      total_amount: totalAmount,
      status: 'pending',
      invoice_number: billingRepository.generateInvoiceNumber(),
      notes
    });

    // Audit log
    createAuditLog({
      userId: req.user.id,
      action: AuditActions.BILLING_CREATED,
      tableName: 'billings',
      recordId: billing.id,
      newValues: { invoice_number: billing.invoice_number, total_amount: totalAmount, patient_user_id },
      description: `Factura ${billing.invoice_number} creada por $${totalAmount.toFixed(2)}`,
      req
    });

    return ResponseBuilder.created(res, billing, 'Factura creada exitosamente');
  });

  /**
   * PATCH /billings/:id/status
   * Update billing status
   */
  updateStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, payment_date } = req.body;

    if (!status) {
      throw new ValidationError('status es requerido');
    }

    const existing = await billingRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Factura', id);
    }

    const updated = await billingRepository.updateStatus(id, status, payment_date);

    // Audit log
    createAuditLog({
      userId: req.user.id,
      action: AuditActions.BILLING_STATUS_CHANGED,
      tableName: 'billings',
      recordId: id,
      oldValues: { status: existing.status },
      newValues: { status, payment_date },
      description: `Estado de factura ${existing.invoice_number} cambiado a ${status}`,
      req
    });

    return ResponseBuilder.success(res, updated, 200, 'Estado de factura actualizado');
  });

  /**
   * DELETE /billings/:id
   * Cancel billing (soft delete)
   */
  delete = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const existing = await billingRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Factura', id);
    }

    await billingRepository.softDelete(id);

    // Audit log
    createAuditLog({
      userId: req.user.id,
      action: AuditActions.BILLING_CANCELLED,
      tableName: 'billings',
      recordId: id,
      oldValues: { status: existing.status, invoice_number: existing.invoice_number },
      newValues: { cancelled: true },
      description: `Factura ${existing.invoice_number} cancelada`,
      req
    });

    return ResponseBuilder.success(res, { id }, 200, 'Factura cancelada exitosamente');
  });
}

module.exports = new BillingController();
