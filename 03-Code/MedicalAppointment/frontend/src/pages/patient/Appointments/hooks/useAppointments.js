/**
 * useAppointments Hook
 * Manages appointments data, filtering, and actions
 */
import { useState, useEffect, useCallback } from 'react';
import { AppointmentModel, DoctorRatingModel } from '../../../../models';

export default function useAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [ratedAppointments, setRatedAppointments] = useState(new Set());

  const showNotification = useCallback((message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  }, []);

  const loadAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await AppointmentModel.getPatientAppointments();
      const appointmentsList = Array.isArray(response.data) ? response.data : Array.isArray(response) ? response : [];
      setAppointments(appointmentsList);
      checkRatedAppointments(appointmentsList);
    } catch (error) {
      showNotification('Error al cargar las citas', 'error');
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  const checkRatedAppointments = async (appointmentsList) => {
    const completedAppts = appointmentsList.filter(apt => apt.status_code === 'completed');
    const rated = new Set();
    
    for (const apt of completedAppts) {
      try {
        const result = await DoctorRatingModel.getByAppointment(apt.id);
        const ratingData = result?.data;
        if (ratingData && ratingData.id) {
          rated.add(apt.id);
        }
      } catch (err) {
        console.log('No rating for appointment:', apt.id, err?.message);
      }
    }
    setRatedAppointments(rated);
  };

  const cancelAppointment = useCallback(async (appointmentId) => {
    try {
      await AppointmentModel.cancel(appointmentId);
      showNotification('Cita cancelada exitosamente', 'success');
      loadAppointments();
      return true;
    } catch (error) {
      showNotification(error.response?.data?.error || 'Error al cancelar la cita', 'error');
      return false;
    }
  }, [loadAppointments, showNotification]);

  const rescheduleAppointment = useCallback(async (appointmentId, newScheduledStart) => {
    try {
      await AppointmentModel.reschedule(appointmentId, newScheduledStart);
      showNotification('Cita reagendada exitosamente', 'success');
      loadAppointments();
      return true;
    } catch (error) {
      showNotification(error.response?.data?.error || 'Error al reagendar la cita', 'error');
      return false;
    }
  }, [loadAppointments, showNotification]);

  const loadAvailableSlots = useCallback(async (doctorId, date) => {
    try {
      const response = await AppointmentModel.getAvailableSlots(doctorId, date);
      const slots = Array.isArray(response?.slots) 
        ? response.slots 
        : Array.isArray(response?.data?.slots)
        ? response.data.slots
        : Array.isArray(response?.data) 
        ? response.data 
        : Array.isArray(response)
        ? response
        : [];
      return slots;
    } catch (error) {
      showNotification('Error al cargar horarios disponibles', 'error');
      console.error('Error loading slots:', error);
      return [];
    }
  }, [showNotification]);

  const submitRating = useCallback(async (ratingInfo) => {
    try {
      await DoctorRatingModel.create(ratingInfo);
      showNotification('¡Gracias por tu calificación!', 'success');
      setRatedAppointments(prev => new Set([...prev, ratingInfo.appointment_id]));
      return true;
    } catch (error) {
      console.error('Error submitting rating:', error);
      showNotification(error.response?.data?.error || 'Error al enviar la calificación', 'error');
      return false;
    }
  }, [showNotification]);

  const markAsRated = useCallback((appointmentId) => {
    setRatedAppointments(prev => new Set([...prev, appointmentId]));
  }, []);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  return {
    appointments,
    loading,
    notification,
    ratedAppointments,
    loadAppointments,
    cancelAppointment,
    rescheduleAppointment,
    loadAvailableSlots,
    submitRating,
    markAsRated,
    showNotification,
  };
}
