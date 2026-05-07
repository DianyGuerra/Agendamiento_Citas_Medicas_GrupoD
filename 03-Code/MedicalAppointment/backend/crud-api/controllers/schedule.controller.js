/**
 * Schedule Controller
 * Handles HTTP requests for Schedule CRUD operations
 * 
 * @module crud-api/controllers/ScheduleController
 */

const scheduleRepository = require('../repositories/schedule.repository');
const scheduleExceptionRepository = require('../repositories/scheduleException.repository');
const doctorRepository = require('../repositories/doctor.repository');
const ResponseBuilder = require('../../shared/utils/responseBuilder.utils');
const { asyncHandler } = require('../../shared/middleware/errorHandler.middleware');
const { NotFoundError, ValidationError } = require('../../shared/errors');

class ScheduleController {
  /**
   * GET /schedules
   * Get all schedules (admin) or by doctor_id query param
   */
  getAll = asyncHandler(async (req, res) => {
    const { doctor_id } = req.query;
    
    let schedules;
    if (doctor_id) {
      // If doctor_id is provided, get schedules for that doctor
      schedules = await scheduleRepository.findByDoctor(doctor_id);
    } else {
      // Otherwise get all schedules
      schedules = await scheduleRepository.findAll({
        orderBy: 'doctor_id'
      });
    }
    return ResponseBuilder.success(res, schedules);
  });

  /**
   * GET /schedules/:id
   * Get schedule by ID
   */
  getById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const schedule = await scheduleRepository.findById(id);
    
    if (!schedule) {
      throw new NotFoundError('Horario', id);
    }

    return ResponseBuilder.success(res, schedule);
  });

  /**
   * GET /schedules/doctor/:doctorId
   * Get schedules by doctor
   */
  getByDoctor = asyncHandler(async (req, res) => {
    const { doctorId } = req.params;

    const schedules = await scheduleRepository.findByDoctor(doctorId);

    return ResponseBuilder.success(res, schedules);
  });

  /**
   * GET /schedules/me
   * Get current doctor's schedule
   */
  getCurrentDoctorSchedule = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    // Get doctor by user ID
    const doctor = await doctorRepository.findByUserId(userId);
    if (!doctor) {
      throw new NotFoundError('Doctor no encontrado para este usuario');
    }

    const schedules = await scheduleRepository.findByDoctor(doctor.id);

    return ResponseBuilder.success(res, schedules);
  });

  /**
   * PUT /schedules/me
   * Update current doctor's schedule
   */
  updateCurrentDoctorSchedule = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { schedules } = req.body;

    // Get doctor by user ID
    const doctor = await doctorRepository.findByUserId(userId);
    if (!doctor) {
      throw new NotFoundError('Doctor no encontrado para este usuario');
    }

    if (!Array.isArray(schedules)) {
      throw new ValidationError('schedules debe ser un array');
    }

    // Update each schedule day
    const updatedSchedules = [];
    for (const schedule of schedules) {
      const result = await scheduleRepository.upsert(doctor.id, schedule.day_of_week, {
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        break_start_time: schedule.break_start_time,
        break_end_time: schedule.break_end_time,
        is_working_day: schedule.is_working_day !== false
      });
      updatedSchedules.push(result);
    }

    return ResponseBuilder.success(res, updatedSchedules, 200, 'Horarios actualizados exitosamente');
  });

  /**
   * POST /schedules
   * Create new schedule
   */
  create = asyncHandler(async (req, res) => {
    const { 
      doctor_id, 
      day_of_week, 
      start_time, 
      end_time,
      break_start_time,
      break_end_time,
      is_working_day = true
    } = req.body;

    // Validate required fields
    if (!doctor_id || day_of_week === undefined || !start_time || !end_time) {
      throw new ValidationError('doctor_id, day_of_week, start_time y end_time son requeridos');
    }

    // Validate day of week
    if (day_of_week < 0 || day_of_week > 6) {
      throw new ValidationError('day_of_week debe estar entre 0 y 6');
    }

    // Verify doctor exists
    const doctor = await doctorRepository.findById(doctor_id);
    if (!doctor) {
      throw new NotFoundError('Doctor', doctor_id);
    }

    const schedule = await scheduleRepository.create({
      doctor_id,
      day_of_week,
      start_time,
      end_time,
      break_start_time,
      break_end_time,
      is_working_day
    });

    return ResponseBuilder.created(res, schedule, 'Horario creado exitosamente');
  });

  /**
   * POST /schedules/bulk
   * Create or update multiple schedules for a doctor
   */
  bulkCreate = asyncHandler(async (req, res) => {
    const { doctor_id, schedules } = req.body;

    if (!doctor_id) {
      throw new ValidationError('doctor_id es requerido');
    }

    if (!Array.isArray(schedules) || schedules.length === 0) {
      throw new ValidationError('schedules debe ser un array no vacío');
    }

    // Verify doctor exists
    const doctor = await doctorRepository.findById(doctor_id);
    if (!doctor) {
      throw new NotFoundError('Doctor', doctor_id);
    }

    // Upsert each schedule
    const results = [];
    for (const schedule of schedules) {
      if (schedule.day_of_week === undefined) {
        continue; // Skip invalid entries
      }

      const result = await scheduleRepository.upsert(doctor_id, schedule.day_of_week, {
        start_time: schedule.start_time || '08:00',
        end_time: schedule.end_time || '17:00',
        break_start_time: schedule.break_start_time || null,
        break_end_time: schedule.break_end_time || null,
        is_working_day: schedule.is_working_day !== false
      });
      results.push(result);
    }

    return ResponseBuilder.success(res, results, 200, 'Horarios actualizados exitosamente');
  });

  /**
   * PUT /schedules/:id
   * Update schedule
   */
  update = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { 
      day_of_week, 
      start_time, 
      end_time,
      break_start_time,
      break_end_time,
      is_working_day
    } = req.body;

    const existing = await scheduleRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Horario', id);
    }

    const updated = await scheduleRepository.update(id, {
      day_of_week,
      start_time,
      end_time,
      break_start_time,
      break_end_time,
      is_working_day
    });

    return ResponseBuilder.success(res, updated, 200, 'Horario actualizado exitosamente');
  });

  /**
   * PUT /schedules/doctor/:doctorId/upsert
   * Upsert schedule for doctor and day
   */
  upsert = asyncHandler(async (req, res) => {
    const { doctorId } = req.params;
    const { 
      day_of_week, 
      start_time, 
      end_time,
      break_start_time,
      break_end_time,
      is_working_day = true
    } = req.body;

    if (day_of_week === undefined) {
      throw new ValidationError('day_of_week es requerido');
    }

    const schedule = await scheduleRepository.upsert(doctorId, day_of_week, {
      start_time,
      end_time,
      break_start_time,
      break_end_time,
      is_working_day
    });

    return ResponseBuilder.success(res, schedule, 200, 'Horario guardado exitosamente');
  });

  /**
   * DELETE /schedules/:id
   * Delete schedule
   */
  delete = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const existing = await scheduleRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Horario', id);
    }

    await scheduleRepository.hardDelete(id);

    return ResponseBuilder.success(res, { id }, 200, 'Horario eliminado exitosamente');
  });

  // ===================== EXCEPTIONS =====================

  /**
   * GET /schedules/exceptions/doctor/:doctorId
   * Get exceptions for doctor
   */
  getExceptionsByDoctor = asyncHandler(async (req, res) => {
    const { doctorId } = req.params;
    const { startDate, endDate } = req.query;

    const exceptions = await scheduleExceptionRepository.findByDoctor(doctorId, {
      startDate,
      endDate
    });

    return ResponseBuilder.success(res, exceptions);
  });

  /**
   * GET /schedules/exceptions/me
   * Get current doctor's exceptions
   */
  getCurrentDoctorExceptions = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const doctor = await doctorRepository.findByUserId(userId);
    if (!doctor) {
      throw new NotFoundError('Doctor no encontrado para este usuario');
    }

    const { startDate, endDate } = req.query;
    const exceptions = await scheduleExceptionRepository.findByDoctor(doctor.id, {
      startDate,
      endDate
    });

    return ResponseBuilder.success(res, exceptions);
  });

  /**
   * POST /schedules/exceptions
   * Create schedule exception
   */
  createException = asyncHandler(async (req, res) => {
    const { 
      doctor_id, 
      exception_date, 
      exception_type,
      is_all_day = true,
      start_time,
      end_time,
      reason
    } = req.body;

    if (!doctor_id || !exception_date || !exception_type) {
      throw new ValidationError('doctor_id, exception_date y exception_type son requeridos');
    }

    const exception = await scheduleExceptionRepository.create({
      doctor_id,
      exception_date,
      exception_type,
      is_all_day,
      start_time,
      end_time,
      reason
    });

    return ResponseBuilder.created(res, exception, 'Excepción creada exitosamente');
  });

  /**
   * POST /schedules/exceptions/vacation
   * Create vacation period
   */
  createVacation = asyncHandler(async (req, res) => {
    const { doctor_id, start_date, end_date, reason } = req.body;

    if (!doctor_id || !start_date || !end_date) {
      throw new ValidationError('doctor_id, start_date y end_date son requeridos');
    }

    const exceptions = await scheduleExceptionRepository.createVacation(
      doctor_id, 
      start_date, 
      end_date, 
      reason
    );

    return ResponseBuilder.created(res, exceptions, 'Vacaciones registradas exitosamente');
  });

  /**
   * DELETE /schedules/exceptions/:id
   * Delete exception
   */
  deleteException = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const existing = await scheduleExceptionRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Excepción', id);
    }

    await scheduleExceptionRepository.hardDelete(id);

    return ResponseBuilder.success(res, { id }, 200, 'Excepción eliminada exitosamente');
  });

  // ===================== DOCTOR EXCEPTION REQUESTS =====================

  /**
   * POST /schedules/exceptions/request
   * Doctor requests a schedule exception (needs admin approval)
   */
  requestException = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    
    const doctor = await doctorRepository.findByUserId(userId);
    if (!doctor) {
      throw new NotFoundError('Doctor no encontrado para este usuario');
    }

    const { 
      exception_date, 
      exception_type,
      is_all_day = true,
      exception_start_time,
      exception_end_time,
      reason
    } = req.body;

    if (!exception_date || !exception_type) {
      throw new ValidationError('exception_date y exception_type son requeridos');
    }

    // Valid exception types
    const validTypes = ['vacation', 'day_off', 'extra_hours', 'holiday_work', 'schedule_change'];
    if (!validTypes.includes(exception_type)) {
      throw new ValidationError(`Tipo de excepción inválido. Valores permitidos: ${validTypes.join(', ')}`);
    }

    const exception = await scheduleExceptionRepository.create({
      doctor_id: doctor.id,
      exception_date,
      exception_type,
      is_all_day,
      exception_start_time: is_all_day ? null : exception_start_time,
      exception_end_time: is_all_day ? null : exception_end_time,
      reason,
      status: 'pending'
    });

    return ResponseBuilder.created(res, exception, 'Solicitud enviada. Pendiente de aprobación por administrador.');
  });

  /**
   * GET /schedules/exceptions/my-requests
   * Get current doctor's exception requests with status
   */
  getMyExceptionRequests = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const doctor = await doctorRepository.findByUserId(userId);
    if (!doctor) {
      throw new NotFoundError('Doctor no encontrado para este usuario');
    }

    const { data, error } = await scheduleExceptionRepository.db
      .from('schedule_exceptions')
      .select('*')
      .eq('doctor_id', doctor.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return ResponseBuilder.success(res, data || []);
  });

  /**
   * DELETE /schedules/exceptions/request/:id
   * Doctor cancels their own pending request
   */
  cancelMyRequest = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;

    const doctor = await doctorRepository.findByUserId(userId);
    if (!doctor) {
      throw new NotFoundError('Doctor no encontrado para este usuario');
    }

    const exception = await scheduleExceptionRepository.findById(id);
    if (!exception) {
      throw new NotFoundError('Solicitud', id);
    }

    if (exception.doctor_id !== doctor.id) {
      throw new ValidationError('No puede cancelar solicitudes de otros doctores');
    }

    if (exception.status !== 'pending') {
      throw new ValidationError('Solo puede cancelar solicitudes pendientes');
    }

    await scheduleExceptionRepository.hardDelete(id);

    return ResponseBuilder.success(res, { id }, 200, 'Solicitud cancelada exitosamente');
  });

  // ===================== ADMIN EXCEPTION MANAGEMENT =====================

  /**
   * GET /schedules/exceptions/pending
   * Admin gets all pending exception requests
   */
  getPendingRequests = asyncHandler(async (req, res) => {
    const { data, error } = await scheduleExceptionRepository.db
      .from('schedule_exceptions')
      .select(`
        *,
        doctors!inner(
          id,
          users!inner(first_name, last_name, email)
        )
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    // Format response
    const formatted = (data || []).map(exc => ({
      ...exc,
      doctor_name: exc.doctors?.users 
        ? `${exc.doctors.users.first_name} ${exc.doctors.users.last_name}` 
        : 'Desconocido',
      doctor_email: exc.doctors?.users?.email
    }));

    return ResponseBuilder.success(res, formatted);
  });

  /**
   * PUT /schedules/exceptions/:id/approve
   * Admin approves exception request
   */
  approveRequest = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { admin_notes } = req.body;
    const adminUserId = req.user.id;

    const exception = await scheduleExceptionRepository.findById(id);
    if (!exception) {
      throw new NotFoundError('Solicitud', id);
    }

    if (exception.status !== 'pending') {
      throw new ValidationError('Esta solicitud ya fue procesada');
    }

    const { data, error } = await scheduleExceptionRepository.db
      .from('schedule_exceptions')
      .update({
        status: 'approved',
        admin_notes,
        reviewed_at: new Date().toISOString(),
        reviewed_by: adminUserId
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return ResponseBuilder.success(res, data, 200, 'Solicitud aprobada exitosamente');
  });

  /**
   * PUT /schedules/exceptions/:id/reject
   * Admin rejects exception request
   */
  rejectRequest = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { admin_notes } = req.body;
    const adminUserId = req.user.id;

    if (!admin_notes) {
      throw new ValidationError('Debe proporcionar una razón para el rechazo');
    }

    const exception = await scheduleExceptionRepository.findById(id);
    if (!exception) {
      throw new NotFoundError('Solicitud', id);
    }

    if (exception.status !== 'pending') {
      throw new ValidationError('Esta solicitud ya fue procesada');
    }

    const { data, error } = await scheduleExceptionRepository.db
      .from('schedule_exceptions')
      .update({
        status: 'rejected',
        admin_notes,
        reviewed_at: new Date().toISOString(),
        reviewed_by: adminUserId
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return ResponseBuilder.success(res, data, 200, 'Solicitud rechazada');
  });
}

module.exports = new ScheduleController();
