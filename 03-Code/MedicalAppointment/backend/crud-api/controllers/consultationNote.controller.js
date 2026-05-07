/**
 * Consultation Note Controller
 * Handles HTTP requests for Consultation Note CRUD operations
 * 
 * @module crud-api/controllers/ConsultationNoteController
 */

const consultationNoteRepository = require('../repositories/consultationNote.repository');
const appointmentRepository = require('../repositories/appointment.repository');
const doctorRepository = require('../repositories/doctor.repository');
const ResponseBuilder = require('../../shared/utils/responseBuilder.utils');
const { asyncHandler } = require('../../shared/middleware/errorHandler.middleware');
const { NotFoundError, ValidationError } = require('../../shared/errors');
const { parsePaginationQuery, createPagination } = require('../../shared/utils/helpers.utils');

class ConsultationNoteController {
  /**
   * GET /consultation-notes
   * Get consultation notes for current user, or by appointmentId if provided
   */
  getByUser = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const role = req.user.role;
    const { page, limit, offset } = parsePaginationQuery(req.query);
    const { appointmentId } = req.query;

    // If appointmentId is provided, return notes for that specific appointment
    if (appointmentId) {
      const note = await consultationNoteRepository.findByAppointment(appointmentId);
      // Return as array for consistency, or empty array if not found
      return ResponseBuilder.success(res, note ? [note] : []);
    }

    let notes;

    if (role === 'patient') {
      notes = await consultationNoteRepository.findByPatient(userId, { limit, offset });
      // Transform nested data to flat structure for frontend
      notes = (notes || []).map(note => ({
        ...note,
        scheduled_start: note.appointments?.scheduled_start,
        scheduled_end: note.appointments?.scheduled_end,
        doctor_first_name: note.doctors?.users?.first_name || '',
        doctor_last_name: note.doctors?.users?.last_name || '',
        specialty_name: note.doctors?.specialties?.name || ''
      }));
    } else if (role === 'doctor') {
      const doctor = await doctorRepository.findByUserId(userId);
      if (!doctor) {
        throw new NotFoundError('Doctor');
      }
      notes = await consultationNoteRepository.findByDoctor(doctor.id, { limit, offset });
    }

    const pagination = createPagination(notes?.length || 0, page, limit);
    return ResponseBuilder.paginated(res, notes || [], pagination);
  });

  /**
   * GET /consultation-notes/:id
   * Get consultation note by ID
   */
  getById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const note = await consultationNoteRepository.findById(id);
    
    if (!note) {
      throw new NotFoundError('Nota de consulta', id);
    }

    return ResponseBuilder.success(res, note);
  });

  /**
   * GET /consultation-notes/appointment/:appointmentId
   * Get consultation note by appointment
   */
  getByAppointment = asyncHandler(async (req, res) => {
    const { appointmentId } = req.params;
    
    const note = await consultationNoteRepository.findByAppointment(appointmentId);
    
    // Return null if no note exists instead of throwing error
    // This allows the frontend to handle the case gracefully
    return ResponseBuilder.success(res, note);
  });

  /**
   * POST /consultation-notes
   * Create new consultation note (doctor)
   */
  create = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { 
      appointment_id,
      // SOAP fields
      subjective,
      objective,
      assessment,
      plan,
      // Vital signs (JSONB)
      vital_signs,
      // Legacy fields (kept for backward compatibility)
      notes, 
      diagnosis, 
      treatment_plan,
      prescriptions_given,
      follow_up_required,
      follow_up_date,
      follow_up_time
    } = req.body;

    // Validate required fields
    if (!appointment_id) {
      throw new ValidationError('appointment_id es requerido');
    }

    // Get doctor
    const doctor = await doctorRepository.findByUserId(userId);
    if (!doctor) {
      throw new NotFoundError('Doctor');
    }

    // Check appointment exists
    const appointment = await appointmentRepository.findById(appointment_id);
    if (!appointment) {
      throw new NotFoundError('Cita', appointment_id);
    }

    // Check if note already exists
    const existingNote = await consultationNoteRepository.existsForAppointment(appointment_id);
    if (existingNote) {
      throw new ValidationError('Ya existe una nota de consulta para esta cita');
    }

    const note = await consultationNoteRepository.create({
      appointment_id,
      doctor_id: doctor.id,
      // SOAP fields
      subjective: subjective || null,
      objective: objective || null,
      assessment: assessment || diagnosis || null,
      plan: plan || treatment_plan || null,
      vital_signs: vital_signs || null,
      // Legacy fields
      notes,
      diagnosis: diagnosis || assessment || null,
      treatment_plan: treatment_plan || plan || null,
      prescriptions_given,
      follow_up_required: follow_up_required || false,
      follow_up_date: follow_up_date || null,
      follow_up_time: follow_up_time || '09:00'
    });

    return ResponseBuilder.created(res, note, 'Nota de consulta creada exitosamente');
  });

  /**
   * PUT /consultation-notes/:id
   * Update consultation note (doctor)
   */
  update = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { 
      // SOAP fields
      subjective,
      objective,
      assessment,
      plan,
      // Vital signs (JSONB)
      vital_signs,
      // Legacy fields
      notes, 
      diagnosis, 
      treatment_plan,
      prescriptions_given,
      follow_up_required,
      follow_up_date,
      follow_up_time
    } = req.body;

    const existing = await consultationNoteRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Nota de consulta', id);
    }

    const updated = await consultationNoteRepository.update(id, {
      // SOAP fields
      subjective: subjective !== undefined ? subjective : existing.subjective,
      objective: objective !== undefined ? objective : existing.objective,
      assessment: assessment !== undefined ? assessment : existing.assessment,
      plan: plan !== undefined ? plan : existing.plan,
      vital_signs: vital_signs !== undefined ? vital_signs : existing.vital_signs,
      // Legacy fields (also update for backward compatibility)
      notes: notes !== undefined ? notes : existing.notes,
      diagnosis: diagnosis !== undefined ? diagnosis : (assessment || existing.diagnosis),
      treatment_plan: treatment_plan !== undefined ? treatment_plan : (plan || existing.treatment_plan),
      prescriptions_given: prescriptions_given !== undefined ? prescriptions_given : existing.prescriptions_given,
      follow_up_required: follow_up_required !== undefined ? follow_up_required : existing.follow_up_required,
      follow_up_date: follow_up_date !== undefined ? (follow_up_date || null) : existing.follow_up_date,
      follow_up_time: follow_up_time !== undefined ? (follow_up_time || '09:00') : existing.follow_up_time
    });

    return ResponseBuilder.success(res, updated, 200, 'Nota de consulta actualizada');
  });

  /**
   * DELETE /consultation-notes/:id
   * Delete consultation note (admin only)
   */
  delete = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const existing = await consultationNoteRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Nota de consulta', id);
    }

    await consultationNoteRepository.hardDelete(id);

    return ResponseBuilder.success(res, { id }, 200, 'Nota de consulta eliminada');
  });
}

module.exports = new ConsultationNoteController();
