/**
 * Doctor Routes
 * RESTful routes for doctor management
 * 
 * @module crud-api/routes/doctor.routes
 */

const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctor.controller');
const { authMiddleware, requireRole } = require('../../shared/middleware/auth.middleware');

// Public routes (no auth required)
/**
 * @route   GET /api/v1/doctors
 * @desc    Get all active doctors (public for patient booking)
 * @access  Public
 */
router.get('/',
  /*
    #swagger.tags = ['Doctores']
    #swagger.summary = 'Listar doctores activos'
    #swagger.description = 'Devuelve doctores activos con paginacion, busqueda y filtro opcional por especialidad.'
    #swagger.responses[200] = { description: 'Listado de doctores.' }
    #swagger.responses[500] = { description: 'Error interno al listar los doctores.' }
  */
  doctorController.getAll
);

/**
 * @route   GET /api/v1/doctors/specialty/:specialtyId
 * @desc    Get doctors by specialty
 * @access  Public
 */
router.get('/specialty/:specialtyId',
  /*
    #swagger.tags = ['Doctores']
    #swagger.summary = 'Listar doctores por especialidad'
    #swagger.description = 'Devuelve los doctores activos asociados a la especialidad indicada.'
    #swagger.responses[200] = { description: 'Doctores de la especialidad.' }
    #swagger.responses[500] = { description: 'Error interno al consultar los doctores.' }
  */
  doctorController.getBySpecialty
);

// Protected routes - MUST be before /:id route
/**
 * @route   GET /api/v1/doctors/me
 * @desc    Get current doctor profile
 * @access  Doctor
 */
router.get('/me',
  /*
    #swagger.tags = ['Doctores']
    #swagger.summary = 'Obtener mi perfil de doctor'
    #swagger.description = 'Devuelve el perfil de doctor asociado al usuario autenticado.'
    #swagger.security = [{ 'bearerAuth': [] }]
    #swagger.responses[200] = { description: 'Perfil del doctor autenticado.' }
    #swagger.responses[401] = { description: 'JWT ausente, invalido o expirado.' }
    #swagger.responses[403] = { description: 'El usuario no tiene rol de doctor.' }
    #swagger.responses[404] = { description: 'Perfil de doctor no encontrado.' }
    #swagger.responses[500] = { description: 'Error interno al obtener el perfil.' }
  */
  authMiddleware,
  requireRole('doctor'),
  doctorController.getProfile
);

/**
 * @route   PUT /api/v1/doctors/me
 * @desc    Update current doctor profile
 * @access  Doctor
 */
router.put('/me',
  /*
    #swagger.tags = ['Doctores']
    #swagger.summary = 'Actualizar mi perfil de doctor'
    #swagger.description = 'Actualiza datos personales del usuario y la biografia del perfil de doctor autenticado.'
    #swagger.security = [{ 'bearerAuth': [] }]
    #swagger.requestBody = {
      required: false,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              bio: { type: 'string', example: 'Medico con experiencia en atencion primaria.' },
              phone_number: { type: 'string', example: '0991234567' },
              first_name: { type: 'string', example: 'Carlos' },
              last_name: { type: 'string', example: 'Gomez' }
            }
          }
        }
      }
    }
    #swagger.responses[200] = { description: 'Perfil actualizado.' }
    #swagger.responses[400] = { description: 'Datos de actualizacion invalidos.' }
    #swagger.responses[401] = { description: 'JWT ausente, invalido o expirado.' }
    #swagger.responses[403] = { description: 'El usuario no tiene rol de doctor.' }
    #swagger.responses[404] = { description: 'Perfil de doctor no encontrado.' }
    #swagger.responses[500] = { description: 'Error interno al actualizar el perfil.' }
  */
  authMiddleware,
  requireRole('doctor'),
  doctorController.updateProfile
);

/**
 * @route   GET /api/v1/doctors/my-patients
 * @desc    Get patients of the current doctor
 * @access  Doctor
 */
router.get('/my-patients',
  /*
    #swagger.tags = ['Doctores']
    #swagger.summary = 'Listar mis pacientes'
    #swagger.description = 'Devuelve los pacientes unicos que tienen citas no canceladas con el doctor autenticado.'
    #swagger.security = [{ 'bearerAuth': [] }]
    #swagger.responses[200] = { description: 'Pacientes del doctor autenticado.' }
    #swagger.responses[401] = { description: 'JWT ausente, invalido o expirado.' }
    #swagger.responses[403] = { description: 'El usuario no tiene rol de doctor.' }
    #swagger.responses[404] = { description: 'Perfil de doctor no encontrado.' }
    #swagger.responses[500] = { description: 'Error interno al consultar los pacientes.' }
  */
  authMiddleware,
  requireRole('doctor'),
  doctorController.getMyPatients
);

/**
 * @route   POST /api/v1/doctors
 * @desc    Create new doctor (admin only)
 * @access  Admin
 */
router.post('/',
  /*
    #swagger.tags = ['Doctores']
    #swagger.summary = 'Crear perfil de doctor'
    #swagger.description = 'Crea un perfil de doctor para un usuario existente.'
    #swagger.security = [{ 'bearerAuth': [] }]
    #swagger.requestBody = {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['user_id', 'specialty_id'],
            properties: {
              user_id: { type: 'string', format: 'uuid', example: '00000000-0000-4000-8000-000000000001' },
              specialty_id: { type: 'string', format: 'uuid', example: '00000000-0000-4000-8000-000000000002' },
              professional_id: { type: 'string', example: 'MED-2026-001' },
              bio: { type: 'string', example: 'Especialista en medicina interna.' }
            }
          }
        }
      }
    }
    #swagger.responses[201] = { description: 'Perfil de doctor creado.' }
    #swagger.responses[400] = { description: 'Campos requeridos ausentes o el usuario ya tiene perfil de doctor.' }
    #swagger.responses[401] = { description: 'JWT ausente, invalido o expirado.' }
    #swagger.responses[403] = { description: 'El usuario no tiene rol de administrador.' }
    #swagger.responses[404] = { description: 'Usuario no encontrado.' }
    #swagger.responses[500] = { description: 'Error interno al crear el doctor.' }
  */
  authMiddleware,
  requireRole('admin'),
  doctorController.create
);

/**
 * @route   POST /api/v1/doctors/with-user
 * @desc    Create new doctor with user account (admin only)
 * @access  Admin
 */
router.post('/with-user',
  /*
    #swagger.tags = ['Doctores']
    #swagger.summary = 'Crear doctor con cuenta de usuario'
    #swagger.description = 'Crea una cuenta y su perfil de doctor, o promueve un usuario existente cuando promote_existing es true.'
    #swagger.security = [{ 'bearerAuth': [] }]
    #swagger.requestBody = {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['cedula', 'first_name', 'last_name', 'email', 'specialty_id'],
            properties: {
              cedula: { type: 'string', pattern: '^\\d{10}$', example: '1712345678' },
              first_name: { type: 'string', example: 'Carlos' },
              last_name: { type: 'string', example: 'Gomez' },
              email: { type: 'string', format: 'email', example: 'doctor@example.com' },
              phone_number: { type: 'string', example: '0991234567' },
              specialty_id: { type: 'string', format: 'uuid', example: '00000000-0000-4000-8000-000000000002' },
              license_number: { type: 'string', example: 'MED-2026-001' },
              status: { type: 'string', example: 'active' },
              promote_existing: { type: 'boolean', example: false }
            }
          }
        }
      }
    }
    #swagger.responses[200] = { description: 'Usuario existente localizado; se requiere confirmacion de promocion.' }
    #swagger.responses[201] = { description: 'Doctor creado o usuario promovido.' }
    #swagger.responses[400] = { description: 'Datos invalidos, duplicados o en conflicto.' }
    #swagger.responses[401] = { description: 'JWT ausente, invalido o expirado.' }
    #swagger.responses[403] = { description: 'El usuario no tiene rol de administrador.' }
    #swagger.responses[500] = { description: 'Error interno al crear el doctor y su cuenta.' }
  */
  authMiddleware,
  requireRole('admin'),
  doctorController.createWithUser
);

// Parameterized routes - MUST be after specific routes
/**
 * @route   GET /api/v1/doctors/:id
 * @desc    Get doctor by ID
 * @access  Public
 */
router.get('/:id',
  /*
    #swagger.tags = ['Doctores']
    #swagger.summary = 'Obtener doctor por ID'
    #swagger.description = 'Devuelve el doctor con los datos de usuario y especialidad asociados.'
    #swagger.responses[200] = { description: 'Detalle del doctor.' }
    #swagger.responses[404] = { description: 'Doctor no encontrado.' }
    #swagger.responses[500] = { description: 'Error interno al obtener el doctor.' }
  */
  doctorController.getById
);

/**
 * @route   PUT /api/v1/doctors/:id
 * @desc    Update doctor by ID (admin only)
 * @access  Admin
 */
router.put('/:id',
  /*
    #swagger.tags = ['Doctores']
    #swagger.summary = 'Actualizar doctor por ID'
    #swagger.description = 'Actualiza la especialidad, identificacion profesional o biografia de un doctor.'
    #swagger.security = [{ 'bearerAuth': [] }]
    #swagger.requestBody = {
      required: false,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              specialty_id: { type: 'string', format: 'uuid', example: '00000000-0000-4000-8000-000000000002' },
              professional_id: { type: 'string', example: 'MED-2026-001' },
              bio: { type: 'string', example: 'Especialista en medicina interna.' }
            }
          }
        }
      }
    }
    #swagger.responses[200] = { description: 'Doctor actualizado.' }
    #swagger.responses[400] = { description: 'Datos de actualizacion invalidos.' }
    #swagger.responses[401] = { description: 'JWT ausente, invalido o expirado.' }
    #swagger.responses[403] = { description: 'El usuario no tiene rol de administrador.' }
    #swagger.responses[404] = { description: 'Doctor no encontrado.' }
    #swagger.responses[500] = { description: 'Error interno al actualizar el doctor.' }
  */
  authMiddleware,
  requireRole('admin'),
  doctorController.update
);

/**
 * @route   POST /api/v1/doctors/:id/reset-password
 * @desc    Reset doctor password to a new temporary password (admin only)
 * @access  Admin
 */
router.post('/:id/reset-password',
  /*
    #swagger.tags = ['Doctores']
    #swagger.summary = 'Restablecer password de doctor'
    #swagger.description = 'Genera un password temporal nuevo y actualiza la cuenta asociada al doctor.'
    #swagger.security = [{ 'bearerAuth': [] }]
    #swagger.responses[200] = { description: 'Password restablecido y password temporal devuelto.' }
    #swagger.responses[400] = { description: 'No fue posible actualizar el password.' }
    #swagger.responses[401] = { description: 'JWT ausente, invalido o expirado.' }
    #swagger.responses[403] = { description: 'El usuario no tiene rol de administrador.' }
    #swagger.responses[404] = { description: 'Doctor o usuario asociado no encontrado.' }
    #swagger.responses[500] = { description: 'Error interno al restablecer el password.' }
  */
  authMiddleware,
  requireRole('admin'),
  doctorController.resetPassword
);

/**
 * @route   DELETE /api/v1/doctors/:id
 * @desc    Soft delete doctor (admin only)
 * @access  Admin
 */
router.delete('/:id',
  /*
    #swagger.tags = ['Doctores']
    #swagger.summary = 'Desactivar doctor'
    #swagger.description = 'Realiza la eliminacion logica del doctor estableciendo su estado activo en false.'
    #swagger.security = [{ 'bearerAuth': [] }]
    #swagger.responses[200] = { description: 'Doctor desactivado.' }
    #swagger.responses[401] = { description: 'JWT ausente, invalido o expirado.' }
    #swagger.responses[403] = { description: 'El usuario no tiene rol de administrador.' }
    #swagger.responses[404] = { description: 'Doctor no encontrado.' }
    #swagger.responses[500] = { description: 'Error interno al desactivar el doctor.' }
  */
  authMiddleware,
  requireRole('admin'),
  doctorController.delete
);

module.exports = router;
