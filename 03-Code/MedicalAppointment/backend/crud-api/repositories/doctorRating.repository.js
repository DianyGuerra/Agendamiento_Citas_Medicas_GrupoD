/**
 * Doctor Ratings Repository
 * Database operations for doctor ratings
 * 
 * @module crud-api/repositories/DoctorRatingRepository
 */

const { supabase } = require('../../shared/config/database.config');

class DoctorRatingRepository {
  constructor() {
    this.tableName = 'doctor_ratings';
  }

  /**
   * Get all ratings (admin view)
   * @param {Object} filters - Query filters
   * @returns {Promise<Array>}
   */
  async findAll(filters = {}) {
    let query = supabase
      .from(this.tableName)
      .select(`
        *,
        patient:users!doctor_ratings_patient_user_id_fkey(id, first_name, last_name, email),
        doctor:doctors!doctor_ratings_doctor_id_fkey(
          id,
          user:users!doctors_user_id_fkey(first_name, last_name),
          specialty:specialties(name)
        ),
        appointment:appointments(id, scheduled_start)
      `)
      .order('created_at', { ascending: false });

    if (filters.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    
    // Flatten doctor user data for frontend
    return (data || []).map(rating => ({
      ...rating,
      doctor: rating.doctor ? {
        id: rating.doctor.id,
        first_name: rating.doctor.user?.first_name,
        last_name: rating.doctor.user?.last_name,
        specialty: rating.doctor.specialty?.name
      } : null
    }));
  }

  /**
   * Get average ratings for all doctors (from view)
   * @returns {Promise<Array>}
   */
  async getAllAverageRatings() {
    const { data, error } = await supabase
      .from('doctor_average_ratings')
      .select('*')
      .order('average_rating', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get all ratings for a doctor
   * @param {string} doctorId - Doctor ID
   * @param {Object} filters - Query filters
   * @returns {Promise<Array>}
   */
  async findByDoctor(doctorId, filters = {}) {
    let query = supabase
      .from(this.tableName)
      .select(`
        *,
        patient:users!doctor_ratings_patient_user_id_fkey(id, first_name, last_name),
        appointment:appointments(id, scheduled_start)
      `)
      .eq('doctor_id', doctorId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  /**
   * Get rating by ID
   * @param {string} id - Rating ID
   * @returns {Promise<Object>}
   */
  async findById(id) {
    const { data, error } = await supabase
      .from(this.tableName)
      .select(`
        *,
        patient:users!doctor_ratings_patient_user_id_fkey(id, first_name, last_name),
        doctor:doctors(
          id,
          user:users(first_name, last_name),
          specialty:specialties(name)
        ),
        appointment:appointments(id, scheduled_start)
      `)
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get rating by appointment
   * @param {string} appointmentId - Appointment ID
   * @returns {Promise<Object>}
   */
  async findByAppointment(appointmentId) {
    console.log('[DoctorRatingRepo] Finding rating for appointment:', appointmentId);
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('appointment_id', appointmentId)
      .eq('is_active', true)
      .single();

    console.log('[DoctorRatingRepo] Result:', data, 'Error:', error?.code);
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  /**
   * Create a rating
   * @param {Object} ratingData - Rating data
   * @returns {Promise<Object>}
   */
  async create(ratingData) {
    const { data, error } = await supabase
      .from(this.tableName)
      .insert({
        ...ratingData,
        is_active: true,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update a rating
   * @param {string} id - Rating ID
   * @param {Object} ratingData - Rating data
   * @returns {Promise<Object>}
   */
  async update(id, ratingData) {
    const { data, error } = await supabase
      .from(this.tableName)
      .update({
        ...ratingData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete a rating
   * @param {string} id - Rating ID
   * @returns {Promise<Object>}
   */
  async delete(id) {
    const { data, error } = await supabase
      .from(this.tableName)
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get average rating for a doctor
   * @param {string} doctorId - Doctor ID
   * @returns {Promise<Object>}
   */
  async getAverageRating(doctorId) {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('rating, punctuality_rating, attention_rating, recommendation_rating')
      .eq('doctor_id', doctorId)
      .eq('is_active', true);

    if (error) throw error;

    if (!data || data.length === 0) {
      return {
        average: 0,
        count: 0,
        punctuality: 0,
        attention: 0,
        recommendation: 0
      };
    }

    const avg = (arr, key) => {
      const valid = arr.filter(r => r[key] != null);
      return valid.length > 0 
        ? valid.reduce((sum, r) => sum + r[key], 0) / valid.length 
        : 0;
    };

    return {
      average: avg(data, 'rating'),
      count: data.length,
      punctuality: avg(data, 'punctuality_rating'),
      attention: avg(data, 'attention_rating'),
      recommendation: avg(data, 'recommendation_rating')
    };
  }
}

module.exports = new DoctorRatingRepository();
