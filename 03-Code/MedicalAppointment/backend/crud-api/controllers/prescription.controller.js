/**
 * Prescription Controller
 * Handles HTTP requests for Prescription CRUD operations
 * 
 * @module crud-api/controllers/PrescriptionController
 */

const prescriptionRepository = require('../repositories/prescription.repository');
const doctorRepository = require('../repositories/doctor.repository');
const ResponseBuilder = require('../../shared/utils/responseBuilder.utils');
const { asyncHandler } = require('../../shared/middleware/errorHandler.middleware');
const { NotFoundError, ValidationError } = require('../../shared/errors');
const { parsePaginationQuery, createPagination } = require('../../shared/utils/helpers.utils');
const qrCodeService = require('../../external-api/services/qrCode.service');
const { createAuditLog, AuditActions } = require('../../shared/utils/audit.utils');

class PrescriptionController {
  /**
   * GET /prescriptions
   * Get prescriptions for current user
   */
  getByUser = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const role = req.user.role;
    const { page, limit, offset } = parsePaginationQuery(req.query);
    const { patientId, activeOnly } = req.query;

    let prescriptions;

    if (role === 'doctor') {
      const doctor = await doctorRepository.findByUserId(userId);
      if (!doctor) {
        throw new NotFoundError('Doctor');
      }
      prescriptions = await prescriptionRepository.findByDoctor(doctor.id, { 
        limit, 
        offset,
        patientId
      });
      
      // Transform nested data to flat structure for frontend
      prescriptions = (prescriptions || []).map(prescription => {
        // Get QR data - may be object or array depending on Supabase join
        const qrCodes = prescription.prescription_qr_codes;
        const qrData = Array.isArray(qrCodes) ? qrCodes[0] : qrCodes;
        
        console.log(`[DEBUG] Prescription ${prescription.id} - QR data:`, qrData ? 'exists' : 'null');
        
        return {
          ...prescription,
          patient_first_name: prescription.patient?.first_name || '',
          patient_last_name: prescription.patient?.last_name || '',
          patient_name: prescription.patient 
            ? `${prescription.patient.first_name || ''} ${prescription.patient.last_name || ''}`.trim()
            : 'Paciente',
          patient_email: prescription.patient?.email || '',
          // QR fields flattened
          qr_token: qrData?.qr_token || null,
          qr_url: qrData?.qr_image || null,
          qr_image: qrData?.qr_image || null,
          verification_url: qrData?.verification_url || null,
          has_qr: !!(qrData && qrData.qr_image)
        };
      });
    } else if (role === 'patient') {
      prescriptions = await prescriptionRepository.findByPatient(userId, { 
        limit, 
        offset,
        activeOnly: activeOnly === 'true'
      });
      
      // Transform nested data to flat structure for frontend
      prescriptions = (prescriptions || []).map(prescription => {
        // Get QR data - may be object or array depending on Supabase join
        const qrCodes = prescription.prescription_qr_codes;
        const qrData = Array.isArray(qrCodes) ? qrCodes[0] : qrCodes;
        
        return {
          ...prescription,
          doctor_first_name: prescription.doctors?.users?.first_name || '',
          doctor_last_name: prescription.doctors?.users?.last_name || '',
          specialty_name: prescription.doctors?.specialties?.name || '',
          // QR fields flattened
          qr_token: qrData?.qr_token || null,
          qr_url: qrData?.qr_image || null,
          qr_image: qrData?.qr_image || null,
          verification_url: qrData?.verification_url || null,
          has_qr: !!(qrData && qrData.qr_image)
        };
      });
    }

    const pagination = createPagination(prescriptions?.length || 0, page, limit);
    return ResponseBuilder.paginated(res, prescriptions || [], pagination);
  });

  /**
   * GET /prescriptions/:id
   * Get prescription by ID
   */
  getById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    let prescription = await prescriptionRepository.findWithQR(id);
    
    if (!prescription) {
      throw new NotFoundError('Receta', id);
    }

    // Transform nested data to flat structure for frontend
    prescription = {
      ...prescription,
      doctor_first_name: prescription.doctors?.users?.first_name || '',
      doctor_last_name: prescription.doctors?.users?.last_name || '',
      specialty_name: prescription.doctors?.specialties?.name || ''
    };

    return ResponseBuilder.success(res, prescription);
  });

  /**
   * POST /prescriptions
   * Create new prescription (doctor)
   */
  create = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { 
      patient_user_id, 
      diagnosis, 
      medications,
      instructions,
      duration
    } = req.body;

    // Validate required fields
    if (!patient_user_id || !medications) {
      throw new ValidationError('patient_user_id y medications son requeridos');
    }

    // Get doctor
    const doctor = await doctorRepository.findByUserId(userId);
    if (!doctor) {
      throw new NotFoundError('Doctor');
    }

    // Note: prescriptions table does NOT have is_active column
    const prescription = await prescriptionRepository.create({
      patient_user_id,
      doctor_id: doctor.id,
      diagnosis,
      medications,
      instructions,
      duration
    });

    // Generate QR code for the prescription
    try {
      await qrCodeService.generatePrescriptionQR(prescription.id);
      console.log(`QR code generated for prescription ${prescription.id}`);
    } catch (qrError) {
      // Log error but don't fail prescription creation
      console.error(`Failed to generate QR for prescription ${prescription.id}:`, qrError);
    }

    // Audit log
    createAuditLog({
      userId: req.user.id,
      action: AuditActions.PRESCRIPTION_CREATED,
      tableName: 'prescriptions',
      recordId: prescription.id,
      newValues: { patient_user_id, doctor_id: doctor.id, diagnosis, medications_count: medications?.length },
      description: `Receta creada para paciente con ${medications?.length || 0} medicamentos`,
      req
    });

    return ResponseBuilder.created(res, prescription, 'Receta creada exitosamente');
  });

  /**
   * PUT /prescriptions/:id
   * Update prescription (doctor)
   */
  update = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { 
      diagnosis, 
      medications,
      instructions,
      duration
    } = req.body;

    const existing = await prescriptionRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Receta', id);
    }

    const updated = await prescriptionRepository.update(id, {
      diagnosis,
      medications,
      instructions,
      duration
    });

    // Audit log
    createAuditLog({
      userId: req.user.id,
      action: AuditActions.PRESCRIPTION_UPDATED,
      tableName: 'prescriptions',
      recordId: id,
      oldValues: { diagnosis: existing.diagnosis },
      newValues: { diagnosis, medications, instructions, duration },
      description: `Receta ${id} actualizada`,
      req
    });

    return ResponseBuilder.success(res, updated, 200, 'Receta actualizada exitosamente');
  });

  /**
   * DELETE /prescriptions/:id
   * Soft delete prescription (deactivate)
   */
  delete = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const existing = await prescriptionRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Receta', id);
    }

    await prescriptionRepository.softDelete(id);

    // Audit log
    createAuditLog({
      userId: req.user.id,
      action: AuditActions.PRESCRIPTION_CANCELLED,
      tableName: 'prescriptions',
      recordId: id,
      oldValues: { patient_user_id: existing.patient_user_id },
      newValues: { cancelled: true },
      description: `Receta ${id} desactivada`,
      req
    });

    return ResponseBuilder.success(res, { id }, 200, 'Receta desactivada exitosamente');
  });

  /**
   * GET /prescriptions/appointment/:appointmentId
   * Get prescriptions for an appointment
   */
  getByAppointment = asyncHandler(async (req, res) => {
    const { appointmentId } = req.params;
    
    const prescriptions = await prescriptionRepository.findByAppointment(appointmentId);
    
    return ResponseBuilder.success(res, prescriptions);
  });

  /**
   * POST /prescriptions/generate-qr-codes
   * Generate QR codes for all existing prescriptions without QR
   */
  generateMissingQRCodes = asyncHandler(async (req, res) => {
    console.log('Starting batch QR code generation...');
    
    // Get all prescriptions
    const allPrescriptions = await prescriptionRepository.findAll();
    
    const results = {
      total: allPrescriptions.length,
      generated: 0,
      skipped: 0,
      errors: []
    };

    for (const prescription of allPrescriptions) {
      try {
        // Check if QR already exists
        const hasQR = prescription.prescription_qr_codes && 
                      prescription.prescription_qr_codes.length > 0;
        
        if (hasQR) {
          results.skipped++;
          console.log(`Prescription ${prescription.id} already has QR, skipping...`);
          continue;
        }

        // Generate QR
        await qrCodeService.generatePrescriptionQR(prescription.id);
        results.generated++;
        console.log(`QR generated for prescription ${prescription.id}`);
      } catch (error) {
        results.errors.push({
          prescription_id: prescription.id,
          error: error.message
        });
        console.error(`Failed to generate QR for prescription ${prescription.id}:`, error);
      }
    }

    return ResponseBuilder.success(
      res,
      results,
      200,
      `Proceso completado: ${results.generated} QR generados, ${results.skipped} omitidos, ${results.errors.length} errores`
    );
  });
}

module.exports = new PrescriptionController();
