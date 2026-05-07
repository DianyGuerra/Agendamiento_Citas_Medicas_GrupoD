/**
 * Doctor Rating Controller
 * HTTP handlers for doctor ratings
 * 
 * @module crud-api/controllers/DoctorRatingController
 */

const doctorRatingRepository = require('../repositories/doctorRating.repository');
const { asyncHandler } = require('../../shared/middleware/errorHandler.middleware');
const ResponseBuilder = require('../../shared/utils/responseBuilder.utils');

class DoctorRatingController {
  /**
   * GET /doctor-ratings
   * Get all ratings (admin)
   */
  getAll = asyncHandler(async (req, res) => {
    const { limit, is_active } = req.query;
    
    const filters = { limit };
    if (is_active !== undefined) {
      filters.is_active = is_active === 'true';
    }
    
    const ratings = await doctorRatingRepository.findAll(filters);

    return ResponseBuilder.success(res, ratings);
  });

  /**
   * GET /doctor-ratings/averages
   * Get average ratings for all doctors
   */
  getAllAverages = asyncHandler(async (req, res) => {
    const averages = await doctorRatingRepository.getAllAverageRatings();

    return ResponseBuilder.success(res, averages);
  });

  /**
   * GET /doctor-ratings/doctor/:doctorId
   * Get all ratings for a doctor
   */
  getByDoctor = asyncHandler(async (req, res) => {
    const { doctorId } = req.params;
    const { limit } = req.query;
    
    const ratings = await doctorRatingRepository.findByDoctor(doctorId, { limit });

    return ResponseBuilder.success(res, { data: ratings });
  });

  /**
   * GET /doctor-ratings/doctor/:doctorId/average
   * Get average rating for a doctor
   */
  getAverageRating = asyncHandler(async (req, res) => {
    const { doctorId } = req.params;
    
    const averages = await doctorRatingRepository.getAverageRating(doctorId);

    return ResponseBuilder.success(res, { data: averages });
  });

  /**
   * GET /doctor-ratings/:id
   * Get rating by ID
   */
  getById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const rating = await doctorRatingRepository.findById(id);

    if (!rating) {
      return ResponseBuilder.notFound(res, 'Calificación no encontrada');
    }

    return ResponseBuilder.success(res, { data: rating });
  });

  /**
   * GET /doctor-ratings/appointment/:appointmentId
   * Get rating by appointment
   */
  getByAppointment = asyncHandler(async (req, res) => {
    const { appointmentId } = req.params;
    const rating = await doctorRatingRepository.findByAppointment(appointmentId);

    // Return the rating directly, not wrapped in { data: rating }
    return ResponseBuilder.success(res, rating);
  });

  /**
   * POST /doctor-ratings
   * Create new rating
   */
  create = asyncHandler(async (req, res) => {
    // Get patient_user_id from authenticated user
    const patient_user_id = req.user.id;
    
    console.log('[DoctorRating] Creating rating:', {
      patient_user_id,
      doctor_id: req.body.doctor_id,
      appointment_id: req.body.appointment_id,
      rating: req.body.rating
    });
    
    // Check if already rated
    if (req.body.appointment_id) {
      const existing = await doctorRatingRepository.findByAppointment(req.body.appointment_id);
      if (existing) {
        console.log('[DoctorRating] Already rated, existing:', existing);
        return ResponseBuilder.error(res, 'Esta cita ya ha sido calificada', 400);
      }
    }

    // Include patient_user_id from authenticated user
    const ratingData = {
      ...req.body,
      patient_user_id
    };

    console.log('[DoctorRating] Saving ratingData:', ratingData);
    const rating = await doctorRatingRepository.create(ratingData);
    console.log('[DoctorRating] Created rating:', rating);
    return ResponseBuilder.created(res, { data: rating }, 'Calificación registrada');
  });

  /**
   * PUT /doctor-ratings/:id
   * Update rating
   */
  update = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const rating = await doctorRatingRepository.update(id, req.body);

    return ResponseBuilder.success(res, { data: rating }, 'Calificación actualizada');
  });

  /**
   * DELETE /doctor-ratings/:id
   * Delete rating
   */
  delete = asyncHandler(async (req, res) => {
    const { id } = req.params;
    await doctorRatingRepository.delete(id);

    return ResponseBuilder.success(res, null, 'Calificación eliminada');
  });
}

module.exports = new DoctorRatingController();
