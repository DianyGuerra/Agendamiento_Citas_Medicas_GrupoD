/**
 * Insurance Provider Controller
 * Handles CRUD operations for Insurance Providers
 * 
 * @module crud-api/controllers/InsuranceProviderController
 */

const insuranceProviderRepository = require('../repositories/insuranceProvider.repository');
const ResponseBuilder = require('../../shared/utils/responseBuilder.utils');
const { asyncHandler } = require('../../shared/middleware/errorHandler.middleware');
const { NotFoundError, ValidationError } = require('../../shared/errors');

class InsuranceProviderController {
  /**
   * GET /insurance-providers
   * Get all active insurance providers
   */
  getAll = asyncHandler(async (req, res) => {
    const providers = await insuranceProviderRepository.findAllActive();
    return ResponseBuilder.success(res, providers);
  });

  /**
   * GET /insurance-providers/:id
   * Get provider by ID
   */
  getById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const provider = await insuranceProviderRepository.findById(id);

    if (!provider) {
      throw new NotFoundError('Aseguradora', id);
    }

    return ResponseBuilder.success(res, provider);
  });

  /**
   * GET /insurance-providers/code/:code
   * Get provider by code
   */
  getByCode = asyncHandler(async (req, res) => {
    const { code } = req.params;
    const provider = await insuranceProviderRepository.findByCode(code);

    if (!provider) {
      throw new NotFoundError('Aseguradora con código', code);
    }

    return ResponseBuilder.success(res, provider);
  });

  /**
   * POST /insurance-providers
   * Create new insurance provider
   */
  create = asyncHandler(async (req, res) => {
    const { name, code, discount_percentage, coverage_types, contact_phone, contact_email } = req.body;

    if (!name) {
      throw new ValidationError('name es requerido');
    }

    const provider = await insuranceProviderRepository.create({
      name,
      code: code?.toUpperCase(),
      discount_percentage: discount_percentage || 15,
      coverage_types,
      contact_phone,
      contact_email
    });

    return ResponseBuilder.created(res, provider, 'Aseguradora creada exitosamente');
  });

  /**
   * PUT /insurance-providers/:id
   * Update insurance provider
   */
  update = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    const existing = await insuranceProviderRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Aseguradora', id);
    }

    if (updateData.code) {
      updateData.code = updateData.code.toUpperCase();
    }

    const provider = await insuranceProviderRepository.update(id, updateData);
    return ResponseBuilder.success(res, provider, 200, 'Aseguradora actualizada');
  });

  /**
   * DELETE /insurance-providers/:id
   * Soft delete insurance provider
   */
  delete = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const existing = await insuranceProviderRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Aseguradora', id);
    }

    await insuranceProviderRepository.update(id, { is_active: false });
    return ResponseBuilder.success(res, null, 200, 'Aseguradora eliminada');
  });
}

module.exports = new InsuranceProviderController();
