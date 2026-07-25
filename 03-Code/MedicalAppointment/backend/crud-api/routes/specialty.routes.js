/**
 * Specialty Routes
 * RESTful routes for specialty management
 * 
 * @module crud-api/routes/specialty.routes
 */

const express = require('express');
const router = express.Router();
const specialtyController = require('../controllers/specialty.controller');
const { authMiddleware, requireRole } = require('../../shared/middleware/auth.middleware');

/**
 * @route   GET /api/v1/specialties
 * @desc    Get all specialties
 * @access  Public
 */
router.get('/',
  /*
    #swagger.tags = ['Especialidades']
    #swagger.summary = 'Listar especialidades'
    #swagger.description = 'Devuelve todas las especialidades ordenadas por nombre.'
    #swagger.responses[200] = { description: 'Listado de especialidades.' }
    #swagger.responses[500] = { description: 'Error interno al listar las especialidades.' }
  */
  specialtyController.getAll
);

/**
 * @route   GET /api/v1/specialties/stats
 * @desc    Get specialty statistics
 * @access  Public
 */
router.get('/stats',
  /*
    #swagger.tags = ['Especialidades']
    #swagger.summary = 'Obtener estadisticas de especialidades'
    #swagger.description = 'Devuelve conteos de especialidades y doctores, incluida la especialidad con mas doctores activos.'
    #swagger.responses[200] = { description: 'Estadisticas de especialidades.' }
    #swagger.responses[500] = { description: 'Error interno al obtener las estadisticas.' }
  */
  specialtyController.getStats
);

/**
 * @route   GET /api/v1/specialties/:id
 * @desc    Get specialty by ID
 * @access  Public
 */
router.get('/:id',
  /*
    #swagger.tags = ['Especialidades']
    #swagger.summary = 'Obtener especialidad por ID'
    #swagger.description = 'Devuelve la especialidad y la cantidad de doctores activos asociados.'
    #swagger.responses[200] = { description: 'Detalle de la especialidad.' }
    #swagger.responses[404] = { description: 'Especialidad no encontrada.' }
    #swagger.responses[500] = { description: 'Error interno al obtener la especialidad.' }
  */
  specialtyController.getById
);

// Protected routes (admin only)
/**
 * @route   POST /api/v1/specialties
 * @desc    Create new specialty
 * @access  Admin
 */
router.post('/',
  /*
    #swagger.tags = ['Especialidades']
    #swagger.summary = 'Crear especialidad'
    #swagger.description = 'Crea una especialidad con nombre unico, descripcion y tarifa opcionales.'
    #swagger.security = [{ 'bearerAuth': [] }]
    #swagger.requestBody = {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['name'],
            properties: {
              name: { type: 'string', example: 'Cardiologia' },
              description: { type: 'string', example: 'Atencion especializada del sistema cardiovascular.' },
              consultation_fee: { type: 'number', format: 'float', example: 45.5 }
            }
          }
        }
      }
    }
    #swagger.responses[201] = { description: 'Especialidad creada.' }
    #swagger.responses[400] = { description: 'Nombre ausente o duplicado, o datos invalidos.' }
    #swagger.responses[401] = { description: 'JWT ausente, invalido o expirado.' }
    #swagger.responses[403] = { description: 'El usuario no tiene rol de administrador.' }
    #swagger.responses[500] = { description: 'Error interno al crear la especialidad.' }
  */
  authMiddleware,
  requireRole('admin'),
  specialtyController.create
);

/**
 * @route   PUT /api/v1/specialties/:id
 * @desc    Update specialty
 * @access  Admin
 */
router.put('/:id',
  /*
    #swagger.tags = ['Especialidades']
    #swagger.summary = 'Actualizar especialidad'
    #swagger.description = 'Actualiza el nombre, descripcion o tarifa de consulta de una especialidad.'
    #swagger.security = [{ 'bearerAuth': [] }]
    #swagger.requestBody = {
      required: false,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              name: { type: 'string', example: 'Cardiologia' },
              description: { type: 'string', example: 'Atencion especializada del sistema cardiovascular.' },
              consultation_fee: { type: 'number', format: 'float', example: 50 }
            }
          }
        }
      }
    }
    #swagger.responses[200] = { description: 'Especialidad actualizada.' }
    #swagger.responses[400] = { description: 'Nombre duplicado o datos invalidos.' }
    #swagger.responses[401] = { description: 'JWT ausente, invalido o expirado.' }
    #swagger.responses[403] = { description: 'El usuario no tiene rol de administrador.' }
    #swagger.responses[404] = { description: 'Especialidad no encontrada.' }
    #swagger.responses[500] = { description: 'Error interno al actualizar la especialidad.' }
  */
  authMiddleware,
  requireRole('admin'),
  specialtyController.update
);

/**
 * @route   DELETE /api/v1/specialties/:id
 * @desc    Soft delete specialty
 * @access  Admin
 */
router.delete('/:id',
  /*
    #swagger.tags = ['Especialidades']
    #swagger.summary = 'Eliminar especialidad'
    #swagger.description = 'Elimina la especialidad indicada; la tabla no dispone de eliminacion logica.'
    #swagger.security = [{ 'bearerAuth': [] }]
    #swagger.responses[200] = { description: 'Especialidad eliminada.' }
    #swagger.responses[401] = { description: 'JWT ausente, invalido o expirado.' }
    #swagger.responses[403] = { description: 'El usuario no tiene rol de administrador.' }
    #swagger.responses[404] = { description: 'Especialidad no encontrada.' }
    #swagger.responses[500] = { description: 'Error interno al eliminar la especialidad.' }
  */
  authMiddleware,
  requireRole('admin'),
  specialtyController.delete
);

module.exports = router;
