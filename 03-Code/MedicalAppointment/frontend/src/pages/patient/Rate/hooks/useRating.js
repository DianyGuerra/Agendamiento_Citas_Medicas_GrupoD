import { useState, useEffect } from 'react';
import { AppointmentModel, DoctorRatingModel } from '../../../../models';

/**
 * Hook for managing appointment rating state and logic
 */
export function useRating(appointmentId) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [appointment, setAppointment] = useState(null);
  const [existingRating, setExistingRating] = useState(null);

  const [formData, setFormData] = useState({
    rating: 0,
    punctuality_rating: 0,
    attention_rating: 0,
    recommendation_rating: 0,
    comment: '',
  });

  useEffect(() => {
    loadAppointment();
  }, [appointmentId]);

  const loadAppointment = async () => {
    try {
      setLoading(true);

      const aptResponse = await AppointmentModel.getById(appointmentId);
      const aptData = aptResponse.data || aptResponse;
      setAppointment(aptData);

      try {
        const ratingResponse = await DoctorRatingModel.getByAppointment(appointmentId);
        if (ratingResponse.data) {
          setExistingRating(ratingResponse.data);
          setFormData({
            rating: ratingResponse.data.rating || 0,
            punctuality_rating: ratingResponse.data.punctuality_rating || 0,
            attention_rating: ratingResponse.data.attention_rating || 0,
            recommendation_rating: ratingResponse.data.recommendation_rating || 0,
            comment: ratingResponse.data.comment || '',
          });
        }
      } catch (err) {
        // No existing rating, that's okay
      }
    } catch (err) {
      console.error('Error loading appointment:', err);
      setError('No se pudo cargar la cita');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.rating === 0) {
      setError('Por favor, seleccione una calificación general');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const ratingData = {
        ...formData,
        doctor_id: appointment.doctor_id,
        patient_user_id: appointment.patient_user_id,
        appointment_id: appointmentId,
      };

      if (existingRating) {
        await DoctorRatingModel.update(existingRating.id, ratingData);
      } else {
        await DoctorRatingModel.create(ratingData);
      }

      setSubmitted(true);
    } catch (err) {
      console.error('Error submitting rating:', err);
      setError('Error al enviar la calificación');
    } finally {
      setSubmitting(false);
    }
  };

  const updateFormData = (updates) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  return {
    loading,
    submitting,
    submitted,
    error,
    setError,
    appointment,
    existingRating,
    formData,
    updateFormData,
    handleSubmit,
  };
}

/**
 * Format date for display
 */
export function formatDate(scheduledStart) {
  if (!scheduledStart) return 'N/A';
  return new Date(scheduledStart).toLocaleDateString('es-EC', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Get rating label text
 */
export function getRatingLabel(rating) {
  const labels = {
    1: 'Muy malo',
    2: 'Malo',
    3: 'Regular',
    4: 'Bueno',
    5: 'Excelente',
  };
  return labels[rating] || '';
}
