/**
 * Prescription Renewal Controller
 * Handles HTTP requests for prescription renewal operations
 * 
 * @module crud-api/controllers/PrescriptionRenewalController
 */

const prescriptionRenewalRepository = require('../repositories/prescriptionRenewal.repository');
const prescriptionRepository = require('../repositories/prescription.repository');
const doctorRepository = require('../repositories/doctor.repository');
const ResponseBuilder = require('../../shared/utils/responseBuilder.utils');
const { asyncHandler } = require('../../shared/middleware/errorHandler.middleware');
const { NotFoundError, ValidationError, ConflictError } = require('../../shared/errors');
const { parsePaginationQuery, createPagination } = require('../../shared/utils/helpers.utils');
const emailService = require('../../external-api/services/email.service');
const { supabase } = require('../../shared/config/database.config');

class PrescriptionRenewalController {
  /**
   * POST /prescription-renewals
   * Request a prescription renewal (patient)
   */
  requestRenewal = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { prescription_id, reason, notes } = req.body;

    if (!prescription_id) {
      throw new ValidationError('prescription_id es requerido');
    }

    // Get the original prescription
    const prescription = await prescriptionRepository.findById(prescription_id);
    if (!prescription) {
      throw new NotFoundError('Receta', prescription_id);
    }

    // Verify the prescription belongs to this patient
    if (prescription.patient_user_id !== userId) {
      throw new ValidationError('No tienes permiso para solicitar renovación de esta receta');
    }

    // Check if there's already a pending renewal
    const hasPending = await prescriptionRenewalRepository.hasPendingRenewal(prescription_id, userId);
    if (hasPending) {
      throw new ConflictError('Ya existe una solicitud de renovación pendiente para esta receta');
    }

    console.log('[DEBUG] Creating renewal request:', { 
      prescription_id, 
      patient_user_id: userId, 
      doctor_id: prescription.doctor_id 
    });

    // Create the renewal request
    const renewal = await prescriptionRenewalRepository.createRenewalRequest({
      original_prescription_id: prescription_id,
      patient_user_id: userId,
      doctor_id: prescription.doctor_id,
      reason: reason || 'Solicitud de renovación de receta',
      notes: notes || ''
    });

    // Send email notification to doctor asynchronously
    this._notifyDoctorRenewalRequest(prescription, userId, reason).catch(err => {
      console.error('[RenewalRequest] Failed to send email to doctor:', err.message);
    });

    return ResponseBuilder.created(res, renewal, 'Solicitud de renovación enviada exitosamente');
  });

  /**
   * GET /prescription-renewals
   * Get renewals for current user (patient or doctor)
   */
  getMyRenewals = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const role = req.user.role;
    const { page, limit, offset } = parsePaginationQuery(req.query);
    const { status } = req.query;

    let renewals;

    if (role === 'doctor') {
      // Get doctor's ID
      const doctor = await doctorRepository.findByUserId(userId);
      console.log('[DEBUG] Doctor lookup for renewals:', { userId, doctorFound: !!doctor, doctorId: doctor?.id });
      
      if (!doctor) {
        throw new NotFoundError('Doctor');
      }

      renewals = await prescriptionRenewalRepository.findByDoctor(doctor.id, {
        limit,
        offset,
        status
      });
      
      console.log('[DEBUG] Renewals found for doctor:', { doctorId: doctor.id, count: renewals?.length || 0 });

      // Transform data
      renewals = (renewals || []).map(renewal => ({
        ...renewal,
        patient_name: renewal.users ? 
          `${renewal.users.first_name || ''} ${renewal.users.last_name || ''}`.trim() : 
          'Paciente',
        patient_first_name: renewal.users?.first_name || '',
        patient_last_name: renewal.users?.last_name || '',
        patient_email: renewal.users?.email || '',
        original_diagnosis: renewal.prescriptions?.diagnosis || '',
        original_medications: renewal.prescriptions?.medications || ''
      }));

    } else if (role === 'patient') {
      renewals = await prescriptionRenewalRepository.findByPatient(userId, {
        limit,
        offset,
        status
      });

      // Transform data
      renewals = (renewals || []).map(renewal => ({
        ...renewal,
        doctor_first_name: renewal.prescriptions?.doctors?.users?.first_name || '',
        doctor_last_name: renewal.prescriptions?.doctors?.users?.last_name || '',
        specialty_name: renewal.prescriptions?.doctors?.specialties?.name || '',
        original_diagnosis: renewal.prescriptions?.diagnosis || ''
      }));
    }

    const pagination = createPagination(renewals?.length || 0, page, limit);
    return ResponseBuilder.paginated(res, renewals || [], pagination);
  });

  /**
   * GET /prescription-renewals/pending-count
   * Get count of pending renewals for doctor
   */
  getPendingCount = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const role = req.user.role;

    if (role !== 'doctor') {
      return ResponseBuilder.success(res, { count: 0 });
    }

    const doctor = await doctorRepository.findByUserId(userId);
    if (!doctor) {
      return ResponseBuilder.success(res, { count: 0 });
    }

    const count = await prescriptionRenewalRepository.countPendingByDoctor(doctor.id);
    return ResponseBuilder.success(res, { count });
  });

  /**
   * GET /prescription-renewals/:id
   * Get renewal by ID
   */
  getById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const renewal = await prescriptionRenewalRepository.findByIdWithDetails(id);
    if (!renewal) {
      throw new NotFoundError('Solicitud de renovación', id);
    }

    return ResponseBuilder.success(res, renewal);
  });

  /**
   * PUT /prescription-renewals/:id/approve
   * Approve a renewal request and UPDATE existing prescription (doctor)
   */
  approveRenewal = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;
    const { doctor_response, modified_diagnosis, modified_duration } = req.body;

    // Get the renewal
    const renewal = await prescriptionRenewalRepository.findByIdWithDetails(id);
    if (!renewal) {
      throw new NotFoundError('Solicitud de renovación', id);
    }

    // Verify doctor owns this renewal
    const doctor = await doctorRepository.findByUserId(userId);
    if (!doctor || renewal.doctor_id !== doctor.id) {
      throw new ValidationError('No tienes permiso para aprobar esta solicitud');
    }

    if (renewal.status !== 'pending') {
      throw new ValidationError('Esta solicitud ya fue procesada');
    }

    // Get original prescription data
    const originalPrescription = renewal.prescriptions;
    const originalPrescriptionId = renewal.original_prescription_id;

    // Update the EXISTING prescription with new duration (and optional diagnosis modification)
    const updatedData = {
      duration: modified_duration || originalPrescription?.duration,
      diagnosis: modified_diagnosis || originalPrescription?.diagnosis,
      // Update the created_at to reset the prescription validity period
      created_at: new Date().toISOString()
    };

    console.log('[DEBUG] Updating prescription for renewal:', { 
      originalPrescriptionId, 
      updatedData 
    });

    // Update the existing prescription
    await prescriptionRepository.update(originalPrescriptionId, updatedData);

    // Update renewal status (no new_prescription_id since we updated the existing one)
    await prescriptionRenewalRepository.updateStatus(id, {
      status: 'approved',
      doctor_response: doctor_response || 'Receta renovada exitosamente'
    });

    // Get the updated prescription to return
    const updatedPrescription = await prescriptionRepository.findWithQR(originalPrescriptionId);

    // Send email notification to patient asynchronously
    this._notifyPatientRenewalApproved(renewal, doctor_response, modified_duration).catch(err => {
      console.error('[RenewalApproval] Failed to send email to patient:', err.message);
    });

    return ResponseBuilder.success(res, {
      renewal_id: id,
      prescription: updatedPrescription,
      message: 'Receta renovada exitosamente. La duración del tratamiento ha sido extendida.'
    });
  });

  /**
   * PUT /prescription-renewals/:id/reject
   * Reject a renewal request (doctor)
   */
  rejectRenewal = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;
    const { rejection_reason, doctor_response } = req.body;

    if (!rejection_reason) {
      throw new ValidationError('Debe proporcionar una razón para rechazar la solicitud');
    }

    // Get the renewal
    const renewal = await prescriptionRenewalRepository.findByIdWithDetails(id);
    if (!renewal) {
      throw new NotFoundError('Solicitud de renovación', id);
    }

    // Verify doctor owns this renewal
    const doctor = await doctorRepository.findByUserId(userId);
    if (!doctor || renewal.doctor_id !== doctor.id) {
      throw new ValidationError('No tienes permiso para rechazar esta solicitud');
    }

    if (renewal.status !== 'pending') {
      throw new ValidationError('Esta solicitud ya fue procesada');
    }

    // Update renewal status
    await prescriptionRenewalRepository.updateStatus(id, {
      status: 'rejected',
      doctor_response: doctor_response || '',
      rejection_reason: rejection_reason
    });

    // Send email notification to patient asynchronously
    this._notifyPatientRenewalRejected(renewal, rejection_reason).catch(err => {
      console.error('[RenewalRejection] Failed to send email to patient:', err.message);
    });

    return ResponseBuilder.success(res, {
      renewal_id: id,
      message: 'Solicitud de renovación rechazada'
    });
  });

  /**
   * DELETE /prescription-renewals/:id
   * Cancel a renewal request (patient)
   */
  cancelRenewal = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;

    const renewal = await prescriptionRenewalRepository.findById(id);
    if (!renewal) {
      throw new NotFoundError('Solicitud de renovación', id);
    }

    // Verify patient owns this renewal
    if (renewal.patient_user_id !== userId) {
      throw new ValidationError('No tienes permiso para cancelar esta solicitud');
    }

    if (renewal.status !== 'pending') {
      throw new ValidationError('Solo se pueden cancelar solicitudes pendientes');
    }

    await prescriptionRenewalRepository.updateStatus(id, {
      status: 'cancelled'
    });

    return ResponseBuilder.success(res, { message: 'Solicitud cancelada exitosamente' });
  });

  // ===== Private Email Methods =====

  /**
   * Notify doctor about a new renewal request
   * @private
   */
  async _notifyDoctorRenewalRequest(prescription, patientUserId, reason) {
    try {
      // Get patient info
      const { data: patient } = await supabase
        .from('users')
        .select('first_name, last_name')
        .eq('id', patientUserId)
        .single();

      // Get doctor info (doctor user's email, not prescription.doctor_id which is doctors table)
      const { data: doctorInfo } = await supabase
        .from('doctors')
        .select('users(email, first_name, last_name)')
        .eq('id', prescription.doctor_id)
        .single();

      if (!doctorInfo?.users?.email) {
        console.log('[RenewalRequest] No doctor email found, skipping notification');
        return;
      }

      await emailService.sendPrescriptionRenewalRequest({
        doctorEmail: doctorInfo.users.email,
        doctorName: `${doctorInfo.users.first_name} ${doctorInfo.users.last_name}`,
        patientName: `${patient?.first_name || ''} ${patient?.last_name || ''}`.trim() || 'Paciente',
        diagnosis: prescription.diagnosis,
        medications: prescription.medications,
        requestReason: reason
      });

      console.log(`[RenewalRequest] Email notification sent to doctor ${doctorInfo.users.email}`);
    } catch (error) {
      console.error('[RenewalRequest] Error sending doctor notification:', error.message);
    }
  }

  /**
   * Notify patient that their renewal was approved
   * @private
   */
  async _notifyPatientRenewalApproved(renewal, doctorResponse, newDuration) {
    try {
      // Get patient info
      const { data: patient } = await supabase
        .from('users')
        .select('email, first_name, last_name')
        .eq('id', renewal.patient_user_id)
        .single();

      if (!patient?.email) {
        console.log('[RenewalApproval] No patient email found, skipping notification');
        return;
      }

      // Get doctor info
      const { data: doctorInfo } = await supabase
        .from('doctors')
        .select('users(first_name, last_name)')
        .eq('id', renewal.doctor_id)
        .single();

      await emailService.sendPrescriptionRenewalApproved({
        patientEmail: patient.email,
        patientName: `${patient.first_name} ${patient.last_name}`,
        doctorName: `${doctorInfo?.users?.first_name || ''} ${doctorInfo?.users?.last_name || ''}`.trim() || 'Doctor',
        doctorResponse: doctorResponse,
        duration: newDuration
      });

      console.log(`[RenewalApproval] Email notification sent to patient ${patient.email}`);
    } catch (error) {
      console.error('[RenewalApproval] Error sending patient notification:', error.message);
    }
  }

  /**
   * Notify patient that their renewal was rejected
   * @private
   */
  async _notifyPatientRenewalRejected(renewal, rejectionReason) {
    try {
      // Get patient info
      const { data: patient } = await supabase
        .from('users')
        .select('email, first_name, last_name')
        .eq('id', renewal.patient_user_id)
        .single();

      if (!patient?.email) {
        console.log('[RenewalRejection] No patient email found, skipping notification');
        return;
      }

      // Get doctor info
      const { data: doctorInfo } = await supabase
        .from('doctors')
        .select('users(first_name, last_name)')
        .eq('id', renewal.doctor_id)
        .single();

      await emailService.sendPrescriptionRenewalRejected({
        patientEmail: patient.email,
        patientName: `${patient.first_name} ${patient.last_name}`,
        doctorName: `${doctorInfo?.users?.first_name || ''} ${doctorInfo?.users?.last_name || ''}`.trim() || 'Doctor',
        rejectionReason: rejectionReason
      });

      console.log(`[RenewalRejection] Email notification sent to patient ${patient.email}`);
    } catch (error) {
      console.error('[RenewalRejection] Error sending patient notification:', error.message);
    }
  }
}

module.exports = new PrescriptionRenewalController();
