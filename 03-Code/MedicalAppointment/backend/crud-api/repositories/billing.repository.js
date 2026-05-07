/**
 * Billing Repository
 * Data access layer for Billing entity
 * 
 * @module crud-api/repositories/BillingRepository
 */

const BaseRepository = require('../../shared/repositories/BaseRepository');
const { BillingStatus } = require('../../shared/constants/app.constants');

class BillingRepository extends BaseRepository {
  constructor() {
    super('billings');
  }

  /**
   * Find all billings with patient info
   * @param {Object} options - Query options
   * @returns {Promise<Array>}
   */
  async findAll(options = {}) {
    const { status, limit, offset, filters = {} } = options;

    let query = this.db
      .from(this.tableName)
      .select(`
        *,
        patient:users!billings_patient_user_id_fkey (
          id,
          first_name,
          last_name,
          email
        ),
        doctor:doctors (
          users (
            first_name,
            last_name
          )
        )
      `)
      .order('created_at', { ascending: false });

    // Apply status filter from options or filters object
    const statusValue = status || filters.status;
    if (statusValue) {
      query = query.eq('status', statusValue);
    }

    // Apply other filters
    if (filters.patient_user_id) {
      query = query.eq('patient_user_id', filters.patient_user_id);
    }
    if (filters.doctor_id) {
      query = query.eq('doctor_id', filters.doctor_id);
    }

    if (limit) query = query.limit(limit);
    if (offset) query = query.range(offset, offset + (limit || 20) - 1);

    const { data, error } = await query;

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Find billing with full details
   * @param {string} id - Billing ID
   * @returns {Promise<Object|null>}
   */
  async findWithDetails(id) {
    const { data, error } = await this.db
      .from(this.tableName)
      .select(`
        *,
        appointment:appointments (
          id,
          scheduled_start,
          reason
        ),
        patient:patient_user_id (
          id,
          first_name,
          last_name,
          email
        ),
        doctor:doctors (
          id,
          professional_id,
          users (
            first_name,
            last_name
          ),
          specialties (
            name
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Database error: ${error.message}`);
    }

    return data;
  }

  /**
   * Find billing by appointment
   * @param {string} appointmentId - Appointment ID
   * @returns {Promise<Object|null>}
   */
  async findByAppointment(appointmentId) {
    const { data, error } = await this.db
      .from(this.tableName)
      .select('*')
      .eq('appointment_id', appointmentId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Database error: ${error.message}`);
    }

    return data;
  }

  /**
   * Find billings by patient
   * @param {string} patientUserId - Patient user ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>}
   */
  async findByPatient(patientUserId, options = {}) {
    const { status, limit, offset } = options;

    let query = this.db
      .from(this.tableName)
      .select(`
        *,
        appointment:appointments (
          id,
          scheduled_start
        ),
        doctor:doctors (
          users (
            first_name,
            last_name
          )
        )
      `)
      .eq('patient_user_id', patientUserId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (limit) query = query.limit(limit);
    if (offset) query = query.range(offset, offset + (limit || 20) - 1);

    const { data, error } = await query;

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Find billings by doctor
   * @param {string} doctorId - Doctor ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>}
   */
  async findByDoctor(doctorId, options = {}) {
    const { status, startDate, endDate, limit, offset } = options;

    let query = this.db
      .from(this.tableName)
      .select(`
        *,
        appointment:appointments (
          id,
          scheduled_start
        ),
        patient:patient_user_id (
          first_name,
          last_name,
          email
        )
      `)
      .eq('doctor_id', doctorId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (startDate) {
      query = query.gte('created_at', `${startDate}T00:00:00Z`);
    }

    if (endDate) {
      query = query.lte('created_at', `${endDate}T23:59:59Z`);
    }

    if (limit) query = query.limit(limit);
    if (offset) query = query.range(offset, offset + (limit || 20) - 1);

    const { data, error } = await query;

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Update billing status
   * @param {string} id - Billing ID
   * @param {string} status - New status
   * @param {string} [paymentDate] - Payment date (for paid status)
   * @returns {Promise<Object>}
   */
  async updateStatus(id, status, paymentDate = null) {
    const updateData = { status };
    
    if (status === BillingStatus.PAID && paymentDate) {
      updateData.payment_date = paymentDate;
    }

    return this.update(id, updateData);
  }

  /**
   * Generate invoice number
   * @returns {string}
   */
  generateInvoiceNumber() {
    const year = new Date().getFullYear();
    const timestamp = Date.now().toString().slice(-6);
    return `INV-${year}-${timestamp}`;
  }

  /**
   * Soft delete (cancel billing)
   * @param {string} id - Billing ID
   * @returns {Promise<boolean>}
   */
  async softDelete(id) {
    await this.updateStatus(id, BillingStatus.CANCELLED);
    return true;
  }

  hasSoftDelete() {
    return false; // Uses status field
  }
}

module.exports = new BillingRepository();
