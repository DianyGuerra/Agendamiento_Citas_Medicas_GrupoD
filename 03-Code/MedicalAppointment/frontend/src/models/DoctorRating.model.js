/**
 * Doctor Rating Model
 * Handles doctor rating operations
 * 
 * @module models/DoctorRating
 */

import { crudApi } from '../services/httpClient';

/**
 * DoctorRating entity structure
 * @typedef {Object} DoctorRating
 * @property {string} id - Rating ID
 * @property {string} doctor_id - Doctor ID
 * @property {string} patient_user_id - Patient user ID
 * @property {string} appointment_id - Appointment ID
 * @property {number} rating - Overall rating (1-5)
 * @property {number} punctuality_rating - Punctuality rating (1-5)
 * @property {number} attention_rating - Attention rating (1-5)
 * @property {number} recommendation_rating - Recommendation rating (1-5)
 * @property {string} comment - Comment
 */

class DoctorRatingModel {
  /**
   * Get all ratings for a doctor
   * @param {string} doctorId - Doctor ID
   * @param {Object} params - Query parameters
   * @returns {Promise<DoctorRating[]>}
   */
  static async getByDoctor(doctorId, params = {}) {
    const response = await crudApi.get(`/doctor-ratings/doctor/${doctorId}`, { params });
    return response.data;
  }

  /**
   * Get average rating for a doctor
   * @param {string} doctorId - Doctor ID
   * @returns {Promise<Object>}
   */
  static async getAverageRating(doctorId) {
    const response = await crudApi.get(`/doctor-ratings/doctor/${doctorId}/average`);
    return response.data;
  }

  /**
   * Get rating by ID
   * @param {string} id - Rating ID
   * @returns {Promise<DoctorRating>}
   */
  static async getById(id) {
    const response = await crudApi.get(`/doctor-ratings/${id}`);
    return response.data;
  }

  /**
   * Get rating by appointment
   * @param {string} appointmentId - Appointment ID
   * @returns {Promise<DoctorRating>}
   */
  static async getByAppointment(appointmentId) {
    const response = await crudApi.get(`/doctor-ratings/appointment/${appointmentId}`);
    return response.data;
  }

  /**
   * Create new rating
   * @param {Object} ratingData - Rating data
   * @returns {Promise<DoctorRating>}
   */
  static async create(ratingData) {
    const response = await crudApi.post('/doctor-ratings', ratingData);
    return response.data;
  }

  /**
   * Update rating
   * @param {string} id - Rating ID
   * @param {Object} ratingData - Rating data
   * @returns {Promise<DoctorRating>}
   */
  static async update(id, ratingData) {
    const response = await crudApi.put(`/doctor-ratings/${id}`, ratingData);
    return response.data;
  }

  /**
   * Delete rating
   * @param {string} id - Rating ID
   * @returns {Promise<void>}
   */
  static async delete(id) {
    const response = await crudApi.delete(`/doctor-ratings/${id}`);
    return response.data;
  }
}

export default DoctorRatingModel;
