/**
 * Satisfaction Survey Repository
 * Database operations for satisfaction surveys
 * 
 * @module crud-api/repositories/SatisfactionSurveyRepository
 */

const { supabase } = require('../../shared/config/database.config');

class SatisfactionSurveyRepository {
  constructor() {
    this.tableName = 'satisfaction_surveys';
  }

  /**
   * Get all surveys with optional filters
   * @param {Object} filters - Query filters
   * @returns {Promise<Array>}
   */
  async findAll(filters = {}) {
    let query = supabase
      .from(this.tableName)
      .select(`
        *,
        patient:users!satisfaction_surveys_patient_user_id_fkey(id, first_name, last_name, email),
        doctor:doctors!satisfaction_surveys_doctor_id_fkey(
          id,
          user:users!doctors_user_id_fkey(first_name, last_name)
        ),
        appointment:appointments(id, scheduled_start)
      `)
      .order('created_at', { ascending: false });

    if (filters.doctor_id) {
      query = query.eq('doctor_id', filters.doctor_id);
    }

    if (filters.patient_user_id) {
      query = query.eq('patient_user_id', filters.patient_user_id);
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Flatten doctor user data
    return (data || []).map(survey => ({
      ...survey,
      doctor: survey.doctor ? {
        id: survey.doctor.id,
        first_name: survey.doctor.user?.first_name,
        last_name: survey.doctor.user?.last_name
      } : null
    }));
  }

  /**
   * Find survey by ID
   * @param {string} id - Survey ID
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    const { data, error } = await supabase
      .from(this.tableName)
      .select(`
        *,
        patient:users!satisfaction_surveys_patient_user_id_fkey(id, first_name, last_name, email),
        doctor:doctors!satisfaction_surveys_doctor_id_fkey(
          id,
          user:users!doctors_user_id_fkey(first_name, last_name)
        ),
        appointment:appointments(id, scheduled_start)
      `)
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    
    if (!data) return null;

    return {
      ...data,
      doctor: data.doctor ? {
        id: data.doctor.id,
        first_name: data.doctor.user?.first_name,
        last_name: data.doctor.user?.last_name
      } : null
    };
  }

  /**
   * Find survey by appointment ID
   * @param {string} appointmentId - Appointment ID
   * @returns {Promise<Object|null>}
   */
  async findByAppointmentId(appointmentId) {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('appointment_id', appointmentId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  /**
   * Create a new survey
   * @param {Object} surveyData - Survey data
   * @returns {Promise<Object>}
   */
  async create(surveyData) {
    const { data, error } = await supabase
      .from(this.tableName)
      .insert({
        appointment_id: surveyData.appointment_id,
        patient_user_id: surveyData.patient_user_id,
        doctor_id: surveyData.doctor_id,
        doctor_professionalism_rating: surveyData.doctor_professionalism_rating,
        punctuality_rating: surveyData.punctuality_rating,
        facilities_rating: surveyData.facilities_rating,
        overall_rating: surveyData.overall_rating,
        comments: surveyData.comments,
        survey_date: surveyData.survey_date || new Date().toISOString().split('T')[0]
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update a survey
   * @param {string} id - Survey ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>}
   */
  async update(id, updateData) {
    const { data, error } = await supabase
      .from(this.tableName)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete a survey
   * @param {string} id - Survey ID
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }

  /**
   * Get survey statistics
   * @returns {Promise<Object>}
   */
  async getStatistics() {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('overall_rating, doctor_professionalism_rating, punctuality_rating, facilities_rating');

    if (error) throw error;

    if (!data || data.length === 0) {
      return {
        total: 0,
        averageOverall: 0,
        averageProfessionalism: 0,
        averagePunctuality: 0,
        averageFacilities: 0
      };
    }

    const total = data.length;
    const sum = (arr, key) => arr.reduce((acc, item) => acc + (item[key] || 0), 0);

    return {
      total,
      averageOverall: (sum(data, 'overall_rating') / total).toFixed(1),
      averageProfessionalism: (sum(data, 'doctor_professionalism_rating') / total).toFixed(1),
      averagePunctuality: (sum(data, 'punctuality_rating') / total).toFixed(1),
      averageFacilities: (sum(data, 'facilities_rating') / total).toFixed(1)
    };
  }
}

module.exports = new SatisfactionSurveyRepository();
