import { useState, useEffect, useCallback } from 'react';
import { MedicalRecordModel } from '../../../../models';

export default function useLab() {
  const [loading, setLoading] = useState(true);
  const [labResults, setLabResults] = useState([]);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  
  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [uploadData, setUploadData] = useState({
    lab_name: '',
    notes: '',
    results: []
  });
  const [submitting, setSubmitting] = useState(false);

  const showNotification = useCallback((message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  }, []);

  const loadLabResults = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await MedicalRecordModel.getLabReports();
      const data = response.data || response;
      setLabResults(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading lab results:', err);
      setError('Error al cargar los resultados de laboratorio');
      setLabResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLabResults();
  }, [loadLabResults]);

  const openUploadModal = useCallback((report) => {
    setSelectedReport(report);
    setUploadData({
      lab_name: '',
      notes: '',
      results: [{ parameter_name: '', result_value: '', unit: '', reference_range: '', status: 'normal' }]
    });
    setShowUploadModal(true);
  }, []);

  const addParameter = useCallback(() => {
    setUploadData(prev => ({
      ...prev,
      results: [...prev.results, { parameter_name: '', result_value: '', unit: '', reference_range: '', status: 'normal' }]
    }));
  }, []);

  const removeParameter = useCallback((index) => {
    setUploadData(prev => ({
      ...prev,
      results: prev.results.filter((_, i) => i !== index)
    }));
  }, []);

  const updateParameter = useCallback((index, field, value) => {
    setUploadData(prev => ({
      ...prev,
      results: prev.results.map((p, i) => i === index ? { ...p, [field]: value } : p)
    }));
  }, []);

  const submitUpload = async () => {
    if (!selectedReport) {
      showNotification('No hay examen seleccionado', 'error');
      return;
    }

    const validResults = uploadData.results.filter(r => r.parameter_name && r.result_value);
    if (validResults.length === 0) {
      showNotification('Ingrese al menos un resultado', 'error');
      return;
    }

    try {
      setSubmitting(true);
      await MedicalRecordModel.patientUploadResults(selectedReport.id, {
        results: validResults,
        interpretation: uploadData.lab_name 
          ? `Laboratorio: ${uploadData.lab_name}. ${uploadData.notes || ''}` 
          : uploadData.notes || '',
        status: 'completed'
      });

      setShowUploadModal(false);
      setSelectedReport(null);
      showNotification('Resultados subidos exitosamente', 'success');
      loadLabResults();
    } catch (err) {
      console.error('Error uploading lab results:', err);
      showNotification('Error al subir los resultados', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return {
    loading,
    labResults,
    error,
    notification,
    showUploadModal,
    setShowUploadModal,
    selectedReport,
    setSelectedReport,
    uploadData,
    setUploadData,
    submitting,
    loadLabResults,
    openUploadModal,
    addParameter,
    removeParameter,
    updateParameter,
    submitUpload,
    showNotification,
  };
}

// Status configurations
export const getStatusConfig = (status) => {
  const configs = {
    completed: { badge: 'bg-green-100 text-green-800', label: 'Normal' },
    needs_review: { badge: 'bg-yellow-100 text-yellow-800', label: 'Revisar' },
    pending: { badge: 'bg-blue-100 text-blue-800', label: 'Pendiente' },
  };
  return configs[status] || configs['pending'];
};

export const getParameterStatusClass = (status) => {
  const normalizedStatus = (status || '').toLowerCase();
  if (normalizedStatus === 'alto' || normalizedStatus === 'high') return 'text-red-700 bg-red-50 font-bold';
  if (normalizedStatus === 'bajo' || normalizedStatus === 'low') return 'text-yellow-700 bg-yellow-50 font-bold';
  if (normalizedStatus === 'normal') return 'text-green-700 bg-green-50 font-bold';
  return 'text-gray-700 bg-gray-50';
};
