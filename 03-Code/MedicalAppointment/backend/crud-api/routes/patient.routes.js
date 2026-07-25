/**
 * Patient Routes
 * RESTful routes for patient management
 * 
 * @module crud-api/routes/patient.routes
 */

const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patient.controller');
const { authMiddleware, requireRole } = require('../../shared/middleware/auth.middleware');

// Apply authentication to all routes
router.use(authMiddleware);

/**
 * @route   GET /api/v1/patients/stats
 * @desc    Get patient statistics
 * @access  Admin
 */
router.get('/stats',
  /*
    #swagger.tags = ['Pacientes']
    #swagger.summary = 'Obtener estadisticas de pacientes'
    #swagger.description = 'Devuelve las cantidades total, activa e inactiva de usuarios con rol de paciente.'
    #swagger.security = [{ 'bearerAuth': [] }]
    #swagger.responses[200] = { description: 'Estadisticas de pacientes.' }
    #swagger.responses[401] = { description: 'JWT ausente, invalido o expirado.' }
    #swagger.responses[403] = { description: 'El usuario no tiene rol de administrador.' }
    #swagger.responses[500] = { description: 'Error interno al obtener las estadisticas.' }
  */
  requireRole('admin'),
  patientController.getStats
);

/**
 * @route   GET /api/v1/patients
 * @desc    Get all patients (admin/doctor)
 * @access  Admin, Doctor
 */
router.get('/',
  /*
    #swagger.tags = ['Pacientes']
    #swagger.summary = 'Listar pacientes'
    #swagger.description = 'Devuelve pacientes activos con sus datos de usuario, paginacion y busqueda opcional.'
    #swagger.security = [{ 'bearerAuth': [] }]
    #swagger.responses[200] = { description: 'Listado paginado de pacientes.' }
    #swagger.responses[401] = { description: 'JWT ausente, invalido o expirado.' }
    #swagger.responses[403] = { description: 'Rol no autorizado para listar pacientes.' }
    #swagger.responses[500] = { description: 'Error interno al listar los pacientes.' }
  */
  requireRole(['admin', 'doctor']),
  patientController.getAll
);

/**
 * @route   GET /api/v1/patients/me
 * @desc    Get current patient profile
 * @access  Patient
 */
router.get('/me',
  /*
    #swagger.tags = ['Pacientes']
    #swagger.summary = 'Obtener mi perfil de paciente'
    #swagger.description = 'Devuelve el perfil del paciente autenticado y crea el registro base si todavia no existe.'
    #swagger.security = [{ 'bearerAuth': [] }]
    #swagger.responses[200] = { description: 'Perfil del paciente autenticado.' }
    #swagger.responses[401] = { description: 'JWT ausente, invalido o expirado.' }
    #swagger.responses[403] = { description: 'El usuario no tiene rol de paciente.' }
    #swagger.responses[500] = { description: 'Error interno al obtener el perfil.' }
  */
  requireRole('patient'),
  patientController.getProfile
);

/**
 * @route   POST /api/v1/patients/with-user
 * @desc    Create patient with user account
 * @access  Admin
 */
router.post('/with-user',
  /*
    #swagger.tags = ['Pacientes']
    #swagger.summary = 'Crear paciente con cuenta de usuario'
    #swagger.description = 'Crea una cuenta y su perfil de paciente, o agrega el perfil a un usuario existente cuando promote_existing es true.'
    #swagger.security = [{ 'bearerAuth': [] }]
    #swagger.requestBody = {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['email', 'first_name', 'last_name', 'cedula'],
            properties: {
              email: { type: 'string', format: 'email', example: 'paciente@example.com' },
              first_name: { type: 'string', example: 'Ana' },
              last_name: { type: 'string', example: 'Perez' },
              cedula: { type: 'string', example: '1712345678' },
              phone_number: { type: 'string', example: '0991234567' },
              date_of_birth: { type: 'string', format: 'date', example: '1995-04-18' },
              gender: { type: 'string', example: 'female' },
              blood_type: { type: 'string', example: 'O+' },
              address: { type: 'string', example: 'Av. Principal 123' },
              city: { type: 'string', example: 'Quito' },
              state: { type: 'string', example: 'Pichincha' },
              emergency_contact_name: { type: 'string', example: 'Luis Perez' },
              emergency_contact_phone: { type: 'string', example: '0987654321' },
              emergency_contact_relation: { type: 'string', example: 'Padre' },
              insurance_plan: { type: 'string', example: 'Plan familiar' },
              insurance_number: { type: 'string', example: 'SEG-001' },
              allergies: { type: 'string', example: 'Penicilina' },
              medical_conditions: { type: 'string', example: 'Hipertension' },
              current_medications: { type: 'string', example: 'Losartan' },
              status: { type: 'string', example: 'active' },
              promote_existing: { type: 'boolean', example: false }
            }
          }
        }
      }
    }
    #swagger.responses[200] = { description: 'Usuario existente localizado; se requiere confirmacion de promocion.' }
    #swagger.responses[201] = { description: 'Paciente creado o usuario promovido.' }
    #swagger.responses[400] = { description: 'Datos invalidos, duplicados o en conflicto.' }
    #swagger.responses[401] = { description: 'JWT ausente, invalido o expirado.' }
    #swagger.responses[403] = { description: 'El usuario no tiene rol de administrador.' }
    #swagger.responses[500] = { description: 'Error interno al crear el paciente y su cuenta.' }
  */
  requireRole('admin'),
  patientController.createWithUser
);

/**
 * @route   GET /api/v1/patients/user/:userId
 * @desc    Get patient by user ID
 * @access  Doctor, Admin
 */
router.get('/user/:userId',
  /*
    #swagger.tags = ['Pacientes']
    #swagger.summary = 'Obtener paciente por user ID'
    #swagger.description = 'Devuelve el perfil de paciente asociado al usuario; devuelve null si el perfil no existe.'
    #swagger.security = [{ 'bearerAuth': [] }]
    #swagger.responses[200] = { description: 'Perfil del paciente o null.' }
    #swagger.responses[401] = { description: 'JWT ausente, invalido o expirado.' }
    #swagger.responses[403] = { description: 'Rol no autorizado para consultar el paciente.' }
    #swagger.responses[500] = { description: 'Error interno al obtener el paciente.' }
  */
  requireRole(['admin', 'doctor']),
  patientController.getByUserId
);

/**
 * @route   GET /api/v1/patients/:id
 * @desc    Get patient by ID
 * @access  Admin, Doctor
 */
router.get('/:id',
  /*
    #swagger.tags = ['Pacientes']
    #swagger.summary = 'Obtener paciente por ID'
    #swagger.description = 'Devuelve el perfil del paciente con los datos de usuario asociados.'
    #swagger.security = [{ 'bearerAuth': [] }]
    #swagger.responses[200] = { description: 'Detalle del paciente.' }
    #swagger.responses[401] = { description: 'JWT ausente, invalido o expirado.' }
    #swagger.responses[403] = { description: 'Rol no autorizado para consultar el paciente.' }
    #swagger.responses[404] = { description: 'Paciente no encontrado.' }
    #swagger.responses[500] = { description: 'Error interno al obtener el paciente.' }
  */
  requireRole(['admin', 'doctor']),
  patientController.getById
);

/**
 * @route   PUT /api/v1/patients/me
 * @desc    Update current patient profile
 * @access  Patient
 */
router.put('/me',
  /*
    #swagger.tags = ['Pacientes']
    #swagger.summary = 'Actualizar mi perfil de paciente'
    #swagger.description = 'Actualiza los campos de usuario y del perfil clinico del paciente autenticado.'
    #swagger.security = [{ 'bearerAuth': [] }]
    #swagger.requestBody = {
      required: false,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              first_name: { type: 'string', example: 'Ana' },
              last_name: { type: 'string', example: 'Perez' },
              phone_number: { type: 'string', example: '0991234567' },
              cedula: { type: 'string', example: '1712345678' },
              email: { type: 'string', format: 'email', example: 'paciente@example.com' },
              date_of_birth: { type: 'string', format: 'date', example: '1995-04-18' },
              gender: { type: 'string', example: 'female' },
              address: { type: 'string', example: 'Av. Principal 123' },
              city: { type: 'string', example: 'Quito' },
              state: { type: 'string', example: 'Pichincha' },
              province: { type: 'string', example: 'Pichincha' },
              postal_code: { type: 'string', example: '170101' },
              country: { type: 'string', example: 'Ecuador' },
              insurance_provider_id: { type: 'string', format: 'uuid', example: '00000000-0000-4000-8000-000000000006' },
              insurance_plan: { type: 'string', example: 'Plan familiar' },
              insurance_number: { type: 'string', example: 'SEG-001' },
              emergency_contact_name: { type: 'string', example: 'Luis Perez' },
              emergency_contact_phone: { type: 'string', example: '0987654321' },
              emergency_contact_relation: { type: 'string', example: 'Padre' },
              allergies: { type: 'string', example: 'Penicilina' },
              medical_conditions: { type: 'string', example: 'Hipertension' },
              chronic_conditions: { type: 'string', example: 'Hipertension' },
              current_medications: { type: 'string', example: 'Losartan' },
              blood_type: { type: 'string', example: 'O+' },
              height: { type: 'number', example: 1.65 },
              weight: { type: 'number', example: 62.5 },
              home_phone: { type: 'string', example: '022345678' },
              landline: { type: 'string', example: '022345678' }
            }
          }
        }
      }
    }
    #swagger.responses[200] = { description: 'Perfil actualizado.' }
    #swagger.responses[400] = { description: 'Datos de actualizacion invalidos.' }
    #swagger.responses[401] = { description: 'JWT ausente, invalido o expirado.' }
    #swagger.responses[403] = { description: 'El usuario no tiene rol de paciente.' }
    #swagger.responses[500] = { description: 'Error interno al actualizar el perfil.' }
  */
  requireRole('patient'),
  patientController.updateProfile
);

/**
 * @route   PUT /api/v1/patients/:id
 * @desc    Update patient by ID (admin only)
 * @access  Admin
 */
router.put('/:id',
  /*
    #swagger.tags = ['Pacientes']
    #swagger.summary = 'Actualizar paciente por ID'
    #swagger.description = 'Actualiza los campos del perfil de paciente identificado por su user ID.'
    #swagger.security = [{ 'bearerAuth': [] }]
    #swagger.requestBody = {
      required: false,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              date_of_birth: { type: 'string', format: 'date', example: '1995-04-18' },
              gender: { type: 'string', example: 'female' },
              address: { type: 'string', example: 'Av. Principal 123' },
              city: { type: 'string', example: 'Quito' },
              state: { type: 'string', example: 'Pichincha' },
              postal_code: { type: 'string', example: '170101' },
              country: { type: 'string', example: 'Ecuador' },
              insurance_provider_id: { type: 'string', format: 'uuid', example: '00000000-0000-4000-8000-000000000006' },
              insurance_plan: { type: 'string', example: 'Plan familiar' },
              insurance_number: { type: 'string', example: 'SEG-001' },
              emergency_contact_name: { type: 'string', example: 'Luis Perez' },
              emergency_contact_phone: { type: 'string', example: '0987654321' },
              emergency_contact_relation: { type: 'string', example: 'Padre' },
              allergies: { type: 'string', example: 'Penicilina' },
              medical_conditions: { type: 'string', example: 'Hipertension' },
              current_medications: { type: 'string', example: 'Losartan' },
              blood_type: { type: 'string', example: 'O+' },
              height: { type: 'number', example: 1.65 },
              weight: { type: 'number', example: 62.5 },
              home_phone: { type: 'string', example: '022345678' }
            }
          }
        }
      }
    }
    #swagger.responses[200] = { description: 'Paciente actualizado.' }
    #swagger.responses[400] = { description: 'Datos de actualizacion invalidos.' }
    #swagger.responses[401] = { description: 'JWT ausente, invalido o expirado.' }
    #swagger.responses[403] = { description: 'El usuario no tiene rol de administrador.' }
    #swagger.responses[404] = { description: 'Paciente no encontrado.' }
    #swagger.responses[500] = { description: 'Error interno al actualizar el paciente.' }
  */
  requireRole('admin'),
  patientController.update
);

/**
 * @route   DELETE /api/v1/patients/:id
 * @desc    Soft delete patient (admin only)
 * @access  Admin
 */
router.delete('/:id',
  /*
    #swagger.tags = ['Pacientes']
    #swagger.summary = 'Desactivar paciente'
    #swagger.description = 'Realiza la eliminacion logica desactivando la cuenta de usuario asociada al paciente.'
    #swagger.security = [{ 'bearerAuth': [] }]
    #swagger.responses[200] = { description: 'Paciente desactivado.' }
    #swagger.responses[401] = { description: 'JWT ausente, invalido o expirado.' }
    #swagger.responses[403] = { description: 'El usuario no tiene rol de administrador.' }
    #swagger.responses[404] = { description: 'Paciente no encontrado.' }
    #swagger.responses[500] = { description: 'Error interno al desactivar el paciente.' }
  */
  requireRole('admin'),
  patientController.delete
);

module.exports = router;
