/**
 * Consultation Room Controller
 * Handles HTTP requests for Consultation Room CRUD operations
 * 
 * @module crud-api/controllers/ConsultationRoomController
 */

const consultationRoomRepository = require('../repositories/consultationRoom.repository');
const ResponseBuilder = require('../../shared/utils/responseBuilder.utils');
const { asyncHandler } = require('../../shared/middleware/errorHandler.middleware');
const { NotFoundError, ValidationError } = require('../../shared/errors');

class ConsultationRoomController {
  /**
   * GET /consultation-rooms
   * Get all consultation rooms
   */
  getAll = asyncHandler(async (req, res) => {
    const { activeOnly } = req.query;

    let rooms;
    if (activeOnly === 'true') {
      rooms = await consultationRoomRepository.findAllActive();
    } else {
      rooms = await consultationRoomRepository.findAll({
        orderBy: 'room_number'
      });
    }

    return ResponseBuilder.success(res, rooms);
  });

  /**
   * GET /consultation-rooms/:id
   * Get consultation room by ID
   */
  getById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const room = await consultationRoomRepository.findById(id);
    
    if (!room) {
      throw new NotFoundError('Sala de consulta', id);
    }

    return ResponseBuilder.success(res, room);
  });

  /**
   * GET /consultation-rooms/available
   * Get first available room
   */
  getAvailable = asyncHandler(async (req, res) => {
    const room = await consultationRoomRepository.findAvailable();

    if (!room) {
      return ResponseBuilder.success(res, null);
    }

    return ResponseBuilder.success(res, room);
  });

  /**
   * POST /consultation-rooms
   * Create new consultation room (admin)
   */
  create = asyncHandler(async (req, res) => {
    const { name, room_number, description, floor, capacity, equipment, notes, is_available } = req.body;

    if (!name || !room_number) {
      throw new ValidationError('name y room_number son requeridos');
    }

    // Check if room number already exists
    const existing = await consultationRoomRepository.findByNumber(room_number);
    if (existing) {
      throw new ValidationError('Ya existe una sala con este número');
    }

    const room = await consultationRoomRepository.create({
      name,
      room_number,
      description,
      floor,
      capacity,
      equipment: Array.isArray(equipment) ? equipment : [],
      notes,
      is_available: is_available !== false
    });

    return ResponseBuilder.created(res, room, 'Sala de consulta creada exitosamente');
  });

  /**
   * PUT /consultation-rooms/:id
   * Update consultation room (admin)
   */
  update = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, room_number, description, floor, capacity, is_available, equipment, notes } = req.body;

    const existing = await consultationRoomRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Sala de consulta', id);
    }

    // Check room number uniqueness if changed
    if (room_number && room_number !== existing.room_number) {
      const existingNumber = await consultationRoomRepository.findByNumber(room_number);
      if (existingNumber) {
        throw new ValidationError('Ya existe una sala con este número');
      }
    }

    const updated = await consultationRoomRepository.update(id, {
      name,
      room_number,
      description,
      floor,
      capacity,
      is_available,
      equipment: equipment !== undefined ? (Array.isArray(equipment) ? equipment : []) : undefined,
      notes
    });

    return ResponseBuilder.success(res, updated, 200, 'Sala de consulta actualizada');
  });

  /**
   * PATCH /consultation-rooms/:id/availability
   * Update room availability
   */
  updateAvailability = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { is_available } = req.body;

    if (is_available === undefined) {
      throw new ValidationError('is_available es requerido');
    }

    const existing = await consultationRoomRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Sala de consulta', id);
    }

    const updated = await consultationRoomRepository.updateAvailability(id, is_available);

    return ResponseBuilder.success(res, updated, 200, 'Disponibilidad actualizada');
  });

  /**
   * DELETE /consultation-rooms/:id
   * Soft delete room (mark unavailable)
   */
  delete = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const existing = await consultationRoomRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Sala de consulta', id);
    }

    await consultationRoomRepository.softDelete(id);

    return ResponseBuilder.success(res, { id }, 200, 'Sala de consulta desactivada');
  });
}

module.exports = new ConsultationRoomController();
