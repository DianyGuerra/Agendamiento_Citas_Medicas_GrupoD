/**
 * Patient Controller
 * Handles HTTP requests for Patient CRUD operations
 * 
 * @module crud-api/controllers/PatientController
 */

const patientRepository = require('../repositories/patient.repository');
const userRepository = require('../repositories/user.repository');
const ResponseBuilder = require('../../shared/utils/responseBuilder.utils');
const { asyncHandler } = require('../../shared/middleware/errorHandler.middleware');
const { NotFoundError, ValidationError } = require('../../shared/errors');
const { parsePaginationQuery, createPagination } = require('../../shared/utils/helpers.utils');
const { supabase } = require('../../shared/config/database.config');
const { createAuditLog, AuditActions } = require('../../shared/utils/audit.utils');

class PatientController {
  constructor() {
    this.db = supabase;
  }

  /**
   * GET /patients
   * Get all patients with pagination
   */
  getAll = asyncHandler(async (req, res) => {
    const { page, limit, offset } = parsePaginationQuery(req.query);
    const { search } = req.query;

    const patients = await patientRepository.findAllWithUserInfo({ 
      limit, 
      offset,
      search 
    });

    const pagination = createPagination(patients.length, page, limit);
    return ResponseBuilder.paginated(res, patients, pagination);
  });

  /**
   * GET /patients/:id
   * Get patient by patient table ID
   */
  getById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const patient = await patientRepository.findWithUserDetails(id);
    
    if (!patient) {
      throw new NotFoundError('Paciente', id);
    }

    return ResponseBuilder.success(res, patient);
  });

  /**
   * GET /patients/user/:userId
   * Get patient by user ID
   */
  getByUserId = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    
    const patient = await patientRepository.findWithUserDetails(userId);
    
    if (!patient) {
      // Return null instead of error - patient may not have a record yet
      return ResponseBuilder.success(res, null);
    }

    return ResponseBuilder.success(res, patient);
  });

  /**
   * GET /patients/profile
   * Get current patient's profile
   */
  getProfile = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    
    let patient = await patientRepository.findWithUserDetails(userId);
    
    // Create patient record if doesn't exist
    if (!patient) {
      await patientRepository.createForUser(userId);
      patient = await patientRepository.findWithUserDetails(userId);
    }

    return ResponseBuilder.success(res, patient);
  });

  /**
   * PUT /patients/profile
   * Update current patient's profile
   */
  updateProfile = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    
    // Separate user fields from patient fields
    // cedula and email are stored in users table
    const userFields = ['first_name', 'last_name', 'phone_number', 'cedula', 'email'];
    const patientFields = [
      'date_of_birth', 'gender', 'address', 'city', 'state',
      'postal_code', 'country', 'insurance_provider_id', 'insurance_plan', 'insurance_number',
      'emergency_contact_name', 'emergency_contact_phone',
      'emergency_contact_relation', 'allergies', 'medical_conditions',
      'current_medications', 'blood_type', 'height', 'weight', 'home_phone'
    ];
    
    // Map frontend field names to database field names
    const fieldMappings = {
      'province': 'state',
      'landline': 'home_phone',
      'chronic_conditions': 'medical_conditions'
    };

    const userUpdates = {};
    const patientUpdates = {};

    // Separate updates
    for (const [key, value] of Object.entries(req.body)) {
      // Apply field name mappings (frontend name -> database name)
      const dbFieldName = fieldMappings[key] || key;
      const processedValue = value === '' ? null : value;
      
      if (userFields.includes(key)) {
        userUpdates[key] = processedValue;
      } else if (userFields.includes(dbFieldName)) {
        userUpdates[dbFieldName] = processedValue;
      } else if (patientFields.includes(key)) {
        patientUpdates[key] = processedValue;
      } else if (patientFields.includes(dbFieldName)) {
        patientUpdates[dbFieldName] = processedValue;
      }
    }

    // Update user table if needed
    if (Object.keys(userUpdates).length > 0) {
      await userRepository.update(userId, userUpdates);
    }

    // Update patient table if needed
    if (Object.keys(patientUpdates).length > 0) {
      const existingPatient = await patientRepository.findByUserId(userId);
      if (existingPatient) {
        await patientRepository.updateByUserId(userId, patientUpdates);
      } else {
        await patientRepository.createForUser(userId, patientUpdates);
      }
    }

    // Return updated profile
    const updatedProfile = await patientRepository.findWithUserDetails(userId);

    return ResponseBuilder.success(res, updatedProfile, 200, 'Perfil actualizado exitosamente');
  });

  /**
   * POST /patients
   * Create new patient (admin)
   */
  create = asyncHandler(async (req, res) => {
    const { user_id, ...patientData } = req.body;

    // Check if user exists
    const user = await userRepository.findById(user_id);
    if (!user) {
      throw new NotFoundError('Usuario', user_id);
    }

    // Check if patient already exists
    const existingPatient = await patientRepository.findByUserId(user_id);
    if (existingPatient) {
      throw new ValidationError('Ya existe un registro de paciente para este usuario');
    }

    const patient = await patientRepository.createForUser(user_id, patientData);

    return ResponseBuilder.created(res, patient, 'Paciente creado exitosamente');
  });

  /**
   * PUT /patients/:id
   * Update patient by user ID (admin)
   */
  update = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const patientData = req.body;

    const existing = await patientRepository.findByUserId(id);
    if (!existing) {
      throw new NotFoundError('Paciente', id);
    }

    const updated = await patientRepository.updateByUserId(id, patientData);

    return ResponseBuilder.success(res, updated, 200, 'Paciente actualizado exitosamente');
  });

  /**
   * GET /patients/stats
   * Get patient statistics
   */
  getStats = asyncHandler(async (req, res) => {
    const stats = await patientRepository.getStats();
    return ResponseBuilder.success(res, stats);
  });

  /**
   * POST /patients/with-user
   * Create a patient with a new user account
   */
  createWithUser = asyncHandler(async (req, res) => {
    const {
      email,
      first_name,
      last_name,
      cedula,
      phone_number,
      date_of_birth,
      gender,
      blood_type,
      address,
      city,
      state,
      emergency_contact_name,
      emergency_contact_phone,
      emergency_contact_relation,
      insurance_plan,
      insurance_number,
      allergies,
      medical_conditions,
      current_medications,
      status = 'active',
      promote_existing = false
    } = req.body;

    // Validate required fields
    if (!email || !first_name || !last_name || !cedula) {
      throw new ValidationError('Email, nombre, apellido y cédula son requeridos');
    }

    // Get patient role
    const { data: patientRole, error: roleError } = await this.db
      .from('roles')
      .select('id')
      .eq('name', 'patient')
      .single();

    if (roleError || !patientRole) {
      throw new ValidationError('No se encontró el rol de paciente');
    }

    // Check existing user by email
    const { data: existingByEmail } = await this.db
      .from('users')
      .select('id, email, first_name, last_name, cedula, role_id, roles(name)')
      .eq('email', email.toLowerCase())
      .single();

    // Check existing user by cedula
    const { data: existingByCedula } = await this.db
      .from('users')
      .select('id, email, first_name, last_name, cedula, role_id, roles(name)')
      .eq('cedula', cedula)
      .single();

    // CASE 1: Both email and cedula exist but belong to different users
    if (existingByEmail && existingByCedula && existingByEmail.id !== existingByCedula.id) {
      throw new ValidationError('El email y la cédula pertenecen a usuarios diferentes');
    }

    // CASE 2: User exists (by email or cedula)
    if (existingByEmail || existingByCedula) {
      const existingUser = existingByEmail || existingByCedula;
      
      // Check if already a patient
      const existingPatient = await patientRepository.findByUserId(existingUser.id);
      if (existingPatient) {
        throw new ValidationError('Este usuario ya está registrado como paciente');
      }

      // Can be promoted
      if (!promote_existing) {
        return ResponseBuilder.success(res, {
          requires_promotion: true,
          existing_user: {
            id: existingUser.id,
            email: existingUser.email,
            first_name: existingUser.first_name,
            last_name: existingUser.last_name,
            current_role: existingUser.roles?.name || 'unknown'
          },
          message: 'Este usuario ya existe en el sistema. ¿Desea agregar el perfil de paciente?'
        }, 200, 'Usuario existente encontrado');
      }

      // Update user role to patient if they don't have one or add patient record
      const { error: updateError } = await this.db
        .from('users')
        .update({
          role_id: patientRole.id,
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

      // Create patient record
      const patient = await patientRepository.createForUser(existingUser.id, {
        date_of_birth,
        gender,
        blood_type,
        address,
        city,
        state,
        emergency_contact_name,
        emergency_contact_phone,
        emergency_contact_relation,
        insurance_plan,
        insurance_number,
        allergies,
        medical_conditions,
        current_medications
      });

      // Audit log
      createAuditLog({
        userId: req.user.id,
        action: AuditActions.PATIENT_CREATED,
        tableName: 'patients',
        recordId: patient.id,
        newValues: { email: existingUser.email, first_name, last_name, promoted: true },
        description: `Paciente ${first_name} ${last_name} creado (promoción de usuario existente)`,
        req
      });

      return ResponseBuilder.created(res, {
        ...patient,
        user: existingUser,
        promoted: true,
        message: 'Usuario existente agregado como paciente. Puede acceder con su contraseña actual.'
      }, 'Paciente creado exitosamente');
    }

    // CASE 3: New user - create from scratch
    const bcrypt = require('bcrypt');
    const tempPassword = `${cedula}${last_name.substring(0, 3).toUpperCase()}!`;
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    const { data: newUser, error: userError } = await this.db
      .from('users')
      .insert({
        email: email.toLowerCase(),
        password_hash: hashedPassword,
        first_name,
        last_name,
        cedula,
        phone_number,
        role_id: patientRole.id,
        is_active: status === 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id, email, first_name, last_name')
      .single();

    if (userError) {
      throw new ValidationError(`Error al crear usuario: ${userError.message}`);
    }

    // Create patient record
    const patient = await patientRepository.createForUser(newUser.id, {
      date_of_birth,
      gender,
      blood_type,
      address,
      city,
      state,
      emergency_contact_name,
      emergency_contact_phone,
      emergency_contact_relation,
      insurance_plan,
      insurance_number,
      allergies,
      medical_conditions,
      current_medications
    });

    // Audit log
    createAuditLog({
      userId: req.user.id,
      action: AuditActions.PATIENT_CREATED,
      tableName: 'patients',
      recordId: patient.id,
      newValues: { email, first_name, last_name },
      description: `Paciente ${first_name} ${last_name} creado con nueva cuenta`,
      req
    });

    return ResponseBuilder.created(res, {
      ...patient,
      user: newUser,
      temporary_password: tempPassword,
      message: 'Paciente creado exitosamente'
    }, 'Paciente creado exitosamente');
  });

  /**
   * DELETE /patients/:id
   * Soft delete patient (deactivate user)
   */
  delete = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const existing = await patientRepository.findByUserId(id);
    if (!existing) {
      throw new NotFoundError('Paciente', id);
    }

    // Deactivate user (soft delete)
    await userRepository.softDelete(id);

    // Audit log
    createAuditLog({
      userId: req.user.id,
      action: AuditActions.PATIENT_DELETED,
      tableName: 'patients',
      recordId: existing.id,
      oldValues: { user_id: id },
      newValues: { deactivated: true },
      description: `Paciente ${id} desactivado`,
      req
    });

    return ResponseBuilder.success(res, { id }, 200, 'Paciente desactivado exitosamente');
  });
}

module.exports = new PatientController();
