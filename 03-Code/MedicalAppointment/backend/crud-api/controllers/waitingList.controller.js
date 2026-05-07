/**
 * Waiting List Controller
 * HTTP handlers for waiting list operations
 * 
 * @module crud-api/controllers/WaitingListController
 */

const waitingListRepository = require('../repositories/waitingList.repository');
const { asyncHandler } = require('../../shared/middleware/errorHandler.middleware');
const ResponseBuilder = require('../../shared/utils/responseBuilder.utils');

class WaitingListController {
  /**
   * GET /waiting-list
   * Get all waiting list entries
   */
  getAll = asyncHandler(async (req, res) => {
    const { doctor_id, status, patient_user_id } = req.query;
    
    const entries = await waitingListRepository.findAll({
      doctor_id,
      status,
      patient_user_id
    });

    return ResponseBuilder.success(res, { data: entries });
  });

  /**
   * GET /waiting-list/:id
   * Get waiting list entry by ID
   */
  getById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const entry = await waitingListRepository.findById(id);

    if (!entry) {
      return ResponseBuilder.notFound(res, 'Entrada no encontrada');
    }

    return ResponseBuilder.success(res, { data: entry });
  });

  /**
   * POST /waiting-list
   * Create new waiting list entry
   */
  create = asyncHandler(async (req, res) => {
    const entry = await waitingListRepository.create(req.body);
    return ResponseBuilder.created(res, { data: entry }, 'Agregado a lista de espera');
  });

  /**
   * PUT /waiting-list/:id
   * Update waiting list entry
   */
  update = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const entry = await waitingListRepository.update(id, req.body);

    return ResponseBuilder.success(res, { data: entry }, 'Entrada actualizada');
  });

  /**
   * DELETE /waiting-list/:id
   * Remove from waiting list
   */
  delete = asyncHandler(async (req, res) => {
    const { id } = req.params;
    await waitingListRepository.delete(id);

    return ResponseBuilder.success(res, null, 'Removido de lista de espera');
  });

  /**
   * PATCH /waiting-list/:id/status
   * Update entry status
   */
  updateStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const entry = await waitingListRepository.updateStatus(id, status);

    return ResponseBuilder.success(res, { data: entry }, 'Estado actualizado');
  });

  /**
   * GET /waiting-list/doctor/:doctorId/count
   * Get count of waiting patients for a doctor
   */
  getCountByDoctor = asyncHandler(async (req, res) => {
    const { doctorId } = req.params;
    const count = await waitingListRepository.countByDoctor(doctorId);

    return ResponseBuilder.success(res, { count });
  });
}

module.exports = new WaitingListController();
