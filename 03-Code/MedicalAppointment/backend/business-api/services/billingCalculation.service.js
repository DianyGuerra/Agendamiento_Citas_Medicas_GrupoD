/**
 * Billing Calculation Service
 * Business logic for calculating billing amounts, discounts, and totals
 * Uses CORRECT database schema: scheduled_start, status_id
 * consultation_fee is in specialties table, not doctors
 * 
 * @module business-api/services/BillingCalculationService
 */

const { supabase } = require('../../shared/config/database.config');
const { BusinessError, NotFoundError } = require('../../shared/errors');
const { BillingStatus, AppointmentStatus } = require('../../shared/constants/app.constants');

class BillingCalculationService {
  /**
   * Default base price if no other pricing is found
   */
  static DEFAULT_BASE_PRICE = 50.00;

  /**
   * Duration multipliers for different consultation lengths
   */
  static DURATION_MULTIPLIERS = {
    15: 0.5,  // Quick consultation
    30: 1.0,  // Standard
    45: 1.3,  // Extended
    60: 1.5   // Long consultation
  };

  /**
   * Calculate billing for an appointment
   * Pricing Priority:
   * 1. Specialty's consultation_fee (from DB)
   * 2. Default base price
   * 
   * @param {string} appointmentId - Appointment UUID
   * @returns {Promise<Object>} Calculated billing details
   */
  async calculateBilling(appointmentId) {
    // Get appointment with all related data - use correct schema
    const { data: appointment, error } = await supabase
      .from('appointments')
      .select(`
        *,
        doctors!appointments_doctor_id_fkey(
          id,
          specialties(
            id,
            name,
            consultation_fee
          )
        )
      `)
      .eq('id', appointmentId)
      .neq('status_id', AppointmentStatus.CANCELLED)
      .single();

    if (error || !appointment) {
      throw new NotFoundError('Cita', appointmentId);
    }

    // Get patient info separately to check for insurance
    const { data: patientData } = await supabase
      .from('patients')
      .select('insurance_plan, insurance_number')
      .eq('user_id', appointment.patient_user_id)
      .single();

    // Check if patient has insurance by looking up provider by plan name
    let insuranceProviderId = null;
    if (patientData?.insurance_plan) {
      const { data: provider } = await supabase
        .from('insurance_providers')
        .select('id')
        .ilike('name', `%${patientData.insurance_plan}%`)
        .eq('is_active', true)
        .single();
      insuranceProviderId = provider?.id;
    }

    const hasInsurance = !!insuranceProviderId;

    // Calculate duration from scheduled_start and scheduled_end
    let durationMinutes = 30; // default
    if (appointment.scheduled_start && appointment.scheduled_end) {
      const start = new Date(appointment.scheduled_start);
      const end = new Date(appointment.scheduled_end);
      durationMinutes = Math.round((end - start) / (1000 * 60));
    }

    // Calculate base amount using priority: doctor fee > specialty fee > default
    const baseAmount = this._calculateBaseAmount(appointment);
    const durationMultiplier = this._getDurationMultiplier(durationMinutes);
    
    // Get insurance discount from DB if patient has insurance
    const insuranceDiscount = hasInsurance 
      ? await this._getInsuranceDiscount(insuranceProviderId)
      : 0;

    // Calculate totals
    const subtotal = baseAmount * durationMultiplier;
    const insuranceDiscountAmount = (subtotal * insuranceDiscount) / 100;
    const totalAmount = subtotal - insuranceDiscountAmount;

    return {
      appointmentId,
      breakdown: {
        baseAmount,
        source: this._getPriceSource(appointment),
        durationMinutes,
        durationMultiplier,
        subtotal,
        insuranceDiscountPercentage: insuranceDiscount,
        insuranceDiscountAmount,
        additionalCharges: 0,
        totalAmount
      },
      hasInsurance,
      insuranceProviderId,
      specialtyName: appointment.doctors?.specialties?.name || 'General'
    };
  }

  /**
   * Generate billing record from calculation
   * @param {string} appointmentId - Appointment UUID
   * @returns {Promise<Object>} Created billing record
   */
  async generateBillingRecord(appointmentId) {
    const calculation = await this.calculateBilling(appointmentId);

    // Get appointment details
    const { data: appointment } = await supabase
      .from('appointments')
      .select(`
        patient_user_id,
        doctors!appointments_doctor_id_fkey(id)
      `)
      .eq('id', appointmentId)
      .single();

    // Generate invoice number
    const invoiceNumber = this._generateInvoiceNumber();

    // billings.status is varchar, not FK - use status string directly
    const status = this._getBillingStatus('pending');

    // Check if billing already exists for this appointment
    const { data: existingBilling } = await supabase
      .from('billings')
      .select('id')
      .eq('appointment_id', appointmentId)
      .single();

    if (existingBilling) {
      throw new BusinessError('Ya existe una factura para esta cita');
    }

    // Create billing record using correct schema
    // Note: billings table uses 'status' varchar column, NOT 'status_id'
    const { data: billing, error } = await supabase
      .from('billings')
      .insert({
        appointment_id: appointmentId,
        patient_user_id: appointment.patient_user_id,
        doctor_id: appointment.doctors?.id,
        invoice_number: invoiceNumber,
        subtotal: calculation.breakdown.subtotal,
        insurance_discount_amount: calculation.breakdown.insuranceDiscountAmount,
        insurance_discount_percentage: calculation.breakdown.insuranceDiscountPercentage,
        tax_amount: 0,
        total_amount: calculation.breakdown.totalAmount,
        base_amount: calculation.breakdown.baseAmount,
        duration_multiplier: calculation.breakdown.durationMultiplier,
        status: status,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    return billing;
  }

  /**
   * Process payment for a billing
   * @param {string} billingId - Billing UUID
   * @param {Object} paymentData - Payment details
   * @returns {Promise<Object>} Updated billing
   */
  async processPayment(billingId, paymentData) {
    const { payment_method, transaction_reference } = paymentData;

    // billings.status is varchar, not FK to billing_status
    const { data: billing, error: fetchError } = await supabase
      .from('billings')
      .select('*')
      .eq('id', billingId)
      .single();

    if (fetchError || !billing) {
      throw new NotFoundError('Factura', billingId);
    }

    if (billing.status === 'paid') {
      throw new BusinessError('Esta factura ya fue pagada');
    }

    const { data: updated, error } = await supabase
      .from('billings')
      .update({
        status: 'paid',
        payment_date: new Date().toISOString(),
        payment_method,
        updated_at: new Date().toISOString()
      })
      .eq('id', billingId)
      .select()
      .single();

    if (error) throw error;

    return updated;
  }

  /**
   * Apply insurance claim to billing
   * @param {string} billingId - Billing UUID
   * @param {Object} claimData - Insurance claim details
   * @returns {Promise<Object>} Updated billing with claim
   */
  async applyInsuranceClaim(billingId, claimData) {
    const { claim_number, approved_amount } = claimData;

    const { data: billing, error: fetchError } = await supabase
      .from('billings')
      .select('*')
      .eq('id', billingId)
      .single();

    if (fetchError || !billing) {
      throw new NotFoundError('Factura', billingId);
    }

    const patientResponsibility = Math.max(0, billing.total_amount - approved_amount);

    // Get status string based on patient responsibility
    // billings.status is varchar, not FK
    const newStatus = patientResponsibility === 0 ? 'paid' : billing.status;

    const { data: updated, error } = await supabase
      .from('billings')
      .update({
        notes: `Insurance claim: ${claim_number}, Approved: $${approved_amount}`,
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', billingId)
      .select()
      .single();

    if (error) throw error;

    return {
      ...updated,
      patientResponsibility,
      claimNumber: claim_number,
      approvedAmount: approved_amount
    };
  }

  /**
   * Get billing statistics
   * @param {Object} filters - Date range, doctor, status
   * @returns {Promise<Object>} Billing statistics
   */
  async getBillingStatistics(filters = {}) {
    const { startDate, endDate, doctorId } = filters;

    let query = supabase
      .from('billings')
      .select(`
        total_amount,
        created_at,
        status
      `);

    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    const stats = {
      totalBillings: data.length,
      totalRevenue: 0,
      paidAmount: 0,
      pendingAmount: 0,
      overdueAmount: 0,
      byStatus: {}
    };

    data.forEach(bill => {
      const statusCode = bill.status || 'unknown';
      stats.totalRevenue += parseFloat(bill.total_amount) || 0;
      
      if (!stats.byStatus[statusCode]) {
        stats.byStatus[statusCode] = { count: 0, amount: 0 };
      }
      stats.byStatus[statusCode].count++;
      stats.byStatus[statusCode].amount += parseFloat(bill.total_amount) || 0;

      switch (statusCode) {
        case 'paid':
          stats.paidAmount += parseFloat(bill.total_amount) || 0;
          break;
        case 'pending':
          stats.pendingAmount += parseFloat(bill.total_amount) || 0;
          break;
        case 'overdue':
          stats.overdueAmount += parseFloat(bill.total_amount) || 0;
          break;
      }
    });

    stats.collectionRate = stats.totalRevenue > 0 
      ? ((stats.paidAmount / stats.totalRevenue) * 100).toFixed(2)
      : 0;

    return stats;
  }

  /**
   * Get patient's billings
   * @param {string} userId - User UUID
   * @returns {Promise<Array>} List of billings
   */
  async getPatientBillings(userId) {
    const { data, error } = await supabase
      .from('billings')
      .select(`
        *,
        appointments!billings_appointment_id_fkey(
          id,
          scheduled_start,
          reason,
          doctors!appointments_doctor_id_fkey(
            id,
            users(first_name, last_name),
            specialties(name)
          )
        )
      `)
      .eq('patient_user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // La columna status es varchar directamente, no FK a billing_status
    // Map total_amount to amount for frontend compatibility
    return (data || []).map(bill => ({
      ...bill,
      amount: bill.total_amount || 0, // Frontend expects 'amount'
      status_code: bill.status,
      status_label: bill.status ? bill.status.charAt(0).toUpperCase() + bill.status.slice(1) : 'Pending',
      // Flatten doctor data for frontend
      doctor_first_name: bill.appointments?.doctors?.users?.first_name || '',
      doctor_last_name: bill.appointments?.doctors?.users?.last_name || '',
      specialty_name: bill.appointments?.doctors?.specialties?.name || ''
    }));
  }

  // ===== Private Methods =====

  /**
   * Calculate base amount with priority:
   * 1. Specialty's consultation_fee
   * 2. Default base price
   */
  _calculateBaseAmount(appointment) {
    // Priority 1: Specialty fee from database
    if (appointment.doctors?.specialties?.consultation_fee) {
      return parseFloat(appointment.doctors.specialties.consultation_fee);
    }
    
    // Priority 2: Default
    return BillingCalculationService.DEFAULT_BASE_PRICE;
  }

  /**
   * Get the source of the price for transparency
   */
  _getPriceSource(appointment) {
    if (appointment.doctors?.specialties?.consultation_fee) {
      return 'specialty';
    }
    return 'default';
  }

  /**
   * Get insurance discount from database by provider ID
   */
  async _getInsuranceDiscount(providerId) {
    if (!providerId) return 0;

    const { data } = await supabase
      .from('insurance_providers')
      .select('coverage_percentage')
      .eq('id', providerId)
      .eq('is_active', true)
      .single();

    return parseFloat(data?.coverage_percentage || 15); // Default 15% if not found
  }

  _getDurationMultiplier(durationMinutes) {
    if (!durationMinutes) return 1.0;
    
    const durations = Object.keys(BillingCalculationService.DURATION_MULTIPLIERS)
      .map(Number)
      .sort((a, b) => a - b);

    // Find closest duration
    for (const dur of durations) {
      if (durationMinutes <= dur) {
        return BillingCalculationService.DURATION_MULTIPLIERS[dur];
      }
    }

    // If longer than max, use 1.5x
    return 1.5;
  }

  _generateInvoiceNumber() {
    const prefix = 'INV';
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}-${dateStr}-${random}`;
  }

  /**
   * Get billing status string - billings.status is a varchar, not a FK
   * Valid values: 'pending', 'paid', 'cancelled', 'overdue'
   */
  _getBillingStatus(statusCode) {
    const validStatuses = ['pending', 'paid', 'cancelled', 'overdue'];
    return validStatuses.includes(statusCode) ? statusCode : 'pending';
  }
}

module.exports = new BillingCalculationService();
