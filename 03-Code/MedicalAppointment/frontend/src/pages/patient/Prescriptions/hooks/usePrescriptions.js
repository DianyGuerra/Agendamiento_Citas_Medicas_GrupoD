import { useState, useEffect, useCallback } from 'react';
import { PrescriptionModel } from '../../../../models';

// Parse duration string to days - handles "12 dias", "7 días", "2 semanas", etc.
const parseDurationToDays = (duration) => {
  if (!duration) return 90; // Default 90 days
  if (typeof duration === 'number') return duration;
  
  const str = String(duration).toLowerCase().trim();
  const numberMatch = str.match(/(\d+)/);
  if (!numberMatch) return 90;
  
  const number = Number.parseInt(numberMatch[1]);
  
  if (str.includes('semana')) return number * 7;
  if (str.includes('mes')) return number * 30;
  if (str.includes('año')) return number * 365;
  return number;
};

// Format duration for display
export const formatDuration = (duration) => {
  if (!duration) return 'No especificado';
  
  const str = String(duration).trim();
  if (str.match(/[a-zA-ZáéíóúÁÉÍÓÚ]/)) return str;
  
  const days = Number.parseInt(str);
  if (Number.isNaN(days)) return 'No especificado';
  
  if (days >= 30) {
    const months = Math.floor(days / 30);
    const remainingDays = days % 30;
    if (remainingDays > 0) {
      return `${months} mes(es) y ${remainingDays} días`;
    }
    return `${months} mes(es)`;
  }
  return `${days} días`;
};

// Parse medications from various formats
export const parseMedications = (medications) => {
  if (!medications) return [];
  
  try {
    if (typeof medications === 'string') {
      if (medications.trim().startsWith('[') || medications.trim().startsWith('{')) {
        const parsed = JSON.parse(medications);
        return Array.isArray(parsed) ? parsed : [parsed];
      }
      return medications.split('\n').filter(m => m.trim()).map(m => ({ medication: m.trim(), name: m.trim() }));
    }
    if (Array.isArray(medications)) return medications;
    if (typeof medications === 'object') return [medications];
  } catch (e) {
    return [{ medication: String(medications), name: String(medications) }];
  }
  
  return [];
};

// Get effective duration - from prescription.duration or from medications
const getEffectiveDuration = (prescription) => {
  if (prescription.duration) return prescription.duration;
  
  const meds = parseMedications(prescription.medications);
  let maxDays = 0;
  let durationStr = null;
  
  for (const med of meds) {
    if (med.duration) {
      const days = parseDurationToDays(med.duration);
      if (days > maxDays) {
        maxDays = days;
        durationStr = med.duration;
      }
    }
  }
  
  return durationStr;
};

const calculateExpiryDate = (startDate, durationDays) => {
  const date = new Date(startDate);
  date.setDate(date.getDate() + durationDays);
  return date;
};

const checkIsActive = (prescription) => {
  if (!prescription.created_at) return false;
  const effectiveDuration = getEffectiveDuration(prescription);
  const durationDays = parseDurationToDays(effectiveDuration);
  const expiryDate = calculateExpiryDate(prescription.created_at, durationDays);
  return new Date() < expiryDate;
};

const calculateDaysUntilExpiry = (prescription) => {
  if (!prescription.created_at) return 0;
  const effectiveDuration = getEffectiveDuration(prescription);
  const durationDays = parseDurationToDays(effectiveDuration);
  const expiryDate = calculateExpiryDate(prescription.created_at, durationDays);
  const today = new Date();
  return Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
};

export const getExpiryDate = (prescription) => {
  if (!prescription.created_at) return null;
  const effectiveDuration = getEffectiveDuration(prescription);
  const durationDays = parseDurationToDays(effectiveDuration);
  return calculateExpiryDate(prescription.created_at, durationDays);
};

export const getDisplayDuration = (prescription) => {
  const effectiveDuration = getEffectiveDuration(prescription);
  return formatDuration(effectiveDuration);
};

const getStatusInfo = (prescription) => {
  const isActive = checkIsActive(prescription);
  const daysUntilExpiry = calculateDaysUntilExpiry(prescription);

  if (!isActive) {
    return { class: 'expired', label: 'Vencida', color: 'red' };
  }
  
  if (daysUntilExpiry <= 30) {
    return { class: 'expiring', label: 'Por Vencer', color: 'yellow' };
  }
  
  return { class: 'active', label: 'Activa', color: 'green' };
};

export const processLineBreaks = (text) => {
  if (!text) return '';
  return text.replaceAll('\\n', '\n');
};

export default function usePrescriptions() {
  const [loading, setLoading] = useState(true);
  const [prescriptions, setPrescriptions] = useState([]);
  const [renewals, setRenewals] = useState([]);
  const [activeTab, setActiveTab] = useState('active');
  const [error, setError] = useState('');
  const [notification, setNotification] = useState(null);
  const [renewalLoading, setRenewalLoading] = useState(null);
  
  // Renewal modal states
  const [showRenewalModal, setShowRenewalModal] = useState(false);
  const [renewalPrescription, setRenewalPrescription] = useState(null);
  const [renewalReason, setRenewalReason] = useState('');

  const showNotification = useCallback((message, type = 'success', action = null) => {
    setNotification({ message, type, action });
    setTimeout(() => setNotification(null), 5000);
  }, []);

  const loadRenewals = useCallback(async () => {
    try {
      const response = await PrescriptionModel.getMyRenewals();
      const data = Array.isArray(response.data) ? response.data : Array.isArray(response) ? response : [];
      setRenewals(data);
    } catch (error) {
      console.error('Error loading renewals:', error);
    }
  }, []);

  const loadPrescriptions = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await PrescriptionModel.getPatientPrescriptions();
      const data = Array.isArray(response.data) ? response.data : Array.isArray(response) ? response : [];
      
      const processedPrescriptions = data.map(prescription => ({
        ...prescription,
        isActive: checkIsActive(prescription),
        daysUntilExpiry: calculateDaysUntilExpiry(prescription),
        statusInfo: getStatusInfo(prescription)
      }));
      
      setPrescriptions(processedPrescriptions);
    } catch (error) {
      console.error('Error loading prescriptions:', error);
      setError('Error al cargar las recetas médicas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPrescriptions();
    loadRenewals();
  }, [loadPrescriptions, loadRenewals]);

  const hasPendingRenewal = useCallback((prescriptionId) => {
    return renewals.some(r => r.original_prescription_id === prescriptionId && r.status === 'pending');
  }, [renewals]);

  const filteredPrescriptions = prescriptions.filter((prescription) => {
    if (activeTab === 'active') return prescription.isActive;
    if (activeTab === 'history') return !prescription.isActive;
    return false;
  });

  const cancelRenewal = async (renewalId) => {
    try {
      await PrescriptionModel.cancelRenewal(renewalId);
      await loadRenewals();
      showNotification('Solicitud de renovación cancelada.', 'success');
    } catch (error) {
      console.error('Error canceling renewal:', error);
      showNotification('Error al cancelar la solicitud.', 'error');
    }
  };

  const renewPrescription = async (prescription) => {
    const hasPending = renewals.some(
      r => r.original_prescription_id === prescription.id && r.status === 'pending'
    );
    
    if (hasPending) {
      showNotification('Ya tienes una solicitud de renovación pendiente para esta receta.', 'warning');
      return;
    }

    setRenewalPrescription(prescription);
    setRenewalReason('');
    setShowRenewalModal(true);
  };

  const submitRenewalRequest = async (formatDate) => {
    if (!renewalPrescription) return;
    
    if (!renewalReason.trim()) {
      showNotification('Por favor ingresa el motivo de la renovación.', 'warning');
      return;
    }

    try {
      setRenewalLoading(renewalPrescription.id);
      setShowRenewalModal(false);
      
      await PrescriptionModel.requestRenewal(renewalPrescription.id, {
        reason: renewalReason,
        notes: `Receta original emitida el ${formatDate(renewalPrescription.created_at)} por Dr. ${renewalPrescription.doctor_first_name} ${renewalPrescription.doctor_last_name}`
      });
      
      await loadRenewals();
      
      showNotification(
        'Tu solicitud de renovación ha sido enviada al doctor.', 
        'success',
        { label: 'Ver solicitudes', onClick: () => setActiveTab('renewals') }
      );
      
      setRenewalPrescription(null);
    } catch (error) {
      console.error('Error requesting renewal:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Error al solicitar renovación.';
      showNotification(errorMsg, 'error');
    } finally {
      setRenewalLoading(null);
    }
  };

  return {
    loading,
    prescriptions,
    renewals,
    activeTab,
    setActiveTab,
    error,
    notification,
    setNotification,
    renewalLoading,
    showRenewalModal,
    setShowRenewalModal,
    renewalPrescription,
    setRenewalPrescription,
    renewalReason,
    setRenewalReason,
    filteredPrescriptions,
    hasPendingRenewal,
    cancelRenewal,
    renewPrescription,
    submitRenewalRequest,
    showNotification,
  };
}
