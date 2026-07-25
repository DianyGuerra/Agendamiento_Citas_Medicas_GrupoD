/**
 * Appointment Routes
 * RESTful routes for appointment management
 * 
 * @module crud-api/routes/appointment.routes
 */

const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointment.controller');
const { authMiddleware, requireRole } = require('../../shared/middleware/auth.middleware');

// Apply authentication to all routes
router.use(authMiddleware);

/**
 * @route   GET /api/v1/appointments
 * @desc    Get appointments for current user or all (admin)
 * @access  Authenticated
 */
router.get('/',
  /*
    #swagger.tags = ['Citas']
    #swagger.summary = 'Listar citas'
    #swagger.description = 'Lista las citas con paginacion y filtros opcionales por estado, doctor o paciente.'
    #swagger.security = [{ 'bearerAuth': [] }]
    #swagger.responses[200] = { description: 'Listado paginado de citas.' }
    #swagger.responses[401] = { description: 'JWT ausente, invalido o expirado.' }
    #swagger.responses[500] = { description: 'Error interno al listar las citas.' }
  */
  appointmentController.getAll
);

/**
 * @route   GET /api/v1/appointments/unbilled
 * @desc    Get completed appointments without billing (for invoice generation)
 * @access  Admin
 */
router.get('/unbilled',
  /*
    #swagger.tags = ['Citas']
    #swagger.summary = 'Listar citas completadas sin facturar'
    #swagger.description = 'Devuelve las citas completadas que todavia no tienen un registro de facturacion.'
    #swagger.security = [{ 'bearerAuth': [] }]
    #swagger.responses[200] = { description: 'Listado de citas sin facturar.' }
    #swagger.responses[401] = { description: 'JWT ausente, invalido o expirado.' }
    #swagger.responses[403] = { description: 'El usuario no tiene rol de administrador.' }
    #swagger.responses[500] = { description: 'Error interno al consultar las citas sin facturar.' }
  */
  requireRole('admin'),
  appointmentController.getUnbilled
);

/**
 * @route   GET /api/v1/appointments/patient
 * @desc    Get appointments for current logged-in patient
 * @access  Patient
 */
router.get('/patient',
  /*
    #swagger.tags = ['Citas']
    #swagger.summary = 'Listar mis citas como paciente'
    #swagger.description = 'Devuelve las citas del paciente autenticado con filtros opcionales por estado y proximidad.'
    #swagger.security = [{ 'bearerAuth': [] }]
    #swagger.responses[200] = { description: 'Citas del paciente autenticado.' }
    #swagger.responses[401] = { description: 'JWT ausente, invalido o expirado.' }
    #swagger.responses[403] = { description: 'El usuario no tiene rol de paciente.' }
    #swagger.responses[500] = { description: 'Error interno al consultar las citas del paciente.' }
  */
  requireRole('patient'),
  appointmentController.getByPatient
);

/**
 * @route   GET /api/v1/appointments/by-patient/:patientUserId
 * @desc    Get appointments for a specific patient (used by doctors)
 * @access  Doctor
 */
router.get('/by-patient/:patientUserId',
  /*
    #swagger.tags = ['Citas']
    #swagger.summary = 'Listar citas de un paciente'
    #swagger.description = 'Devuelve las citas del paciente identificado por su user ID para consulta del doctor.'
    #swagger.security = [{ 'bearerAuth': [] }]
    #swagger.responses[200] = { description: 'Citas del paciente indicado.' }
    #swagger.responses[401] = { description: 'JWT ausente, invalido o expirado.' }
    #swagger.responses[403] = { description: 'El usuario no tiene rol de doctor.' }
    #swagger.responses[500] = { description: 'Error interno al consultar las citas del paciente.' }
  */
  requireRole('doctor'),
  appointmentController.getByPatientId
);

/**
 * @route   GET /api/v1/appointments/doctor
 * @desc    Get appointments for current logged-in doctor
 * @access  Doctor
 */
router.get('/doctor',
  /*
    #swagger.tags = ['Citas']
    #swagger.summary = 'Listar mis citas como doctor'
    #swagger.description = 'Devuelve las citas asignadas al doctor autenticado con filtros opcionales de fecha y estado.'
    #swagger.security = [{ 'bearerAuth': [] }]
    #swagger.responses[200] = { description: 'Citas del doctor autenticado.' }
    #swagger.responses[401] = { description: 'JWT ausente, invalido o expirado.' }
    #swagger.responses[403] = { description: 'El usuario no tiene rol de doctor.' }
    #swagger.responses[404] = { description: 'Perfil de doctor no encontrado.' }
    #swagger.responses[500] = { description: 'Error interno al consultar las citas del doctor.' }
  */
  requireRole('doctor'),
  appointmentController.getByDoctor
);

/**
 * @route   GET /api/v1/appointments/:id
 * @desc    Get appointment by ID
 * @access  Authenticated
 */
router.get('/:id',
  /*
    #swagger.tags = ['Citas']
    #swagger.summary = 'Obtener cita por ID'
    #swagger.description = 'Devuelve el detalle de una cita; includeCancelled=true permite consultar citas canceladas.'
    #swagger.security = [{ 'bearerAuth': [] }]
    #swagger.responses[200] = { description: 'Detalle de la cita.' }
    #swagger.responses[401] = { description: 'JWT ausente, invalido o expirado.' }
    #swagger.responses[404] = { description: 'Cita no encontrada.' }
    #swagger.responses[500] = { description: 'Error interno al obtener la cita.' }
  */
  appointmentController.getById
);

/**
 * @route   POST /api/v1/appointments
 * @desc    Create new appointment
 * @access  Patient
 */
router.post('/',
  /*
    #swagger.tags = ['Citas']
    #swagger.summary = 'Crear cita'
    #swagger.description = 'Crea una cita para el paciente autenticado y calcula su hora de finalizacion.'
    #swagger.security = [{ 'bearerAuth': [] }]
    #swagger.requestBody = {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['doctor_id', 'scheduled_start'],
            properties: {
              doctor_id: { type: 'string', format: 'uuid', example: '00000000-0000-4000-8000-000000000001' },
              scheduled_start: { type: 'string', format: 'date-time', example: '2026-07-01T09:30:00.000Z' },
              reason: { type: 'string', example: 'Consulta general' },
              duration_minutes: { type: 'integer', example: 30 },
              patient_user_id: { type: 'string', format: 'uuid', example: '00000000-0000-4000-8000-000000000003' }
            }
          }
        }
      }
    }
    #swagger.responses[201] = { description: 'Cita creada.' }
    #swagger.responses[400] = { description: 'doctor_id o scheduled_start ausentes o invalidos.' }
    #swagger.responses[401] = { description: 'JWT ausente, invalido o expirado.' }
    #swagger.responses[403] = { description: 'El usuario no tiene rol de paciente.' }
    #swagger.responses[404] = { description: 'Doctor no encontrado o inactivo.' }
    #swagger.responses[500] = { description: 'Error interno al crear la cita.' }
  */
  requireRole('patient'),
  appointmentController.create
);

/**
 * @route   PUT /api/v1/appointments/:id
 * @desc    Update appointment
 * @access  Authenticated (owner or admin)
 */
router.put('/:id',
  /*
    #swagger.tags = ['Citas']
    #swagger.summary = 'Actualizar cita'
    #swagger.description = 'Actualiza el motivo y las referencias de sala de una cita existente.'
    #swagger.security = [{ 'bearerAuth': [] }]
    #swagger.requestBody = {
      required: false,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              reason: { type: 'string', example: 'Control medico' },
              room_id: { type: 'string', format: 'uuid', example: '00000000-0000-4000-8000-000000000004' },
              consultation_room_id: { type: 'string', format: 'uuid', example: '00000000-0000-4000-8000-000000000005' }
            }
          }
        }
      }
    }
    #swagger.responses[200] = { description: 'Cita actualizada.' }
    #swagger.responses[400] = { description: 'La cita esta cancelada o la sala no esta disponible.' }
    #swagger.responses[401] = { description: 'JWT ausente, invalido o expirado.' }
    #swagger.responses[404] = { description: 'Cita o sala de consulta no encontrada.' }
    #swagger.responses[500] = { description: 'Error interno al actualizar la cita.' }
  */
  appointmentController.update
);

/**
 * @route   PATCH /api/v1/appointments/:id
 * @desc    Partial update appointment (room, doctor assignment)
 * @access  Admin
 */
router.patch('/:id',
  /*
    #swagger.tags = ['Citas']
    #swagger.summary = 'Reasignar doctor o sala de una cita'
    #swagger.description = 'Realiza una actualizacion parcial administrativa del doctor o de las referencias de sala.'
    #swagger.security = [{ 'bearerAuth': [] }]
    #swagger.requestBody = {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              doctor_id: { type: 'string', format: 'uuid', example: '00000000-0000-4000-8000-000000000001' },
              consultation_room_id: { type: 'string', format: 'uuid', example: '00000000-0000-4000-8000-000000000005' },
              room_id: { type: 'string', format: 'uuid', example: '00000000-0000-4000-8000-000000000004' }
            }
          }
        }
      }
    }
    #swagger.responses[200] = { description: 'Cita actualizada parcialmente.' }
    #swagger.responses[400] = { description: 'No hay campos para actualizar o la cita esta cancelada.' }
    #swagger.responses[401] = { description: 'JWT ausente, invalido o expirado.' }
    #swagger.responses[403] = { description: 'El usuario no tiene rol de administrador.' }
    #swagger.responses[404] = { description: 'Cita, doctor o sala no encontrada.' }
    #swagger.responses[500] = { description: 'Error interno al actualizar la cita.' }
  */
  requireRole('admin'),
  appointmentController.partialUpdate
);

/**
 * @route   PATCH /api/v1/appointments/:id/status
 * @desc    Update appointment status
 * @access  Doctor, Admin
 */
router.patch('/:id/status',
  /*
    #swagger.tags = ['Citas']
    #swagger.summary = 'Actualizar estado de una cita'
    #swagger.description = 'Cambia el status_id de la cita y genera una factura automaticamente cuando pasa a completada.'
    #swagger.security = [{ 'bearerAuth': [] }]
    #swagger.requestBody = {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['status_id'],
            properties: {
              status_id: { type: 'integer', example: 4 }
            }
          }
        }
      }
    }
    #swagger.responses[200] = { description: 'Estado de la cita actualizado.' }
    #swagger.responses[400] = { description: 'status_id ausente o cita cancelada.' }
    #swagger.responses[401] = { description: 'JWT ausente, invalido o expirado.' }
    #swagger.responses[403] = { description: 'Rol no autorizado para cambiar el estado.' }
    #swagger.responses[404] = { description: 'Cita no encontrada.' }
    #swagger.responses[500] = { description: 'Error interno al actualizar el estado.' }
  */
  requireRole(['doctor', 'admin']),
  appointmentController.updateStatus
);

/**
 * @route   PATCH /api/v1/appointments/:id/confirm
 * @desc    Confirm appointment
 * @access  Admin
 */
router.patch('/:id/confirm',
  /*
    #swagger.tags = ['Citas']
    #swagger.summary = 'Confirmar cita'
    #swagger.description = 'Cambia el estado de la cita a confirmado.'
    #swagger.security = [{ 'bearerAuth': [] }]
    #swagger.responses[200] = { description: 'Cita confirmada.' }
    #swagger.responses[400] = { description: 'La cita esta cancelada o ya fue confirmada.' }
    #swagger.responses[401] = { description: 'JWT ausente, invalido o expirado.' }
    #swagger.responses[403] = { description: 'El usuario no tiene rol de administrador.' }
    #swagger.responses[404] = { description: 'Cita no encontrada.' }
    #swagger.responses[500] = { description: 'Error interno al confirmar la cita.' }
  */
  requireRole('admin'),
  appointmentController.confirm
);

/**
 * @route   PATCH /api/v1/appointments/:id/check-in
 * @desc    Register patient check-in
 * @access  Admin
 */
router.patch('/:id/check-in',
  /*
    #swagger.tags = ['Citas']
    #swagger.summary = 'Registrar check-in del paciente'
    #swagger.description = 'Registra la fecha y hora de llegada del paciente a la cita.'
    #swagger.security = [{ 'bearerAuth': [] }]
    #swagger.responses[200] = { description: 'Check-in registrado.' }
    #swagger.responses[400] = { description: 'La cita esta cancelada o ya tiene check-in.' }
    #swagger.responses[401] = { description: 'JWT ausente, invalido o expirado.' }
    #swagger.responses[403] = { description: 'El usuario no tiene rol de administrador.' }
    #swagger.responses[404] = { description: 'Cita no encontrada.' }
    #swagger.responses[500] = { description: 'Error interno al registrar el check-in.' }
  */
  requireRole('admin'),
  appointmentController.checkIn
);

/**
 * @route   PATCH /api/v1/appointments/:id/cancel
 * @desc    Cancel appointment
 * @access  Admin
 */
router.patch('/:id/cancel',
  /*
    #swagger.tags = ['Citas']
    #swagger.summary = 'Cancelar cita como administrador'
    #swagger.description = 'Cancela la cita, registra la auditoria y solicita el envio de la notificacion al paciente.'
    #swagger.security = [{ 'bearerAuth': [] }]
    #swagger.requestBody = {
      required: false,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              reason: { type: 'string', example: 'Cancelada por administracion' }
            }
          }
        }
      }
    }
    #swagger.responses[200] = { description: 'Cita cancelada.' }
    #swagger.responses[400] = { description: 'La cita ya esta cancelada.' }
    #swagger.responses[401] = { description: 'JWT ausente, invalido o expirado.' }
    #swagger.responses[403] = { description: 'El usuario no tiene rol de administrador.' }
    #swagger.responses[404] = { description: 'Cita no encontrada.' }
    #swagger.responses[500] = { description: 'Error interno al cancelar la cita.' }
  */
  requireRole('admin'),
  appointmentController.cancel
);

/**
 * @route   DELETE /api/v1/appointments/:id
 * @desc    Cancel appointment (soft delete)
 * @access  Authenticated (owner or admin)
 */
router.delete('/:id',
  /*
    #swagger.tags = ['Citas']
    #swagger.summary = 'Cancelar cita'
    #swagger.description = 'Realiza la cancelacion logica de la cita autenticada y permite registrar un motivo.'
    #swagger.security = [{ 'bearerAuth': [] }]
    #swagger.requestBody = {
      required: false,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              reason: { type: 'string', example: 'Cancelada por el usuario' }
            }
          }
        }
      }
    }
    #swagger.responses[200] = { description: 'Cita cancelada.' }
    #swagger.responses[400] = { description: 'La cita ya fue cancelada.' }
    #swagger.responses[401] = { description: 'JWT ausente, invalido o expirado.' }
    #swagger.responses[404] = { description: 'Cita no encontrada.' }
    #swagger.responses[500] = { description: 'Error interno al cancelar la cita.' }
  */
  appointmentController.delete
);

module.exports = router;
