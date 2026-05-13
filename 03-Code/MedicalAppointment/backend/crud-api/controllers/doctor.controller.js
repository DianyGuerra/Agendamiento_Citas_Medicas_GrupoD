/**
 * Doctor Controller
 * Handles HTTP requests for Doctor CRUD operations
 * 
 * @module crud-api/controllers/DoctorController
 */

const doctorRepository = require('../repositories/doctor.repository');
const userRepository = require('../repositories/user.repository');
const scheduleRepository = require('../repositories/schedule.repository');
const appointmentRepository = require('../repositories/appointment.repository');
const ResponseBuilder = require('../../shared/utils/responseBuilder.utils');
const { asyncHandler } = require('../../shared/middleware/errorHandler.middleware');
const { NotFoundError, ValidationError } = require('../../shared/errors');
const { parsePaginationQuery, createPagination } = require('../../shared/utils/helpers.utils');
const bcrypt = require('bcrypt');
const { supabase } = require('../../shared/config/database.config');
const { createAuditLog, AuditActions } = require('../../shared/utils/audit.utils');
const crypto = require('node:crypto');

class DoctorController {
  /**
   * GET /doctors
   * Get all doctors with pagination
   */
  getAll = asyncHandler(async (req, res) => {
    const { page, limit, offset } = parsePaginationQuery(req.query);
    const { specialty_id, search, active } = req.query;

    let doctors;

    if (specialty_id) {
      doctors = await doctorRepository.findBySpecialty(specialty_id, { 
        limit, 
        offset,
        activeOnly: active !== 'false'
      });
    } else {
      doctors = await doctorRepository.findAllWithDetails({ 
        limit, 
        offset,
        search,
        activeOnly: active !== 'false'
      });
    }

    const pagination = createPagination(doctors.length, page, limit);
    return ResponseBuilder.paginated(res, doctors, pagination);
  });

  /**
   * GET /doctors/:id
   * Get doctor by ID
   */
  getById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const doctor = await doctorRepository.findWithDetails(id);
    
    if (!doctor) {
      throw new NotFoundError('Doctor', id);
    }

    return ResponseBuilder.success(res, doctor);
  });

  /**
   * GET /doctors/profile
   * Get current doctor's profile
   */
  getProfile = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    
    const doctor = await doctorRepository.findByUserId(userId);
    
    if (!doctor) {
      throw new NotFoundError('Doctor');
    }

    return ResponseBuilder.success(res, doctor);
  });

  /**
   * GET /doctors/specialty/:specialtyId
   * Get doctors by specialty
   */
  getBySpecialty = asyncHandler(async (req, res) => {
    const { specialtyId } = req.params;
    
    const doctors = await doctorRepository.findBySpecialty(specialtyId);

    return ResponseBuilder.success(res, doctors);
  });

  /**
   * POST /doctors
   * Create new doctor (admin)
   */
  create = asyncHandler(async (req, res) => {
    const { user_id, specialty_id, professional_id, bio } = req.body;

    // Validate required fields
    if (!user_id || !specialty_id) {
      throw new ValidationError('user_id y specialty_id son requeridos');
    }

    // Check if user exists
    const user = await userRepository.findById(user_id);
    if (!user) {
      throw new NotFoundError('Usuario', user_id);
    }

    // Check if doctor already exists for this user
    const existingDoctor = await doctorRepository.findByUserId(user_id);
    if (existingDoctor) {
      throw new ValidationError('Ya existe un registro de doctor para este usuario');
    }

    const doctor = await doctorRepository.create({
      user_id,
      specialty_id,
      professional_id,
      bio,
      active: true
    });

    // Audit log
    createAuditLog({
      userId: req.user.id,
      action: AuditActions.DOCTOR_CREATED,
      tableName: 'doctors',
      recordId: doctor.id,
      newValues: { user_id, specialty_id, professional_id },
      description: `Doctor creado para usuario ${user_id}`,
      req
    });

    return ResponseBuilder.created(res, doctor, 'Doctor creado exitosamente');
  });

  /**
   * POST /doctors/with-user
   * Create new doctor with user account (admin)
   * Handles multiple scenarios:
   * - New user: Creates user + doctor
   * - Existing patient: Promotes to doctor role + creates doctor record
   * - Existing doctor: Returns error
   * - Conflicting data: Returns specific error messages
   */
  createWithUser = asyncHandler(async (req, res) => {
    const { 
      cedula, 
      first_name, 
      last_name, 
      email, 
      phone_number, 
      specialty_id, 
      license_number,
      status = 'active',
      promote_existing = false // Flag to allow promoting existing users
    } = req.body;

    // Validate required fields
    if (!cedula || !first_name || !last_name || !email || !specialty_id) {
      throw new ValidationError('Cédula, nombre, apellido, email y especialidad son requeridos');
    }

    // Validate cedula format (10 digits)
    if (!/^\d{10}$/.test(cedula)) {
      throw new ValidationError('La cédula debe tener 10 dígitos numéricos');
    }

    // Get doctor role_id first
    const { data: doctorRole } = await supabase
      .from('roles')
      .select('id')
      .eq('name', 'doctor')
      .single();

    if (!doctorRole) {
      throw new ValidationError('Rol de doctor no encontrado en el sistema');
    }

    // Check if email already exists
    const existingByEmail = await userRepository.findByEmail(email.toLowerCase());
    
    // Check if cedula already exists
    const existingByCedula = await userRepository.findByCedula(cedula);

    // CASE 1: Both email and cedula exist - check if they're the same user
    if (existingByEmail && existingByCedula) {
      if (existingByEmail.id !== existingByCedula.id) {
        throw new ValidationError('Conflicto de datos: El email y la cédula pertenecen a usuarios diferentes en el sistema');
      }
      // Same user - check if already a doctor
      const existingDoctor = await doctorRepository.findByUserId(existingByEmail.id);
      if (existingDoctor) {
        throw new ValidationError('Este usuario ya está registrado como doctor');
      }
      // User exists but is not a doctor - can be promoted
      if (!promote_existing) {
        return ResponseBuilder.success(res, {
          requires_promotion: true,
          existing_user: {
            id: existingByEmail.id,
            email: existingByEmail.email,
            first_name: existingByEmail.first_name,
            last_name: existingByEmail.last_name,
            current_role: existingByEmail.roles?.name || 'unknown'
          },
          message: 'Este usuario ya existe en el sistema. ¿Desea promoverlo a doctor?'
        }, 200, 'Usuario existente encontrado');
      }
    }

    // CASE 2: Only email exists
    if (existingByEmail && !existingByCedula) {
      // Email exists but cedula doesn't match
      if (existingByEmail.cedula && existingByEmail.cedula !== cedula) {
        throw new ValidationError(`El email ${email} ya está registrado con una cédula diferente (${existingByEmail.cedula?.substring(0,4)}****)`);
      }
      // Check if already a doctor
      const existingDoctor = await doctorRepository.findByUserId(existingByEmail.id);
      if (existingDoctor) {
        throw new ValidationError('Este email ya pertenece a un doctor registrado');
      }
      // Can be promoted
      if (!promote_existing) {
        return ResponseBuilder.success(res, {
          requires_promotion: true,
          existing_user: {
            id: existingByEmail.id,
            email: existingByEmail.email,
            first_name: existingByEmail.first_name,
            last_name: existingByEmail.last_name,
            current_role: existingByEmail.roles?.name || 'unknown'
          },
          message: 'Este email ya existe en el sistema. ¿Desea promover este usuario a doctor?'
        }, 200, 'Usuario existente encontrado');
      }
    }

    // CASE 3: Only cedula exists
    if (existingByCedula && !existingByEmail) {
      throw new ValidationError(`La cédula ${cedula} ya está registrada con otro email (${existingByCedula.email?.substring(0,3)}***)`);
    }

    // CASE 4: Promotion of existing user
    if (promote_existing && (existingByEmail || existingByCedula)) {
      const existingUser = existingByEmail || existingByCedula;
      
      // Double check not already a doctor
      const existingDoctor = await doctorRepository.findByUserId(existingUser.id);
      if (existingDoctor) {
        throw new ValidationError('Este usuario ya está registrado como doctor');
      }

      // Update user role to doctor and update any missing fields
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          role_id: doctorRole.id,
          first_name: first_name || existingUser.first_name,
          last_name: last_name || existingUser.last_name,
          phone_number: phone_number || existingUser.phone_number,
          cedula: cedula || existingUser.cedula,
          is_active: status === 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', existingUser.id);

      if (updateError) {
        throw new ValidationError(`Error al actualizar usuario: ${updateError.message}`);
      }

      // Create doctor record
      const doctor = await doctorRepository.create({
        user_id: existingUser.id,
        specialty_id,
        professional_id: license_number,
        active: status === 'active'
      });

      return ResponseBuilder.created(res, {
        ...doctor,
        user: existingUser,
        promoted: true,
        message: 'Usuario existente promovido a doctor. Puede acceder con su contraseña actual.'
      }, 'Usuario promovido a doctor exitosamente');
    }

    // CASE 5: New user - create from scratch
    const tempPassword = `${cedula}${last_name.substring(0, 3).toUpperCase()}!`;
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert({
        email: email.toLowerCase(),
        password_hash: hashedPassword,
        first_name,
        last_name,
        cedula,
        phone_number,
        role_id: doctorRole.id,
        is_active: status === 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id, email, first_name, last_name')
      .single();

    if (userError) {
      // Handle unique constraint violations
      if (userError.code === '23505') {
        if (userError.message.includes('email')) {
          throw new ValidationError('El email ya está en uso');
        }
        if (userError.message.includes('cedula')) {
          throw new ValidationError('La cédula ya está en uso');
        }
      }
      throw new ValidationError(`Error al crear usuario: ${userError.message}`);
    }

    // Create doctor record
    const doctor = await doctorRepository.create({
      user_id: newUser.id,
      specialty_id,
      professional_id: license_number,
      active: status === 'active'
    });

    // Audit log
    createAuditLog({
      userId: req.user.id,
      action: AuditActions.DOCTOR_CREATED,
      tableName: 'doctors',
      recordId: doctor.id,
      newValues: { email, first_name, last_name, specialty_id },
      description: `Doctor ${first_name} ${last_name} creado con nueva cuenta`,
      req
    });

    return ResponseBuilder.created(res, {
      ...doctor,
      user: newUser,
      temporary_password: tempPassword,
      message: 'Doctor creado. Contraseña temporal: ' + tempPassword
    }, 'Doctor creado exitosamente con cuenta de usuario');
  });

  /**
   * PUT /doctors/:id
   * Update doctor
   */
  update = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { specialty_id, professional_id, bio } = req.body;

    const existing = await doctorRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Doctor', id);
    }

    const updated = await doctorRepository.update(id, {
      specialty_id,
      professional_id,
      bio
    });

    // Audit log
    createAuditLog({
      userId: req.user.id,
      action: AuditActions.DOCTOR_UPDATED,
      tableName: 'doctors',
      recordId: id,
      oldValues: { specialty_id: existing.specialty_id, professional_id: existing.professional_id },
      newValues: { specialty_id, professional_id, bio },
      description: `Doctor ${id} actualizado`,
      req
    });

    return ResponseBuilder.success(res, updated, 200, 'Doctor actualizado exitosamente');
  });

  /**
   * POST /doctors/:id/reset-password
   * Reset doctor's password to a new temporary password (admin only)
   */
  resetPassword = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Find doctor
    const doctor = await doctorRepository.findWithDetails(id);
    if (!doctor) {
      throw new NotFoundError('Doctor', id);
    }

    // Get user data
    const user = await userRepository.findById(doctor.user_id);
    if (!user) {
      throw new NotFoundError('Usuario asociado al doctor');
    }

    // Generate new temporary password
    const secureRandom = crypto.randomInt(1000, 10000);
    const tempPassword = `${user.cedula || 'TEMP'}${(user.last_name || 'XXX').substring(0, 3).toUpperCase()}!${secureRandom}`;
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    // Update password
    const { error } = await supabase
      .from('users')
      .update({ 
        password_hash: hashedPassword,
        updated_at: new Date().toISOString()
      })
      .eq('id', doctor.user_id);

    if (error) {
      throw new ValidationError(`Error al restablecer contraseña: ${error.message}`);
    }

    return ResponseBuilder.success(res, {
      doctor_id: id,
      doctor_name: `${user.first_name} ${user.last_name}`,
      email: user.email,
      temporary_password: tempPassword
    }, 200, 'Contraseña restablecida exitosamente');
  });

  /**
   * PUT /doctors/profile
   * Update current doctor's profile
   */
  updateProfile = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { bio, phone_number, first_name, last_name } = req.body;

    const doctor = await doctorRepository.findByUserId(userId);
    if (!doctor) {
      throw new NotFoundError('Doctor');
    }

    // Update user fields
    if (first_name || last_name || phone_number) {
      await userRepository.update(userId, {
        first_name,
        last_name,
        phone_number
      });
    }

    // Update doctor fields
    const updated = await doctorRepository.update(doctor.id, {
      bio
    });

    return ResponseBuilder.success(res, updated, 200, 'Perfil actualizado exitosamente');
  });

  /**
   * DELETE /doctors/:id
   * Soft delete doctor (deactivate)
   */
  delete = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const existing = await doctorRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Doctor', id);
    }

    await doctorRepository.softDelete(id);

    return ResponseBuilder.success(res, { id }, 200, 'Doctor desactivado exitosamente');
  });

  /**
   * PATCH /doctors/:id/activate
   * Reactivate doctor
   */
  activate = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const existing = await doctorRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Doctor', id);
    }

    const updated = await doctorRepository.updateActiveStatus(id, true);

    return ResponseBuilder.success(res, updated, 200, 'Doctor activado exitosamente');
  });

  /**
   * GET /doctors/:id/schedules
   * Get doctor schedules
   */
  getSchedules = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const schedules = await scheduleRepository.findByDoctor(id);

    return ResponseBuilder.success(res, schedules);
  });

  /**
   * GET /doctors/me/schedules
   * Get current doctor's schedules
   */
  getMySchedules = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const doctor = await doctorRepository.findByUserId(userId);
    if (!doctor) {
      throw new NotFoundError('Doctor');
    }

    const schedules = await scheduleRepository.findByDoctor(doctor.id);

    return ResponseBuilder.success(res, schedules);
  });

  /**
   * GET /doctors/my-patients
   * Get patients of the current doctor (patients with appointments)
   */
  getMyPatients = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const doctor = await doctorRepository.findByUserId(userId);
    if (!doctor) {
      throw new NotFoundError('Doctor');
    }

    // Get unique patients from appointments
    const patients = await appointmentRepository.findUniquePatientsByDoctor(doctor.id);

    return ResponseBuilder.success(res, patients);
  });
}

module.exports = new DoctorController();
