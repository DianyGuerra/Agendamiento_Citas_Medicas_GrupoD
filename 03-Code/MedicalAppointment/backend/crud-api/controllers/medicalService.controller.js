/**
 * Medical Service Controller
 * Handles CRUD operations for Medical Services catalog
 * 
 * @module crud-api/controllers/MedicalServiceController
 */

const medicalServiceRepository = require('../repositories/medicalService.repository');
const ResponseBuilder = require('../../shared/utils/responseBuilder.utils');
const { asyncHandler } = require('../../shared/middleware/errorHandler.middleware');
const { NotFoundError, ValidationError } = require('../../shared/errors');

class MedicalServiceController {
  /**
   * GET /medical-services
   * Get all medical services
   */
  getAll = asyncHandler(async (req, res) => {
    const { category, specialty_id } = req.query;

    let services;
    if (category) {
      services = await medicalServiceRepository.findByCategory(category);
    } else if (specialty_id) {
      services = await medicalServiceRepository.findBySpecialty(specialty_id);
    } else {
      services = await medicalServiceRepository.findAllWithDetails();
    }

    return ResponseBuilder.success(res, services);
  });

  /**
   * GET /medical-services/categories
   * Get all service categories
   */
  getCategories = asyncHandler(async (req, res) => {
    const categories = await medicalServiceRepository.getCategories();
    return ResponseBuilder.success(res, categories);
  });

  /**
   * GET /medical-services/:id
   * Get service by ID
   */
  getById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const service = await medicalServiceRepository.findById(id);

    if (!service) {
      throw new NotFoundError('Servicio médico', id);
    }

    return ResponseBuilder.success(res, service);
  });

  /**
   * POST /medical-services
   * Create new medical service
   */
  create = asyncHandler(async (req, res) => {
    const { name, description, category, base_price, specialty_id } = req.body;

    if (!name || base_price === undefined) {
      throw new ValidationError('name y base_price son requeridos');
    }

    const service = await medicalServiceRepository.create({
      name,
      description,
      category: category || 'general',
      base_price,
      specialty_id
    });

    return ResponseBuilder.created(res, service, 'Servicio creado exitosamente');
  });

  /**
   * PUT /medical-services/:id
   * Update medical service
   */
  update = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    const existing = await medicalServiceRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Servicio médico', id);
    }

    const service = await medicalServiceRepository.update(id, updateData);
    return ResponseBuilder.success(res, service, 200, 'Servicio actualizado');
  });

  /**
   * DELETE /medical-services/:id
   * Soft delete medical service
   */
  delete = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const existing = await medicalServiceRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Servicio médico', id);
    }

    await medicalServiceRepository.update(id, { is_active: false });
    return ResponseBuilder.success(res, null, 200, 'Servicio eliminado');
  });
}

module.exports = new MedicalServiceController();
