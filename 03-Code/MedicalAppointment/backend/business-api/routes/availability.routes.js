/**
 * Availability Routes
 * Business logic routes for availability checking
 * 
 * @module business-api/routes/availability.routes
 */

const express = require('express');
const router = express.Router();
const availabilityController = require('../controllers/availability.controller');
const { optionalAuth } = require('../../shared/middleware/auth.middleware');

// All routes are public or use optional auth for better results

/**
 * @route   GET /api/v1/availability/doctor/:doctorId/date/:date
 * @desc    Get available slots for a doctor on a specific date
 * @access  Public
 */
router.get('/doctor/:doctorId/date/:date',
  /*
    #swagger.tags = ['Disponibilidad']
    #swagger.summary = 'Consultar horarios disponibles por fecha'
    #swagger.description = 'Devuelve los bloques disponibles de un doctor para una fecha especifica, considerando horario, excepciones y citas existentes.'
    #swagger.responses[200] = { description: 'Horarios disponibles para la fecha.' }
    #swagger.responses[400] = { description: 'Doctor o fecha requeridos.' }
    #swagger.responses[409] = { description: 'La fecha solicitada incumple una regla de negocio.' }
    #swagger.responses[500] = { description: 'Error interno al calcular la disponibilidad.' }
  */
  availabilityController.getSlots
);

/**
 * @route   GET /api/v1/availability/doctor/:doctorId/weekly
 * @desc    Get weekly availability for a doctor
 * @access  Public
 */
router.get('/doctor/:doctorId/weekly',
  /*
    #swagger.tags = ['Disponibilidad']
    #swagger.summary = 'Consultar disponibilidad semanal'
    #swagger.description = 'Devuelve la disponibilidad de un doctor desde startDate durante la cantidad de semanas indicada; por defecto usa hoy y cuatro semanas.'
    #swagger.responses[200] = { description: 'Mapa de disponibilidad por fecha.' }
    #swagger.responses[400] = { description: 'Parametros de consulta invalidos.' }
    #swagger.responses[500] = { description: 'Error interno al calcular la disponibilidad semanal.' }
  */
  availabilityController.getWeeklyAvailability
);

/**
 * @route   GET /api/v1/availability/doctor/:doctorId/next
 * @desc    Get next available slot for a doctor
 * @access  Public
 */
router.get('/doctor/:doctorId/next',
  /*
    #swagger.tags = ['Disponibilidad']
    #swagger.summary = 'Consultar proximo horario disponible'
    #swagger.description = 'Busca el siguiente bloque disponible del doctor dentro de daysAhead; por defecto consulta treinta dias.'
    #swagger.responses[200] = { description: 'Proximo horario disponible o null si no existe.' }
    #swagger.responses[400] = { description: 'Parametro de consulta invalido.' }
    #swagger.responses[500] = { description: 'Error interno al buscar el siguiente horario.' }
  */
  availabilityController.getNextAvailable
);

/**
 * @route   POST /api/v1/availability/check
 * @desc    Check if a specific slot is available
 * @access  Public
 */
router.post('/check',
  /*
    #swagger.tags = ['Disponibilidad']
    #swagger.summary = 'Verificar disponibilidad de un horario'
    #swagger.description = 'Comprueba si la hora indicada esta disponible para el doctor en la fecha solicitada.'
    #swagger.requestBody = {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['doctorId', 'date', 'time'],
            properties: {
              doctorId: { type: 'string', format: 'uuid', example: '00000000-0000-4000-8000-000000000001' },
              date: { type: 'string', format: 'date', example: '2026-07-01' },
              time: { type: 'string', example: '09:30' }
            }
          }
        }
      }
    }
    #swagger.responses[200] = { description: 'Resultado de disponibilidad del horario.' }
    #swagger.responses[400] = { description: 'doctorId, date o time ausentes.' }
    #swagger.responses[409] = { description: 'La fecha solicitada incumple una regla de negocio.' }
    #swagger.responses[500] = { description: 'Error interno al verificar el horario.' }
  */
  availabilityController.checkSlot
);

module.exports = router;
