/**
 * Scheduling Routes
 * Business logic routes for appointment scheduling
 * 
 * @module business-api/routes/scheduling.routes
 */

const express = require('express');
const router = express.Router();
const schedulingController = require('../controllers/scheduling.controller');
const { authMiddleware, requireRole } = require('../../shared/middleware/auth.middleware');

// =========================================================================
// Public Routes (no auth required)
// =========================================================================

/**
 * @route   POST /api/v1/scheduling/confirm-public/:appointmentId
 * @desc    Confirm an appointment publicly (via email link, no auth required)
 * @access  Public
 */
router.post('/confirm-public/:appointmentId',
  /*
    #swagger.tags = ['Agendamiento']
    #swagger.summary = 'Confirmar cita desde enlace publico'
    #swagger.description = 'Confirma una cita sin autenticacion usando el appointmentId y el token enviado como parametro de consulta.'
    #swagger.responses[200] = { description: 'Cita confirmada.' }
    #swagger.responses[400] = { description: 'Token o identificador invalido.' }
    #swagger.responses[404] = { description: 'Cita no encontrada.' }
    #swagger.responses[409] = { description: 'La cita no puede confirmarse en su estado actual.' }
    #swagger.responses[500] = { description: 'Error interno al confirmar la cita.' }
  */
  schedulingController.confirmAppointmentPublic
);

// =========================================================================
// Protected Routes (auth required)
// =========================================================================

// Apply authentication to remaining routes
router.use(authMiddleware);

/**
 * @route   POST /api/v1/scheduling/book
 * @desc    Book a new appointment
 * @access  Patient
 */
router.post('/book',
  /*
    #swagger.tags = ['Agendamiento']
    #swagger.summary = 'Agendar una cita'
    #swagger.description = 'Agenda una cita para el paciente autenticado, valida al doctor y comprueba conflictos y disponibilidad.'
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
              reason: { type: 'string', example: 'Consulta general' }
            }
          }
        }
      }
    }
    #swagger.responses[201] = { description: 'Cita agendada.' }
    #swagger.responses[400] = { description: 'Campos requeridos ausentes o invalidos.' }
    #swagger.responses[401] = { description: 'JWT ausente, invalido o expirado.' }
    #swagger.responses[403] = { description: 'El usuario no tiene rol de paciente.' }
    #swagger.responses[404] = { description: 'Doctor no encontrado o inactivo.' }
    #swagger.responses[409] = { description: 'Horario no disponible o conflicto con otra cita.' }
    #swagger.responses[500] = { description: 'Error interno al agendar la cita.' }
  */
  requireRole('patient'),
  schedulingController.bookAppointment
);

/**
 * @route   PUT /api/v1/scheduling/reschedule/:appointmentId
 * @desc    Reschedule an existing appointment
 * @access  Patient, Admin
 */
router.put('/reschedule/:appointmentId',
  /*
    #swagger.tags = ['Agendamiento']
    #swagger.summary = 'Reprogramar una cita'
    #swagger.description = 'Cambia la fecha y hora de una cita existente si su estado y el nuevo horario lo permiten.'
    #swagger.security = [{ 'bearerAuth': [] }]
    #swagger.requestBody = {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['scheduled_start'],
            properties: {
              scheduled_start: { type: 'string', format: 'date-time', example: '2026-07-02T10:00:00.000Z' }
            }
          }
        }
      }
    }
    #swagger.responses[200] = { description: 'Cita reprogramada.' }
    #swagger.responses[400] = { description: 'scheduled_start ausente o invalido.' }
    #swagger.responses[401] = { description: 'JWT ausente, invalido o expirado.' }
    #swagger.responses[403] = { description: 'Rol no autorizado para reprogramar.' }
    #swagger.responses[404] = { description: 'Cita no encontrada.' }
    #swagger.responses[409] = { description: 'Estado no reprogramable o nuevo horario no disponible.' }
    #swagger.responses[500] = { description: 'Error interno al reprogramar la cita.' }
  */
  requireRole(['patient', 'admin']),
  schedulingController.rescheduleAppointment
);

/**
 * @route   POST /api/v1/scheduling/cancel/:appointmentId
 * @desc    Cancel an appointment
 * @access  Patient, Doctor, Admin
 */
router.post('/cancel/:appointmentId',
  /*
    #swagger.tags = ['Agendamiento']
    #swagger.summary = 'Cancelar una cita'
    #swagger.description = 'Cancela una cita para el usuario autenticado y registra quien realizo la operacion.'
    #swagger.security = [{ 'bearerAuth': [] }]
    #swagger.requestBody = {
      required: false,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              reason: { type: 'string', example: 'No podre asistir' }
            }
          }
        }
      }
    }
    #swagger.responses[200] = { description: 'Cita cancelada.' }
    #swagger.responses[401] = { description: 'JWT ausente, invalido o expirado.' }
    #swagger.responses[404] = { description: 'Cita no encontrada.' }
    #swagger.responses[409] = { description: 'La cita no puede cancelarse en su estado actual.' }
    #swagger.responses[500] = { description: 'Error interno al cancelar la cita.' }
  */
  schedulingController.cancelAppointment
);

/**
 * @route   POST /api/v1/scheduling/confirm/:appointmentId
 * @desc    Confirm an appointment
 * @access  Doctor, Admin
 */
router.post('/confirm/:appointmentId',
  /*
    #swagger.tags = ['Agendamiento']
    #swagger.summary = 'Confirmar una cita'
    #swagger.description = 'Marca una cita como confirmada y registra la fecha de confirmacion.'
    #swagger.security = [{ 'bearerAuth': [] }]
    #swagger.responses[200] = { description: 'Cita confirmada.' }
    #swagger.responses[400] = { description: 'Identificador o solicitud invalida.' }
    #swagger.responses[401] = { description: 'JWT ausente, invalido o expirado.' }
    #swagger.responses[403] = { description: 'Rol no autorizado para confirmar.' }
    #swagger.responses[404] = { description: 'Cita no encontrada.' }
    #swagger.responses[500] = { description: 'Error interno al confirmar la cita.' }
  */
  requireRole(['doctor', 'admin']),
  schedulingController.confirmAppointment
);

/**
 * @route   POST /api/v1/scheduling/start/:appointmentId
 * @desc    Start a consultation
 * @access  Doctor
 */
router.post('/start/:appointmentId',
  /*
    #swagger.tags = ['Agendamiento']
    #swagger.summary = 'Iniciar consulta'
    #swagger.description = 'Inicia la consulta asociada a una cita y permite indicar una sala.'
    #swagger.security = [{ 'bearerAuth': [] }]
    #swagger.requestBody = {
      required: false,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              roomId: { type: 'string', format: 'uuid', example: '00000000-0000-4000-8000-000000000002' }
            }
          }
        }
      }
    }
    #swagger.responses[200] = { description: 'Consulta iniciada.' }
    #swagger.responses[400] = { description: 'Solicitud invalida.' }
    #swagger.responses[401] = { description: 'JWT ausente, invalido o expirado.' }
    #swagger.responses[403] = { description: 'El usuario no tiene rol de doctor.' }
    #swagger.responses[404] = { description: 'Cita o sala no encontrada.' }
    #swagger.responses[500] = { description: 'Error interno al iniciar la consulta.' }
  */
  requireRole('doctor'),
  schedulingController.startConsultation
);

/**
 * @route   POST /api/v1/scheduling/complete/:appointmentId
 * @desc    Complete a consultation
 * @access  Doctor
 */
router.post('/complete/:appointmentId',
  /*
    #swagger.tags = ['Agendamiento']
    #swagger.summary = 'Completar consulta'
    #swagger.description = 'Marca como completada la consulta correspondiente a la cita.'
    #swagger.security = [{ 'bearerAuth': [] }]
    #swagger.responses[200] = { description: 'Consulta completada.' }
    #swagger.responses[400] = { description: 'Solicitud invalida.' }
    #swagger.responses[401] = { description: 'JWT ausente, invalido o expirado.' }
    #swagger.responses[403] = { description: 'El usuario no tiene rol de doctor.' }
    #swagger.responses[404] = { description: 'Cita no encontrada.' }
    #swagger.responses[500] = { description: 'Error interno al completar la consulta.' }
  */
  requireRole('doctor'),
  schedulingController.completeConsultation
);

/**
 * @route   POST /api/v1/scheduling/no-show/:appointmentId
 * @desc    Mark patient as no-show
 * @access  Doctor, Admin
 */
router.post('/no-show/:appointmentId',
  /*
    #swagger.tags = ['Agendamiento']
    #swagger.summary = 'Marcar inasistencia'
    #swagger.description = 'Marca la cita indicada con el estado no_show.'
    #swagger.security = [{ 'bearerAuth': [] }]
    #swagger.responses[200] = { description: 'Inasistencia registrada.' }
    #swagger.responses[400] = { description: 'Solicitud invalida.' }
    #swagger.responses[401] = { description: 'JWT ausente, invalido o expirado.' }
    #swagger.responses[403] = { description: 'Rol no autorizado para registrar la inasistencia.' }
    #swagger.responses[404] = { description: 'Cita no encontrada.' }
    #swagger.responses[500] = { description: 'Error interno al registrar la inasistencia.' }
  */
  requireRole(['doctor', 'admin']),
  schedulingController.markNoShow
);

/**
 * @route   GET /api/v1/scheduling/statistics/doctor/:doctorId
 * @desc    Get appointment statistics for a doctor
 * @access  Doctor, Admin
 */
router.get('/statistics/doctor/:doctorId',
  /*
    #swagger.tags = ['Agendamiento']
    #swagger.summary = 'Obtener estadisticas de citas por doctor'
    #swagger.description = 'Devuelve estadisticas del doctor en el rango startDate y endDate; por defecto consulta los ultimos treinta dias.'
    #swagger.security = [{ 'bearerAuth': [] }]
    #swagger.responses[200] = { description: 'Estadisticas de citas del doctor.' }
    #swagger.responses[400] = { description: 'Rango de fechas invalido.' }
    #swagger.responses[401] = { description: 'JWT ausente, invalido o expirado.' }
    #swagger.responses[403] = { description: 'Rol no autorizado para consultar estadisticas.' }
    #swagger.responses[404] = { description: 'Doctor no encontrado.' }
    #swagger.responses[500] = { description: 'Error interno al obtener las estadisticas.' }
  */
  requireRole(['doctor', 'admin']),
  schedulingController.getDoctorStatistics
);

/**
 * @route   POST /api/v1/scheduling/cleanup-past
 * @desc    Mark past appointments as no_show automatically
 * @access  Doctor, Admin
 */
router.post('/cleanup-past',
  /*
    #swagger.tags = ['Agendamiento']
    #swagger.summary = 'Actualizar citas pasadas sin atencion'
    #swagger.description = 'Marca como no_show las citas programadas o confirmadas cuyo horario ya finalizo.'
    #swagger.security = [{ 'bearerAuth': [] }]
    #swagger.responses[200] = { description: 'Cantidad de citas actualizadas.' }
    #swagger.responses[401] = { description: 'JWT ausente, invalido o expirado.' }
    #swagger.responses[403] = { description: 'Rol no autorizado para ejecutar la limpieza.' }
    #swagger.responses[500] = { description: 'Error interno al actualizar las citas pasadas.' }
  */
  requireRole(['doctor', 'admin']),
  schedulingController.cleanupPastAppointments
);

module.exports = router;
