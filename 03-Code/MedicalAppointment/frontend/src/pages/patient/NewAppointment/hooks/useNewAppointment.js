/**
 * useNewAppointment Hook
 * Manages the new appointment creation flow
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DoctorModel, SpecialtyModel, AppointmentModel } from '../../../../models';

export default function useNewAppointment() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [notification, setNotification] = useState(null);

  const [specialties, setSpecialties] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);

  const [searchParams, setSearchParams] = useState({
    specialty_id: '',
    doctor_id: '',
    date: '',
  });

  const [selectedSlot, setSelectedSlot] = useState(null);
  const [reason, setReason] = useState('');

  const showNotification = useCallback((message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  }, []);

  const loadSpecialties = useCallback(async () => {
    try {
      const response = await SpecialtyModel.getAll();
      setSpecialties(response.data || response);
    } catch (error) {
      showNotification('Error al cargar especialidades', 'error');
    }
  }, [showNotification]);

  const loadDoctorsBySpecialty = useCallback(async (specialtyId) => {
    try {
      setLoading(true);
      const response = await DoctorModel.getBySpecialty(specialtyId);
      setDoctors(response.data || response);
    } catch (error) {
      showNotification('Error al cargar doctores', 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  const loadAvailableSlots = useCallback(async () => {
    try {
      setLoading(true);
      const response = await AppointmentModel.getAvailableSlots(
        searchParams.doctor_id,
        searchParams.date
      );
      const slots = response?.slots || response?.data?.slots || response?.data || response || [];
      setAvailableSlots(Array.isArray(slots) ? slots : []);
    } catch (error) {
      console.error('Error loading slots:', error);
      showNotification('Error al cargar horarios disponibles', 'error');
      setAvailableSlots([]);
    } finally {
      setLoading(false);
    }
  }, [searchParams.doctor_id, searchParams.date, showNotification]);

  useEffect(() => {
    loadSpecialties();
  }, [loadSpecialties]);

  useEffect(() => {
    if (searchParams.specialty_id) {
      loadDoctorsBySpecialty(searchParams.specialty_id);
    }
  }, [searchParams.specialty_id, loadDoctorsBySpecialty]);

  useEffect(() => {
    if (searchParams.doctor_id && searchParams.date) {
      loadAvailableSlots();
    }
  }, [searchParams.doctor_id, searchParams.date, loadAvailableSlots]);

  const handleSearchChange = useCallback((field, value) => {
    setSearchParams((prev) => ({ ...prev, [field]: value }));
    if (field === 'specialty_id') {
      setSearchParams((prev) => ({ ...prev, doctor_id: '', date: '' }));
      setDoctors([]);
      setAvailableSlots([]);
      setSelectedSlot(null);
    }
    if (field === 'doctor_id') {
      setSearchParams((prev) => ({ ...prev, date: '' }));
      setAvailableSlots([]);
      setSelectedSlot(null);
    }
  }, []);

  const handleSlotSelect = useCallback((slot) => {
    setSelectedSlot(slot);
    setStep(2);
  }, []);

  const handleBack = useCallback(() => {
    setStep(1);
    setSelectedSlot(null);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!selectedSlot) {
      showNotification('Por favor seleccione un horario', 'error');
      return;
    }

    try {
      setLoading(true);
      
      const slotTime = selectedSlot.time || selectedSlot.start;
      const scheduledStart = `${searchParams.date}T${slotTime}:00`;
      
      await AppointmentModel.create({
        doctor_id: searchParams.doctor_id,
        scheduled_start: scheduledStart,
        reason: reason,
      });
      
      showNotification('Cita agendada exitosamente', 'success');
      setTimeout(() => navigate('/patient/appointments'), 2000);
    } catch (error) {
      console.error('Error creating appointment:', error);
      showNotification(
        error.response?.data?.error || 'Error al agendar la cita',
        'error'
      );
    } finally {
      setLoading(false);
    }
  }, [selectedSlot, searchParams, reason, navigate, showNotification]);

  const getSelectedSpecialty = useCallback(() => {
    return specialties.find(s => s.id === searchParams.specialty_id);
  }, [specialties, searchParams.specialty_id]);

  const getSelectedDoctor = useCallback(() => {
    return doctors.find(d => d.id === searchParams.doctor_id);
  }, [doctors, searchParams.doctor_id]);

  return {
    loading,
    step,
    notification,
    specialties,
    doctors,
    availableSlots,
    searchParams,
    selectedSlot,
    reason,
    setReason,
    handleSearchChange,
    handleSlotSelect,
    handleBack,
    handleSubmit,
    getSelectedSpecialty,
    getSelectedDoctor,
    navigate,
  };
}
