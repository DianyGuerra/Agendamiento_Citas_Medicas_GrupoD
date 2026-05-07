import { useState, useEffect } from 'react';
import { MedicalRecordModel } from '../../../../models';

/**
 * Hook for managing medical record state
 */
export function useRecord() {
  const [loading, setLoading] = useState(true);
  const [medicalRecord, setMedicalRecord] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadMedicalRecord();
  }, []);

  const loadMedicalRecord = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await MedicalRecordModel.getComplete();
      setMedicalRecord(response.data || response);
    } catch (error) {
      console.error('Error loading medical record:', error);
      setError('Error al cargar el registro médico');
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    medicalRecord,
    error,
    loadMedicalRecord,
  };
}
