/**
 * Specialty Controller
 * Handles HTTP requests for Specialty CRUD operations
 * 
 * @module crud-api/controllers/SpecialtyController
 */

const specialtyRepository = require('../repositories/specialty.repository');
const ResponseBuilder = require('../../shared/utils/responseBuilder.utils');
const { asyncHandler } = require('../../shared/middleware/errorHandler.middleware');
const { NotFoundError, ValidationError } = require('../../shared/errors');

class SpecialtyController {
  /**
   * GET /specialties
   * Get all specialties
   */
  getAll = asyncHandler(async (req, res) => {
    const specialties = await specialtyRepository.findAllActive();
    return ResponseBuilder.success(res, specialties);
  });

  /**
   * GET /specialties/stats
   * Get specialty statistics
   */
  getStats = asyncHandler(async (req, res) => {
    const stats = await specialtyRepository.getStats();
    return ResponseBuilder.success(res, stats);
  });

  /**
   * GET /specialties/:id
   * Get specialty by ID
   */
  getById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const specialty = await specialtyRepository.findWithDoctorCount(id);
    
    if (!specialty) {
      throw new NotFoundError('Especialidad', id);
    }

    return ResponseBuilder.success(res, specialty);
  });

  /**
   * POST /specialties
   * Create new specialty (admin)
   */
  create = asyncHandler(async (req, res) => {
    const { name, description, consultation_fee } = req.body;

    if (!name) {
      throw new ValidationError('El nombre es requerido');
    }

    // Check if name already exists
    const existing = await specialtyRepository.findByName(name);
    if (existing) {
      throw new ValidationError('Ya existe una especialidad con este nombre');
    }

    // Note: specialties table has no is_active column
    const specialty = await specialtyRepository.create({
      name,
      description,
      consultation_fee: consultation_fee ? parseFloat(consultation_fee) : null
    });

    return ResponseBuilder.created(res, specialty, 'Especialidad creada exitosamente');
  });

  /**
   * PUT /specialties/:id
   * Update specialty (admin)
   */
  update = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, description, consultation_fee } = req.body;

    const existing = await specialtyRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Especialidad', id);
    }

    // Check name uniqueness if changed
    if (name && name !== existing.name) {
      const existingName = await specialtyRepository.findByName(name);
      if (existingName) {
        throw new ValidationError('Ya existe una especialidad con este nombre');
      }
    }

    const updated = await specialtyRepository.update(id, {
      name,
      description,
      consultation_fee: consultation_fee !== undefined ? (consultation_fee ? parseFloat(consultation_fee) : null) : undefined
    });

    return ResponseBuilder.success(res, updated, 200, 'Especialidad actualizada exitosamente');
  });

  /**
   * DELETE /specialties/:id
   * Soft delete specialty (admin)
   */
  delete = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const existing = await specialtyRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Especialidad', id);
    }

    await specialtyRepository.softDelete(id);

    return ResponseBuilder.success(res, { id }, 200, 'Especialidad desactivada exitosamente');
  });
}

module.exports = new SpecialtyController();
