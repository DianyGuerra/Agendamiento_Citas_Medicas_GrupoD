/**
 * Availability Controller
 * Handles HTTP requests for availability business logic
 * 
 * @module business-api/controllers/AvailabilityController
 */

const availabilityService = require('../services/availability.service');
const ResponseBuilder = require('../../shared/utils/responseBuilder.utils');
const { asyncHandler } = require('../../shared/middleware/errorHandler.middleware');
const { ValidationError } = require('../../shared/errors');

class AvailabilityController {
  /**
   * GET /availability/doctor/:doctorId/date/:date
   * Get available slots for a doctor on a specific date
   */
  getSlots = asyncHandler(async (req, res) => {
    const { doctorId, date } = req.params;

    if (!doctorId || !date) {
      throw new ValidationError('doctorId y date son requeridos');
    }

    const slots = await availabilityService.getAvailableSlots(doctorId, date);

    return ResponseBuilder.success(res, {
      doctorId,
      date,
      slots,
      totalSlots: slots.length
    });
  });

  /**
   * GET /availability/doctor/:doctorId/weekly
   * Get weekly availability for a doctor
   */
  getWeeklyAvailability = asyncHandler(async (req, res) => {
    const { doctorId } = req.params;
    const { startDate, weeks } = req.query;

    const start = startDate || new Date().toISOString().split('T')[0];
    const numWeeks = Number.parseInt(weeks) || 4;

    const availability = await availabilityService.getWeeklyAvailability(
      doctorId, 
      start, 
      numWeeks
    );

    return ResponseBuilder.success(res, {
      doctorId,
      startDate: start,
      weeks: numWeeks,
      availability
    });
  });

  /**
   * GET /availability/doctor/:doctorId/next
   * Get next available slot for a doctor
   */
  getNextAvailable = asyncHandler(async (req, res) => {
    const { doctorId } = req.params;
    const { daysAhead } = req.query;

    const days = Number.parseInt(daysAhead) || 30;

    const nextSlot = await availabilityService.getNextAvailableSlot(doctorId, days);

    if (!nextSlot) {
      return ResponseBuilder.success(res, {
        doctorId,
        message: 'No hay disponibilidad en los próximos días',
        nextSlot: null
      });
    }

    return ResponseBuilder.success(res, {
      doctorId,
      nextSlot
    });
  });

  /**
   * POST /availability/check
   * Check if a specific slot is available
   */
  checkSlot = asyncHandler(async (req, res) => {
    const { doctorId, date, time } = req.body;

    if (!doctorId || !date || !time) {
      throw new ValidationError('doctorId, date y time son requeridos');
    }

    const isAvailable = await availabilityService.isSlotAvailable(doctorId, date, time);

    return ResponseBuilder.success(res, {
      doctorId,
      date,
      time,
      isAvailable
    });
  });
}

module.exports = new AvailabilityController();
