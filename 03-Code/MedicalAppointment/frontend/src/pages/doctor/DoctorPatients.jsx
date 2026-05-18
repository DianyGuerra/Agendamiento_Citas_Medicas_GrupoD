import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DoctorLayout from '../../layouts/DoctorLayout';
import { DoctorModel, ConsultationModel, ScheduleModel, PatientModel, MedicalRecordModel } from '../../models';
import { 
  MagnifyingGlassIcon, 
  CalendarIcon, 
  ClipboardDocumentListIcon,
  ArrowLeftIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  FunnelIcon,
  BellAlertIcon,
  PencilSquareIcon,
  XMarkIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

// Filter types for patient history
const HISTORY_FILTERS = {
  COMPLETED: 'completed',
  SCHEDULED: 'scheduled',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show',
  ALL: 'all'
};

export default function DoctorPatients() {
  const navigate = useNavigate();
  const location = useLocation();
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientHistory, setPatientHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyFilter, setHistoryFilter] = useState(HISTORY_FILTERS.COMPLETED); // Default to completed
  
  // Medical Record Edit Modal
  const [showMedicalRecordModal, setShowMedicalRecordModal] = useState(false);
  const [medicalRecordData, setMedicalRecordData] = useState({
    allergies: '',
    diagnoses: '',
    treatments: '',
    medical_history: '',
    current_medications: ''
  });
  const [savingMedicalRecord, setSavingMedicalRecord] = useState(false);
  const [notification, setNotification] = useState(null);
  
  // Check if we're returning from a consultation with a selected patient
  const returnToPatientId = location.state?.selectedPatientId;
  const [hasRestoredPatient, setHasRestoredPatient] = useState(false);

  useEffect(() => {
    fetchMyPatients();
  }, []);
  
  // Handle returning to a specific patient's history
  useEffect(() => {
    if (returnToPatientId && patients.length > 0 && !hasRestoredPatient) {
      console.log('🔄 Returning to patient history, ID:', returnToPatientId);
      console.log('📋 Available patients:', patients.map(p => ({ id: p.id, user_id: p.user_id, patient_user_id: p.patient_user_id })));
      
      const patientToSelect = patients.find(p => {
        const pid = String(p.id);
        const puid = String(p.user_id || '');
        const ppuid = String(p.patient_user_id || '');
        const targetId = String(returnToPatientId);
        return pid === targetId || puid === targetId || ppuid === targetId;
      });
      
      if (patientToSelect) {
        console.log('✅ Found patient to restore:', patientToSelect);
        setHasRestoredPatient(true);
        handleViewPatient(patientToSelect);
        // Clear the navigation state
        window.history.replaceState({}, document.title);
      } else {
        console.log('❌ Could not find patient with ID:', returnToPatientId);
      }
    }
  }, [returnToPatientId, patients, hasRestoredPatient]);

  useEffect(() => {
    filterPatients();
  }, [searchTerm, patients]);

  const fetchMyPatients = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Obtener pacientes que tienen citas con el doctor (completadas o agendadas)
      const response = await DoctorModel.getMyPatients();
      const myPatients = response?.activePatients || response?.data || response || [];
      
      // Deduplicar pacientes por ID
      const uniquePatients = [];
      const seenIds = new Set();
      
      myPatients.forEach(patient => {
        const patientId = patient.id || patient.user_id || patient.patient_user_id;
        if (!seenIds.has(patientId)) {
          seenIds.add(patientId);
          uniquePatients.push({
            ...patient,
            id: patientId
          });
        }
      });
      
      console.log('✅ Mis pacientes:', uniquePatients.length);
      
      if (uniquePatients.length === 0) {
        setError('No tienes pacientes registrados todavía. Los pacientes aparecerán aquí cuando agenden una cita contigo.');
      }
      
      setPatients(uniquePatients);
    } catch (err) {
      console.error('Error fetching my patients:', err);
      setError('Error al cargar los pacientes. Verifica tu conexión e intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const filterPatients = () => {
    if (!searchTerm.trim()) {
      setFilteredPatients(patients);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = patients.filter(patient =>
      patient.first_name?.toLowerCase().includes(term) ||
      patient.last_name?.toLowerCase().includes(term) ||
      patient.cedula?.includes(term)
    );
    setFilteredPatients(filtered);
  };

  const loadPatientHistory = async (patient) => {
    try {
      setLoadingHistory(true);
      
      // First, cleanup past appointments (mark as no-show)
      await ScheduleModel.cleanupPastAppointments();
      
      const patientId = patient.id || patient.user_id || patient.patient_user_id;
      const response = await ConsultationModel.getPatientHistory(patientId);
      setPatientHistory(response?.data || response || []);
    } catch (err) {
      console.error('Error loading patient history:', err);
      setPatientHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Filter patient history based on selected filter
  const filteredHistory = useMemo(() => {
    if (historyFilter === HISTORY_FILTERS.ALL) {
      return patientHistory;
    }
    return patientHistory.filter(apt => {
      const status = apt.status || 'scheduled';
      if (historyFilter === HISTORY_FILTERS.SCHEDULED) {
        return status === 'scheduled' || status === 'confirmed';
      }
      if (historyFilter === HISTORY_FILTERS.NO_SHOW) {
        return status === 'no_show';
      }
      return status === historyFilter;
    });
  }, [patientHistory, historyFilter]);

  // Count appointments by status
  const historyCounts = useMemo(() => {
    const counts = { completed: 0, scheduled: 0, cancelled: 0, no_show: 0, all: 0 };
    patientHistory.forEach(apt => {
      const status = apt.status || 'scheduled';
      counts.all++;
      if (status === 'completed') counts.completed++;
      else if (status === 'scheduled' || status === 'confirmed') counts.scheduled++;
      else if (status === 'cancelled') counts.cancelled++;
      else if (status === 'no_show') counts.no_show++;
    });
    return counts;
  }, [patientHistory]);

  const handleViewPatient = async (patient) => {
    setHistoryFilter(HISTORY_FILTERS.COMPLETED); // Reset to default filter
    
    // Load additional patient details (from patients table)
    const patientId = patient.id || patient.user_id || patient.patient_user_id;
    let enrichedPatient = { ...patient };
    
    try {
      const patientDetails = await PatientModel.getByUserId(patientId);
      const details = patientDetails?.data || patientDetails;
      if (details) {
        enrichedPatient = {
          ...patient,
          date_of_birth: details.date_of_birth,
          gender: details.gender,
          blood_type: details.blood_type,
          allergies: details.allergies,
          medical_conditions: details.medical_conditions,
          address: details.address,
          city: details.city,
          insurance_provider_id: details.insurance_provider_id,
          insurance_providers: details.insurance_providers,
          insurance_number: details.insurance_number,
          emergency_contact_name: details.emergency_contact_name,
          emergency_contact_phone: details.emergency_contact_phone,
          height: details.height,
          weight: details.weight
        };
      }
    } catch (err) {
      console.log('Could not load additional patient details:', err);
    }
    
    setSelectedPatient(enrichedPatient);
    await loadPatientHistory(patient);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatShortDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('es-ES');
  };

  // Open medical record edit modal
  const handleOpenMedicalRecordModal = async () => {
    if (!selectedPatient) return;
    
    const patientId = selectedPatient.id || selectedPatient.user_id || selectedPatient.patient_user_id;
    
    try {
      // Load current medical record
      const record = await MedicalRecordModel.getByPatientId(patientId);
      
      setMedicalRecordData({
        allergies: record?.allergies || '',
        diagnoses: record?.diagnoses || '',
        treatments: record?.treatments || '',
        medical_history: record?.medical_history || '',
        current_medications: record?.current_medications || ''
      });
    } catch (err) {
      // If no record exists, start with empty form
      setMedicalRecordData({
        allergies: selectedPatient.allergies || '',
        diagnoses: '',
        treatments: '',
        medical_history: '',
        current_medications: ''
      });
    }
    
    setShowMedicalRecordModal(true);
  };

  // Save medical record
  const handleSaveMedicalRecord = async () => {
    if (!selectedPatient) return;
    
    const patientId = selectedPatient.id || selectedPatient.user_id || selectedPatient.patient_user_id;
    
    try {
      setSavingMedicalRecord(true);
      
      await MedicalRecordModel.updateByPatientId(patientId, medicalRecordData);
      
      // Update local patient data
      setSelectedPatient(prev => ({
        ...prev,
        allergies: medicalRecordData.allergies,
        medical_conditions: medicalRecordData.diagnoses
      }));
      
      setShowMedicalRecordModal(false);
      showNotification('Historial médico actualizado exitosamente', 'success');
    } catch (err) {
      console.error('Error saving medical record:', err);
      showNotification('Error al guardar el historial médico', 'error');
    } finally {
      setSavingMedicalRecord(false);
    }
  };

  // Show notification
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  return (
    <DoctorLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Mis Pacientes</h2>
          <p className="text-xs sm:text-sm text-gray-600">
            Pacientes con citas: {patients.length}
          </p>
        </div>

        {/* Search Bar - only show when no patient is selected */}
        {!selectedPatient && (
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-2.5 sm:top-3 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre o cédula..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 sm:pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                style={{ fontSize: '16px' }}
              />
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error && patients.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-6 py-8 rounded-lg text-center">
            <ClipboardDocumentListIcon className="w-12 h-12 mx-auto text-yellow-500 mb-3" />
            <p className="font-medium">{error}</p>
          </div>
        ) : !selectedPatient ? (
          /* Patient List View */
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Nombre</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Cédula</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Teléfono</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Última Cita</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredPatients.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                        {searchTerm ? 'No se encontraron pacientes con ese criterio' : 'No tienes pacientes con citas todavía'}
                      </td>
                    </tr>
                  ) : (
                    filteredPatients.map(patient => (
                      <tr key={patient.id || patient.user_id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                              {patient.first_name?.charAt(0)}{patient.last_name?.charAt(0)}
                            </div>
                            <span className="font-medium text-gray-900">
                              {patient.first_name} {patient.last_name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {patient.cedula || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {patient.phone_number || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {patient.email || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {formatShortDate(patient.last_visit || patient.last_appointment)}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <button
                            onClick={() => handleViewPatient(patient)}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Ver Historial
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Patient Details View */
          <div className="space-y-6">
            <button
              onClick={() => {
                setSelectedPatient(null);
                setPatientHistory([]);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Volver a la lista
            </button>

            {/* Patient Info Card */}
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 mb-6">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-blue-100 flex items-center justify-center text-xl sm:text-2xl text-blue-600 font-bold flex-shrink-0">
                  {selectedPatient.first_name?.charAt(0)}{selectedPatient.last_name?.charAt(0)}
                </div>
                <div className="text-center sm:text-left">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-800">
                    {selectedPatient.first_name} {selectedPatient.last_name}
                  </h3>
                  <p className="text-gray-600 text-sm sm:text-base">Cédula: {selectedPatient.cedula || 'N/A'}</p>
                  <p className="text-gray-500 text-xs sm:text-sm mt-1">
                    {selectedPatient.email} • {selectedPatient.phone_number}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <h4 className="font-semibold text-gray-700 mb-3 sm:mb-4 text-sm sm:text-base">Información Personal</h4>
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Edad</span>
                      <span className="font-medium text-gray-900">
                        {selectedPatient.date_of_birth 
                          ? `${Math.floor((new Date() - new Date(selectedPatient.date_of_birth)) / (365.25 * 24 * 60 * 60 * 1000))} años`
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Fecha de Nacimiento</span>
                      <span className="font-medium text-gray-900">
                        {selectedPatient.date_of_birth 
                          ? new Date(selectedPatient.date_of_birth).toLocaleDateString('es-ES')
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Género</span>
                      <span className="font-medium text-gray-900">
                        {selectedPatient.gender === 'male' ? 'Masculino' : 
                         selectedPatient.gender === 'female' ? 'Femenino' : 
                         selectedPatient.gender || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Tipo de Sangre</span>
                      <span className="font-medium text-gray-900">{selectedPatient.blood_type || 'N/A'}</span>
                    </div>
                    {selectedPatient.height && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Altura</span>
                        <span className="font-medium text-gray-900">{selectedPatient.height} cm</span>
                      </div>
                    )}
                    {selectedPatient.weight && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Peso</span>
                        <span className="font-medium text-gray-900">{selectedPatient.weight} kg</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-700">Información Médica</h4>
                    <button
                      onClick={handleOpenMedicalRecordModal}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      <PencilSquareIcon className="w-4 h-4" />
                      Editar Historial
                    </button>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-gray-600">Alergias</span>
                      <p className="font-medium text-gray-900">{selectedPatient.allergies || 'Ninguna registrada'}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Condiciones Crónicas</span>
                      <p className="font-medium text-gray-900">{selectedPatient.medical_conditions || 'Ninguna'}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Additional Info Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-gray-200">
                {/* Insurance Info */}
                {(selectedPatient.insurance_providers || selectedPatient.insurance_number) && (
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-4">Información de Seguro</h4>
                    <div className="space-y-3">
                      {selectedPatient.insurance_providers && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Proveedor</span>
                          <span className="font-medium text-gray-900">{selectedPatient.insurance_providers.name}</span>
                        </div>
                      )}
                      {selectedPatient.insurance_number && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Número de Póliza</span>
                          <span className="font-medium text-gray-900">{selectedPatient.insurance_number}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Emergency Contact */}
                {(selectedPatient.emergency_contact_name || selectedPatient.emergency_contact_phone) && (
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-4">Contacto de Emergencia</h4>
                    <div className="space-y-3">
                      {selectedPatient.emergency_contact_name && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Nombre</span>
                          <span className="font-medium text-gray-900">{selectedPatient.emergency_contact_name}</span>
                        </div>
                      )}
                      {selectedPatient.emergency_contact_phone && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Teléfono</span>
                          <span className="font-medium text-gray-900">{selectedPatient.emergency_contact_phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Consultation History */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                  <ClipboardDocumentListIcon className="w-5 h-5 text-blue-600" />
                  Historial de Citas
                </h4>
              </div>

              {/* Filter Tabs */}
              <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-gray-200">
                <button
                  onClick={() => setHistoryFilter(HISTORY_FILTERS.COMPLETED)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition ${
                    historyFilter === HISTORY_FILTERS.COMPLETED
                      ? 'bg-green-600 text-white'
                      : 'bg-green-50 text-green-700 hover:bg-green-100'
                  }`}
                >
                  <CheckCircleIcon className="w-4 h-4" />
                  Completadas ({historyCounts.completed})
                </button>
                <button
                  onClick={() => setHistoryFilter(HISTORY_FILTERS.SCHEDULED)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition ${
                    historyFilter === HISTORY_FILTERS.SCHEDULED
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                  }`}
                >
                  <ClockIcon className="w-4 h-4" />
                  Agendadas ({historyCounts.scheduled})
                </button>
                <button
                  onClick={() => setHistoryFilter(HISTORY_FILTERS.CANCELLED)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition ${
                    historyFilter === HISTORY_FILTERS.CANCELLED
                      ? 'bg-red-600 text-white'
                      : 'bg-red-50 text-red-700 hover:bg-red-100'
                  }`}
                >
                  <XCircleIcon className="w-4 h-4" />
                  Canceladas ({historyCounts.cancelled})
                </button>
                <button
                  onClick={() => setHistoryFilter(HISTORY_FILTERS.NO_SHOW)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition ${
                    historyFilter === HISTORY_FILTERS.NO_SHOW
                      ? 'bg-orange-600 text-white'
                      : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
                  }`}
                >
                  <BellAlertIcon className="w-4 h-4" />
                  No asistió ({historyCounts.no_show})
                </button>
                <button
                  onClick={() => setHistoryFilter(HISTORY_FILTERS.ALL)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition ${
                    historyFilter === HISTORY_FILTERS.ALL
                      ? 'bg-gray-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <FunnelIcon className="w-4 h-4" />
                  Todas ({historyCounts.all})
                </button>
              </div>

              {loadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : filteredHistory.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  {patientHistory.length === 0 
                    ? 'No hay historial de citas registrado'
                    : `No hay citas ${historyFilter === HISTORY_FILTERS.COMPLETED ? 'completadas' : 
                        historyFilter === HISTORY_FILTERS.SCHEDULED ? 'agendadas' : 
                        historyFilter === HISTORY_FILTERS.CANCELLED ? 'canceladas' : 
                        historyFilter === HISTORY_FILTERS.NO_SHOW ? 'con estado "no asistió"' : ''}`
                  }
                </p>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {filteredHistory.map((appointment, index) => {
                    const status = appointment.status || 'scheduled';
                    const statusConfig = {
                      completed: { label: 'Completada', bg: 'bg-green-100', text: 'text-green-800' },
                      scheduled: { label: 'Agendada', bg: 'bg-blue-100', text: 'text-blue-800' },
                      confirmed: { label: 'Confirmada', bg: 'bg-blue-100', text: 'text-blue-800' },
                      cancelled: { label: 'Cancelada', bg: 'bg-red-100', text: 'text-red-800' },
                      no_show: { label: 'No Asistió', bg: 'bg-yellow-100', text: 'text-yellow-800' },
                      in_progress: { label: 'En Progreso', bg: 'bg-purple-100', text: 'text-purple-800' }
                    };
                    const config = statusConfig[status] || statusConfig.scheduled;
                    
                    return (
                      <button
                        key={appointment.id || appointment.appointment_id || index}
                        type="button"
                        onClick={() => {
                          if (status === 'cancelled' || status === 'no_show') return;
                          const appointmentId = appointment.id || appointment.appointment_id;
                          if (appointmentId) {
                            navigate(`/doctor/consultation/${appointmentId}`, {
                              state: { 
                                fromPatientHistory: true,
                                patientId: selectedPatient.id || selectedPatient.user_id
                              }
                            });
                          }
                        }}
                        aria-label="Abrir consulta"
                        className={`border border-gray-200 rounded-lg p-4 transition ${
                          (status !== 'cancelled' && status !== 'no_show') 
                            ? 'hover:bg-gray-50 cursor-pointer' 
                            : 'cursor-default opacity-75'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="w-4 h-4 text-gray-500" />
                            <span className="font-medium text-gray-800">
                              {formatDate(appointment.scheduled_start || appointment.created_at)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs ${config.bg} ${config.text} px-2 py-1 rounded-full`}>
                              {config.label}
                            </span>
                            {/* Only show view details button for non-cancelled and non-no_show appointments */}
                            {(appointment.id || appointment.appointment_id) && status !== 'cancelled' && status !== 'no_show' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const appointmentId = appointment.id || appointment.appointment_id;
                                  navigate(`/doctor/consultation/${appointmentId}`, {
                                    state: { 
                                      fromPatientHistory: true,
                                      patientId: selectedPatient.id || selectedPatient.user_id
                                    }
                                  });
                                }}
                                className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                                title="Ver detalles"
                              >
                                <EyeIcon className="w-5 h-5" />
                              </button>
                            )}
                          </div>
                        </div>
                        
                        {appointment.reason && (
                          <div className="mt-2">
                            <p className="text-sm text-gray-600">Motivo:</p>
                            <p className="text-gray-800">{appointment.reason}</p>
                          </div>
                        )}
                        
                        {appointment.assessment && (
                          <div className="mt-2">
                            <p className="text-sm text-gray-600">Diagnóstico:</p>
                            <p className="text-gray-800">{appointment.assessment}</p>
                          </div>
                        )}
                        
                        {appointment.plan && (
                          <div className="mt-2">
                            <p className="text-sm text-gray-600">Plan de tratamiento:</p>
                            <p className="text-gray-800">{appointment.plan}</p>
                          </div>
                        )}

                        {status !== 'cancelled' && status !== 'no_show' && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <span className="text-xs text-blue-600 flex items-center gap-1">
                              <EyeIcon className="w-4 h-4" />
                              Haz clic para ver detalles completos
                            </span>
                          </div>
                        )}
                        {status === 'cancelled' && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              Esta cita fue cancelada - no hay detalles disponibles
                            </span>
                          </div>
                        )}
                        {status === 'no_show' && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <span className="text-xs text-orange-600 flex items-center gap-1">
                              <BellAlertIcon className="w-4 h-4" />
                              El paciente no asistió a esta cita
                            </span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notification Toast */}
        {notification && (
          <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 ${
            notification.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {notification.type === 'success' ? (
              <CheckCircleIcon className="w-5 h-5 text-green-500" />
            ) : (
              <XCircleIcon className="w-5 h-5 text-red-500" />
            )}
            <span>{notification.message}</span>
            <button onClick={() => setNotification(null)} className="ml-2 hover:opacity-70">
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Medical Record Edit Modal */}
        {showMedicalRecordModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700">
                <div className="flex items-center gap-3">
                  <DocumentTextIcon className="w-6 h-6 text-white" />
                  <div>
                    <h3 className="text-lg font-semibold text-white">Editar Historial Médico</h3>
                    <p className="text-blue-100 text-sm">
                      {selectedPatient?.first_name} {selectedPatient?.last_name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowMedicalRecordModal(false)}
                  className="text-white/80 hover:text-white transition"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] space-y-5">
                {/* Allergies */}
                <div>
                  <span className="block text-sm font-medium text-gray-700 mb-1">
                    Alergias
                  </span>
                  <textarea
                    value={medicalRecordData.allergies}
                    onChange={(e) => setMedicalRecordData(prev => ({ ...prev, allergies: e.target.value }))}
                    placeholder="Ej: Penicilina, Mariscos, Polen..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={2}
                  />
                </div>

                {/* Diagnoses */}
                <div>
                  <span className="block text-sm font-medium text-gray-700 mb-1">
                    Diagnósticos
                  </span>
                  <textarea
                    value={medicalRecordData.diagnoses}
                    onChange={(e) => setMedicalRecordData(prev => ({ ...prev, diagnoses: e.target.value }))}
                    placeholder="Diagnósticos actuales y previos del paciente..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                  />
                </div>

                {/* Treatments */}
                <div>
                  <span className="block text-sm font-medium text-gray-700 mb-1">
                    Tratamientos
                  </span>
                  <textarea
                    value={medicalRecordData.treatments}
                    onChange={(e) => setMedicalRecordData(prev => ({ ...prev, treatments: e.target.value }))}
                    placeholder="Tratamientos actuales y previos..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                  />
                </div>

                {/* Medical History */}
                <div>
                  <span className="block text-sm font-medium text-gray-700 mb-1">
                    Historial Médico / Antecedentes
                  </span>
                  <textarea
                    value={medicalRecordData.medical_history}
                    onChange={(e) => setMedicalRecordData(prev => ({ ...prev, medical_history: e.target.value }))}
                    placeholder="Antecedentes familiares, cirugías previas, hospitalizaciones..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                  />
                </div>

                {/* Current Medications */}
                <div>
                  <span className="block text-sm font-medium text-gray-700 mb-1">
                    Medicamentos Actuales
                  </span>
                  <textarea
                    value={medicalRecordData.current_medications}
                    onChange={(e) => setMedicalRecordData(prev => ({ ...prev, current_medications: e.target.value }))}
                    placeholder="Medicamentos que el paciente toma actualmente..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={2}
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
                <button
                  onClick={() => setShowMedicalRecordModal(false)}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveMedicalRecord}
                  disabled={savingMedicalRecord}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {savingMedicalRecord ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="w-4 h-4" />
                      Guardar Cambios
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DoctorLayout>
  );
}
