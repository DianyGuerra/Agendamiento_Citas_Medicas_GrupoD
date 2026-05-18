import React, { useState, useEffect } from 'react';
import DoctorLayout from '../../layouts/DoctorLayout';
import { PrescriptionModel, DoctorModel } from '../../models';
import { 
  DocumentTextIcon,
  EyeIcon, 
  ArrowDownTrayIcon, 
  QrCodeIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  ClockIcon,
  XMarkIcon,
  BeakerIcon,
  UserIcon,
  ExclamationCircleIcon,
  PlusIcon,
  FunnelIcon,
  TrashIcon,
  CheckIcon,
  ArrowPathIcon,
  InboxIcon
} from '@heroicons/react/24/outline';
import PrescriptionQRModal from '../../components/PrescriptionQRModal';

const FILTER_TYPES = {
  ALL: 'all',
  TODAY: 'today',
  THIS_WEEK: 'week',
  THIS_MONTH: 'month',
  RENEWALS: 'renewals'
};

export default function DoctorPrescriptions() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [filteredPrescriptions, setFilteredPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [activeTab, setActiveTab] = useState(FILTER_TYPES.ALL);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrPrescription, setQRPrescription] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState('all');
  const [uniquePatients, setUniquePatients] = useState([]);
  
  // Renewal states
  const [renewals, setRenewals] = useState([]);
  const [loadingRenewals, setLoadingRenewals] = useState(false);
  const [renewalFilter, setRenewalFilter] = useState('pending');
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRenewal, setSelectedRenewal] = useState(null);
  const [approveData, setApproveData] = useState({ diagnosis: '', duration: '', response: '' });
  const [rejectReason, setRejectReason] = useState('');
  const [processingRenewal, setProcessingRenewal] = useState(false);
  
  // Create prescription modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [myPatients, setMyPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [creatingPrescription, setCreatingPrescription] = useState(false);
  const [createFormSelectedPatient, setCreateFormSelectedPatient] = useState('');
  const [newMedications, setNewMedications] = useState([]);
  const [newMedication, setNewMedication] = useState({
    medication: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: ''
  });
  const [generalDiagnosis, setGeneralDiagnosis] = useState('');
  const [generalInstructions, setGeneralInstructions] = useState('');
  const [generalDuration, setGeneralDuration] = useState('');

  useEffect(() => {
    fetchPrescriptions();
    fetchRenewals();
  }, []);

  useEffect(() => {
    filterPrescriptions();
  }, [searchTerm, prescriptions, activeTab, selectedPatient]);

  // Helper to check if a prescription has a pending renewal
  const hasPendingRenewal = (prescriptionId) => {
    return renewals.some(r => r.prescription_id === prescriptionId && r.status === 'pending');
  };

  const fetchRenewals = async () => {
    try {
      setLoadingRenewals(true);
      const response = await PrescriptionModel.getRenewals('all');
      const data = response?.data || response || [];
      setRenewals(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching renewals:', err);
    } finally {
      setLoadingRenewals(false);
    }
  };

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      
      // Obtener todas las recetas del doctor
      const response = await PrescriptionModel.getAll();
      const allPrescriptions = Array.isArray(response) 
        ? response 
        : (response?.data || response?.prescriptions || []);
      
      // Ordenar por fecha más reciente
      allPrescriptions.sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      );
      
      // Extract unique patients
      const patients = new Map();
      allPrescriptions.forEach(p => {
        const name = getPatientName(p);
        const userId = p.patient_user_id;
        if (userId && name !== 'Sin nombre') {
          patients.set(userId, name);
        }
      });
      setUniquePatients(Array.from(patients, ([id, name]) => ({ id, name })));
      
      console.log('✅ Recetas cargadas:', allPrescriptions.length);
      setPrescriptions(allPrescriptions);
    } catch (err) {
      console.error('Error fetching prescriptions:', err);
      showNotification('Error al cargar las recetas', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filterPrescriptions = () => {
    let filtered = [...prescriptions];
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Filtrar por tab
    switch (activeTab) {
      case FILTER_TYPES.TODAY:
        filtered = filtered.filter(p => {
          const date = new Date(p.created_at);
          return date >= today;
        });
        break;
      case FILTER_TYPES.THIS_WEEK:
        filtered = filtered.filter(p => {
          const date = new Date(p.created_at);
          return date >= weekAgo;
        });
        break;
      case FILTER_TYPES.THIS_MONTH:
        filtered = filtered.filter(p => {
          const date = new Date(p.created_at);
          return date >= monthStart;
        });
        break;
      default:
        break;
    }
    
    // Filtrar por paciente
    if (selectedPatient !== 'all') {
      filtered = filtered.filter(p => p.patient_user_id === selectedPatient);
    }
    
    // Filtrar por búsqueda
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.patient_name?.toLowerCase().includes(term) ||
        p.patient_first_name?.toLowerCase().includes(term) ||
        p.patient_last_name?.toLowerCase().includes(term) ||
        p.diagnosis?.toLowerCase().includes(term) ||
        getMedicationsText(p.medications)?.toLowerCase().includes(term)
      );
    }
    
    setFilteredPrescriptions(filtered);
  };

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Renewal management functions
  const openApproveModal = (renewal) => {
    setSelectedRenewal(renewal);
    setApproveData({
      diagnosis: renewal.original_diagnosis || renewal.prescriptions?.diagnosis || '',
      duration: renewal.original_duration || renewal.prescriptions?.duration || '',
      response: ''
    });
    setShowApproveModal(true);
  };

  const openRejectModal = (renewal) => {
    setSelectedRenewal(renewal);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleApproveRenewal = async () => {
    if (!selectedRenewal) return;
    
    try {
      setProcessingRenewal(true);
      await PrescriptionModel.approveRenewal(selectedRenewal.id, {
        modified_diagnosis: approveData.diagnosis || null,
        modified_duration: approveData.duration || null,
        doctor_response: approveData.response || null
      });
      showNotification('Renovación aprobada exitosamente', 'success');
      setShowApproveModal(false);
      setSelectedRenewal(null);
      setApproveData({ diagnosis: '', duration: '', response: '' });
      await fetchRenewals();
      await fetchPrescriptions();
    } catch (err) {
      console.error('Error approving renewal:', err);
      showNotification('Error al aprobar la renovación', 'error');
    } finally {
      setProcessingRenewal(false);
    }
  };

  const handleRejectRenewal = async () => {
    if (!selectedRenewal || !rejectReason.trim()) {
      showNotification('Debe proporcionar un motivo para rechazar', 'warning');
      return;
    }
    
    try {
      setProcessingRenewal(true);
      await PrescriptionModel.rejectRenewal(selectedRenewal.id, { rejection_reason: rejectReason });
      showNotification('Renovación rechazada', 'success');
      setShowRejectModal(false);
      setSelectedRenewal(null);
      await fetchRenewals();
    } catch (err) {
      console.error('Error rejecting renewal:', err);
      showNotification('Error al rechazar la renovación', 'error');
    } finally {
      setProcessingRenewal(false);
    }
  };

  const getPendingRenewalsCount = () => {
    return renewals.filter(r => r.status === 'pending').length;
  };

  const getFilteredRenewals = () => {
    if (renewalFilter === 'all') return renewals;
    return renewals.filter(r => r.status === renewalFilter);
  };

  // Fetch patients that have had appointments with this doctor
  const fetchMyPatients = async () => {
    try {
      setLoadingPatients(true);
      const response = await DoctorModel.getMyPatients();
      const patients = response?.data || response || [];
      console.log('✅ Pacientes del doctor:', patients.length);
      setMyPatients(Array.isArray(patients) ? patients : []);
    } catch (err) {
      console.error('Error fetching patients:', err);
      showNotification('Error al cargar pacientes', 'error');
      setMyPatients([]);
    } finally {
      setLoadingPatients(false);
    }
  };

  // Open create prescription modal
  const openCreateModal = async () => {
    setShowCreateModal(true);
    await fetchMyPatients();
  };

  // Close create modal and reset form
  const closeCreateModal = () => {
    setShowCreateModal(false);
    setCreateFormSelectedPatient('');
    setNewMedications([]);
    setNewMedication({
      medication: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: ''
    });
    setGeneralDiagnosis('');
    setGeneralInstructions('');
    setGeneralDuration('');
  };

  // Add medication to list
  const handleAddMedication = () => {
    if (!newMedication.medication || !newMedication.dosage) {
      showNotification('El medicamento y la dosis son requeridos', 'warning');
      return;
    }
    setNewMedications([...newMedications, { ...newMedication }]);
    setNewMedication({
      medication: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: ''
    });
  };

  // Remove medication from list
  const handleRemoveMedication = (index) => {
    setNewMedications(newMedications.filter((_, i) => i !== index));
  };

  // Create new prescription
  const handleCreatePrescription = async () => {
    if (!createFormSelectedPatient) {
      showNotification('Seleccione un paciente', 'warning');
      return;
    }
    if (newMedications.length === 0) {
      showNotification('Agregue al menos un medicamento', 'warning');
      return;
    }

    try {
      setCreatingPrescription(true);
      
      const prescriptionData = {
        patient_user_id: createFormSelectedPatient,
        medications: JSON.stringify(newMedications),
        diagnosis: generalDiagnosis || null,
        instructions: generalInstructions || null,
        duration: generalDuration || null
      };

      await PrescriptionModel.create(prescriptionData);
      
      showNotification('Receta creada exitosamente', 'success');
      closeCreateModal();
      await fetchPrescriptions(); // Reload prescriptions list
    } catch (err) {
      console.error('Error creating prescription:', err);
      showNotification('Error al crear la receta: ' + (err.message || 'Error desconocido'), 'error');
    } finally {
      setCreatingPrescription(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('es-EC', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatFullDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('es-EC', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPatientName = (prescription) => {
    if (prescription.patient_name && prescription.patient_name !== 'Paciente') {
      return prescription.patient_name;
    }
    if (prescription.patient_first_name) {
      return `${prescription.patient_first_name} ${prescription.patient_last_name || ''}`.trim();
    }
    if (prescription.patient?.first_name) {
      return `${prescription.patient.first_name} ${prescription.patient.last_name || ''}`.trim();
    }
    return 'Sin nombre';
  };

  // Parse medications - handle JSON or string format
  const parseMedications = (medications) => {
    if (!medications) return [];
    
    try {
      if (typeof medications === 'string') {
        // Try to parse as JSON
        if (medications.trim().startsWith('[') || medications.trim().startsWith('{')) {
          const parsed = JSON.parse(medications);
          return Array.isArray(parsed) ? parsed : [parsed];
        }
        // Handle multiline string format - each line is a medication
        return medications.split('\n').filter(m => m.trim()).map(m => ({ medication: m.trim() }));
      }
      if (Array.isArray(medications)) {
        return medications;
      }
      if (typeof medications === 'object') {
        return [medications];
      }
    } catch (e) {
      console.warn('Error parsing medications:', e);
      // If parsing fails, return as single medication
      return [{ medication: String(medications) }];
    }
    
    return [];
  };

  // Get medications as display text
  const getMedicationsText = (medications) => {
    const parsed = parseMedications(medications);
    if (parsed.length === 0) return 'N/A';
    
    return parsed.map(med => med.medication || med.name || med).join(', ');
  };

  // Get short medications for table
  const getMedicationsShort = (medications) => {
    const text = getMedicationsText(medications);
    return text.length > 40 ? text.substring(0, 40) + '...' : text;
  };

  const handleQRClick = (prescription) => {
    if (!prescription.qr_url && !prescription.has_qr) {
      showNotification('Esta receta no tiene código QR generado', 'error');
      return;
    }
    setQRPrescription(prescription);
    setShowQRModal(true);
  };

  const downloadPrescriptionPDF = async (prescription) => {
    try {
      // Cargar jsPDF desde CDN si no está disponible
      if (!window.jspdf) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
          document.body.appendChild(script);
        });
      }
      
      await generatePDF(prescription);
    } catch (err) {
      console.error('Error downloading PDF:', err);
      showNotification('Error al generar PDF', 'error');
    }
  };

  const generatePDF = async (prescription) => {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    let y = 20;

    // Colores
    const primaryColor = [41, 128, 185];
    const secondaryColor = [52, 73, 94];
    const successColor = [46, 204, 113];

    // Encabezado
    pdf.setFillColor(...primaryColor);
    pdf.rect(0, 0, pageWidth, 45, 'F');

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(24);
    pdf.setFont(undefined, 'bold');
    pdf.text('CLÍNICA SAN MIGUEL', margin, 20);
    
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    pdf.text('Centro Médico Especializado', margin, 28);
    pdf.text('Tel: (02) 2XXX-XXXX | Email: info@clinicasanmiguel.ec', margin, 34);

    // Título
    y = 55;
    pdf.setTextColor(...secondaryColor);
    pdf.setFontSize(18);
    pdf.setFont(undefined, 'bold');
    pdf.text('RECETA MÉDICA', margin, y);
    
    y += 3;
    pdf.setDrawColor(...successColor);
    pdf.setLineWidth(1);
    pdf.line(margin, y, pageWidth - margin, y);

    // Información del paciente
    y += 12;
    pdf.setFillColor(245, 245, 245);
    pdf.rect(margin, y, pageWidth - 2 * margin, 20, 'F');
    
    y += 8;
    pdf.setFontSize(11);
    pdf.setFont(undefined, 'bold');
    pdf.text('PACIENTE', margin + 5, y);
    
    y += 7;
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    pdf.text(`Nombre: ${getPatientName(prescription)}`, margin + 5, y);

    // Fecha
    y += 15;
    pdf.setFont(undefined, 'bold');
    pdf.text('FECHA DE EMISIÓN', margin, y);
    y += 7;
    pdf.setFont(undefined, 'normal');
    pdf.text(formatFullDate(prescription.created_at), margin + 5, y);

    // Diagnóstico
    if (prescription.diagnosis) {
      y += 12;
      pdf.setFont(undefined, 'bold');
      pdf.setFontSize(11);
      pdf.text('DIAGNÓSTICO', margin, y);
      y += 7;
      pdf.setFont(undefined, 'normal');
      pdf.setFontSize(10);
      const diagLines = pdf.splitTextToSize(prescription.diagnosis, pageWidth - 2 * margin - 10);
      diagLines.forEach(line => {
        pdf.text(line, margin + 5, y);
        y += 6;
      });
    }

    // Medicamentos - Parse JSON format
    y += 10;
    pdf.setFont(undefined, 'bold');
    pdf.setFontSize(12);
    pdf.setTextColor(...primaryColor);
    pdf.text('MEDICAMENTOS', margin, y);
    y += 8;

    pdf.setTextColor(...secondaryColor);
    pdf.setFontSize(10);
    
    const medications = parseMedications(prescription.medications);
    medications.forEach((med, index) => {
      const medName = med.medication || med.name || med;
      pdf.setFont(undefined, 'bold');
      pdf.text(`${index + 1}. ${medName}${med.dosage ? ` - ${med.dosage}` : ''}`, margin + 5, y);
      y += 6;
      
      pdf.setFont(undefined, 'normal');
      
      if (med.frequency) {
        pdf.text(`   Frecuencia: ${med.frequency}`, margin + 5, y);
        y += 5;
      }
      
      if (med.duration) {
        pdf.text(`   Duración: ${med.duration}`, margin + 5, y);
        y += 5;
      }
      
      if (med.instructions) {
        const instrLines = pdf.splitTextToSize(`   Indicaciones: ${med.instructions}`, pageWidth - 2 * margin - 15);
        instrLines.forEach(line => {
          pdf.text(line, margin + 5, y);
          y += 5;
        });
      }
      
      y += 3;
    });

    // Instrucciones generales
    if (prescription.instructions) {
      y += 5;
      pdf.setFont(undefined, 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor(...primaryColor);
      pdf.text('INDICACIONES GENERALES', margin, y);
      
      y += 7;
      pdf.setTextColor(...secondaryColor);
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'normal');
      const instLines = pdf.splitTextToSize(prescription.instructions, pageWidth - 2 * margin - 10);
      instLines.forEach(line => {
        pdf.text(line, margin + 5, y);
        y += 6;
      });
    }

    // Duración
    if (prescription.duration) {
      y += 8;
      pdf.setFont(undefined, 'bold');
      pdf.setFontSize(11);
      pdf.text('DURACIÓN DEL TRATAMIENTO', margin, y);
      y += 7;
      pdf.setFont(undefined, 'normal');
      pdf.setFontSize(10);
      pdf.text(prescription.duration, margin + 5, y);
    }

    // QR Code if available - position it higher to avoid footer overlap
    if (prescription.qr_url) {
      const qrSize = 35;
      const qrX = pageWidth - margin - qrSize;
      // Position QR relative to content, not at fixed position
      const qrY = Math.min(y + 15, pageHeight - 70);
      
      try {
        // Load image asynchronously
        const img = await new Promise((resolve, reject) => {
          const image = new Image();
          image.crossOrigin = 'anonymous';
          image.onload = () => resolve(image);
          image.onerror = reject;
          image.src = prescription.qr_url;
        });
        
        // Draw QR background
        pdf.setFillColor(248, 249, 250);
        pdf.roundedRect(qrX - 3, qrY - 3, qrSize + 6, qrSize + 12, 2, 2, 'F');
        
        pdf.addImage(img, 'PNG', qrX, qrY, qrSize, qrSize);
        
        pdf.setFontSize(6);
        pdf.setTextColor(100, 100, 100);
        pdf.text('Escanee para verificar', qrX + qrSize / 2, qrY + qrSize + 5, { align: 'center' });
      } catch (e) {
        console.warn('No se pudo agregar QR al PDF:', e.message);
      }
    }

    // Pie de página - draw a footer line first
    const footerY = pageHeight - 25;
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.3);
    pdf.line(margin, footerY, pageWidth - margin, footerY);
    
    pdf.setTextColor(120, 120, 120);
    pdf.setFontSize(8);
    pdf.text(`Fecha de emisión: ${new Date().toLocaleDateString('es-ES')}`, margin, footerY + 6);
    pdf.text('Receta válida por 30 días a partir de la fecha de emisión', margin, footerY + 11);
    
    // ID on right side of footer, not overlapping with QR
    if (prescription.qr_token) {
      pdf.setFontSize(7);
      pdf.text(`ID: ${prescription.qr_token.substring(0, 12)}`, pageWidth / 2, footerY + 6, { align: 'center' });
    }

    // Descargar
    const patientName = getPatientName(prescription).replaceAll('','_');
    const filename = `Receta_${patientName}_${new Date().getTime()}.pdf`;
    pdf.save(filename);
    showNotification('PDF descargado exitosamente', 'success');
  };

  // Calculate stats
  const getStats = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    return {
      total: prescriptions.length,
      today: prescriptions.filter(p => new Date(p.created_at) >= today).length,
      week: prescriptions.filter(p => new Date(p.created_at) >= weekAgo).length,
      month: prescriptions.filter(p => new Date(p.created_at) >= monthStart).length
    };
  };

  const stats = getStats();
  const pendingRenewalsCount = getPendingRenewalsCount();

  const tabs = [
    { id: FILTER_TYPES.ALL, label: 'Todas', count: stats.total },
    { id: FILTER_TYPES.TODAY, label: 'Hoy', count: stats.today },
    { id: FILTER_TYPES.THIS_WEEK, label: 'Esta Semana', count: stats.week },
    { id: FILTER_TYPES.THIS_MONTH, label: 'Este Mes', count: stats.month },
    { id: FILTER_TYPES.RENEWALS, label: 'Renovaciones', count: pendingRenewalsCount, highlight: pendingRenewalsCount > 0 }
  ];

  return (
    <DoctorLayout>
      <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <DocumentTextIcon className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Recetas</h2>
              <p className="text-xs sm:text-sm text-gray-600">
                Historial de recetas
              </p>
            </div>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm"
          >
            <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Nueva Receta</span>
            <span className="sm:hidden">Nueva</span>
          </button>
        </div>

        {/* Notification */}
        {notification && (
          <div className={`p-4 rounded-lg ${
            notification.type === 'success' 
              ? 'bg-green-100 text-green-800 border border-green-400' 
              : notification.type === 'warning'
              ? 'bg-yellow-100 text-yellow-800 border border-yellow-400'
              : 'bg-red-100 text-red-800 border border-red-400'
          }`}>
            {notification.message}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-2 sm:gap-4">
          <div className="bg-white rounded-lg shadow-md p-3 sm:p-5">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2.5 rounded-full bg-blue-100">
                <DocumentTextIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs text-gray-500 uppercase font-medium truncate">Total</p>
                <p className="text-lg sm:text-xl font-bold text-gray-800">{stats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-3 sm:p-5">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2.5 rounded-full bg-purple-100">
                <ClockIcon className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs text-gray-500 uppercase font-medium truncate">Hoy</p>
                <p className="text-lg sm:text-xl font-bold text-gray-800">{stats.today}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-3 sm:p-5">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2.5 rounded-full bg-green-100">
                <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs text-gray-500 uppercase font-medium truncate">Sem.</p>
                <p className="text-lg sm:text-xl font-bold text-gray-800">{stats.week}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-3 sm:p-5">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2.5 rounded-full bg-yellow-100">
                <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs text-gray-500 uppercase font-medium truncate">Mes</p>
                <p className="text-lg sm:text-xl font-bold text-gray-800">{stats.month}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs and Search */}
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="flex overflow-x-auto gap-1 sm:gap-2 pb-1 scrollbar-hide -mx-2 px-2 sm:mx-0 sm:px-0">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium text-xs sm:text-sm transition flex items-center gap-1 sm:gap-2 whitespace-nowrap flex-shrink-0 ${
                  activeTab === tab.id
                    ? tab.highlight ? 'bg-orange-600 text-white' : 'bg-blue-600 text-white'
                    : tab.highlight 
                      ? 'bg-orange-100 text-orange-700 hover:bg-orange-200 border border-orange-300'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab.id === FILTER_TYPES.RENEWALS && <ArrowPathIcon className="w-3 h-3 sm:w-4 sm:h-4" />}
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.slice(0, 3)}</span>
                {tab.count > 0 && (
                  <span className={`px-1 sm:px-1.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold ${
                    activeTab === tab.id
                      ? 'bg-white/30 text-white'
                      : tab.highlight ? 'bg-orange-600 text-white' : 'bg-gray-300 text-gray-700'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <div className="relative flex-1 sm:max-w-xs">
              <FunnelIcon className="absolute left-3 top-2.5 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              <select
                value={selectedPatient}
                onChange={(e) => setSelectedPatient(e.target.value)}
                className="w-full pl-9 sm:pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white text-sm"
                style={{ fontSize: '16px' }}
              >
                <option value="all">Todos los pacientes</option>
                {uniquePatients.map(patient => (
                  <option key={patient.id} value={patient.id}>
                    {patient.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="relative flex-1 sm:max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-2.5 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 sm:pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                style={{ fontSize: '16px' }}
              />
            </div>
          </div>
        </div>

        {/* Renewals Section - Only shown when renewals tab is active */}
        {activeTab === FILTER_TYPES.RENEWALS ? (
          <div className="space-y-4">
            {/* Renewal Filters */}
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'pending', label: 'Pendientes', color: 'orange' },
                { id: 'approved', label: 'Aprobadas', color: 'green' },
                { id: 'rejected', label: 'Rechazadas', color: 'red' },
                { id: 'all', label: 'Todas', color: 'gray' }
              ].map(filter => (
                <button
                  key={filter.id}
                  onClick={() => setRenewalFilter(filter.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    renewalFilter === filter.id
                      ? filter.color === 'orange' ? 'bg-orange-600 text-white'
                        : filter.color === 'green' ? 'bg-green-600 text-white'
                        : filter.color === 'red' ? 'bg-red-600 text-white'
                        : 'bg-gray-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {/* Renewals List */}
            {loadingRenewals ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
              </div>
            ) : getFilteredRenewals().length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <InboxIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600">No hay solicitudes de renovación</h3>
                <p className="text-gray-400 mt-2">
                  {renewalFilter === 'pending' 
                    ? 'No tienes solicitudes pendientes de revisar'
                    : 'No hay solicitudes con ese estado'}
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Fecha Solicitud</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Paciente</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Receta Original</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Motivo</th>
                        <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Estado</th>
                        <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {getFilteredRenewals().map(renewal => (
                        <tr key={renewal.id} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                            {formatDate(renewal.created_at)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <UserIcon className="w-4 h-4 text-blue-600" />
                              </div>
                              <span className="font-medium text-gray-900">
                                {renewal.patient_name || renewal.original_prescription?.patient_name || 'N/A'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            <div className="max-w-xs">
                              <p className="font-medium">{renewal.original_diagnosis || renewal.prescriptions?.diagnosis || 'Sin diagnóstico'}</p>
                              <p className="text-xs text-gray-400 truncate">
                                {getMedicationsShort(renewal.original_medications || renewal.prescriptions?.medications)}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 max-w-xs">
                            <p className="truncate">{renewal.request_reason || 'Sin motivo especificado'}</p>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              renewal.status === 'pending' ? 'bg-orange-100 text-orange-700'
                              : renewal.status === 'approved' ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                            }`}>
                              {renewal.status === 'pending' ? 'Pendiente' 
                                : renewal.status === 'approved' ? 'Aprobada' 
                                : 'Rechazada'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex justify-center gap-1">
                              {renewal.status === 'pending' ? (
                                <>
                                  <button
                                    onClick={() => openApproveModal(renewal)}
                                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                                    title="Aprobar"
                                  >
                                    <CheckIcon className="w-5 h-5" />
                                  </button>
                                  <button
                                    onClick={() => openRejectModal(renewal)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                    title="Rechazar"
                                  >
                                    <XMarkIcon className="w-5 h-5" />
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => {
                                    const presc = prescriptions.find(p => p.id === renewal.prescription_id);
                                    if (presc) setSelectedPrescription(presc);
                                  }}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                  title="Ver receta"
                                >
                                  <EyeIcon className="w-5 h-5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Prescriptions Table */
          loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredPrescriptions.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <DocumentTextIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600">No hay recetas</h3>
            <p className="text-gray-400 mt-2">
              {searchTerm 
                ? 'No se encontraron recetas con ese criterio' 
                : 'Las recetas se generan durante las consultas médicas'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Fecha</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Paciente</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Diagnóstico</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Medicamentos</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredPrescriptions.map(prescription => (
                    <tr key={prescription.id} className={`hover:bg-gray-50 transition ${hasPendingRenewal(prescription.id) ? 'bg-orange-50' : ''}`}>
                      <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                        {formatDate(prescription.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <UserIcon className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900">
                              {getPatientName(prescription)}
                            </span>
                            {hasPendingRenewal(prescription.id) && (
                              <span className="inline-flex items-center gap-1 text-xs text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full w-fit">
                                <ArrowPathIcon className="w-3 h-3" />
                                Renovación Pendiente
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                        {prescription.diagnosis || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs">
                        <span className="truncate block">
                          {getMedicationsShort(prescription.medications)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-1">
                          <button
                            onClick={() => setSelectedPrescription(prescription)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Ver detalles"
                          >
                            <EyeIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleQRClick(prescription)}
                            className={`p-2 rounded-lg transition ${
                              prescription.qr_url || prescription.has_qr
                                ? 'text-purple-600 hover:bg-purple-50'
                                : 'text-gray-300 cursor-not-allowed'
                            }`}
                            title={prescription.qr_url || prescription.has_qr ? "Ver código QR" : "Sin QR"}
                            disabled={!prescription.qr_url && !prescription.has_qr}
                          >
                            <QrCodeIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => downloadPrescriptionPDF(prescription)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                            title="Descargar PDF"
                          >
                            <ArrowDownTrayIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
        )}

        {/* Approve Renewal Modal */}
        {showApproveModal && selectedRenewal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
              <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <CheckIcon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Aprobar Renovación</h3>
                  </div>
                  <button 
                    onClick={() => { setShowApproveModal(false); setSelectedRenewal(null); }}
                    className="text-white/80 hover:text-white p-1 hover:bg-white/20 rounded-lg transition"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                <p className="text-gray-600">
                  ¿Desea aprobar la renovación de receta para <strong>{selectedRenewal.patient_name || 'el paciente'}</strong>?
                </p>
                
                <div>
                  <span className="block text-sm font-medium text-gray-700 mb-1">
                    Diagnóstico (puede modificar)
                  </span>
                  <input
                    type="text"
                    value={approveData.diagnosis}
                    onChange={(e) => setApproveData({...approveData, diagnosis: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Diagnóstico"
                  />
                </div>
                
                <div>
                  <span className="block text-sm font-medium text-gray-700 mb-1">
                    Duración (puede modificar)
                  </span>
                  <input
                    type="text"
                    value={approveData.duration}
                    onChange={(e) => setApproveData({...approveData, duration: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Ej: 30 días"
                  />
                </div>

                <div>
                  <span className="block text-sm font-medium text-gray-700 mb-1">
                    Respuesta para el paciente (opcional)
                  </span>
                  <textarea
                    value={approveData.response || ''}
                    onChange={(e) => setApproveData({...approveData, response: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                    rows={3}
                    placeholder="Ej: Renovación aprobada. Continúe con el tratamiento según indicaciones..."
                  />
                </div>
              </div>
              
              <div className="flex gap-3 p-4 bg-gray-50 rounded-b-2xl">
                <button
                  onClick={() => { setShowApproveModal(false); setSelectedRenewal(null); }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleApproveRenewal}
                  disabled={processingRenewal}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:bg-gray-400"
                >
                  {processingRenewal ? 'Procesando...' : 'Aprobar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reject Renewal Modal */}
        {showRejectModal && selectedRenewal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
              <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <XMarkIcon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Rechazar Renovación</h3>
                  </div>
                  <button 
                    onClick={() => { setShowRejectModal(false); setSelectedRenewal(null); }}
                    className="text-white/80 hover:text-white p-1 hover:bg-white/20 rounded-lg transition"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                <p className="text-gray-600">
                  ¿Desea rechazar la renovación de receta para <strong>{selectedRenewal.patient_name || 'el paciente'}</strong>?
                </p>
                
                <div>
                  <span className="block text-sm font-medium text-gray-700 mb-1">
                    Motivo del rechazo <span className="text-red-500">*</span>
                  </span>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="Explique el motivo del rechazo..."
                    rows={3}
                  />
                </div>
              </div>
              
              <div className="flex gap-3 p-4 bg-gray-50 rounded-b-2xl">
                <button
                  onClick={() => { setShowRejectModal(false); setSelectedRenewal(null); }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleRejectRenewal}
                  disabled={processingRenewal || !rejectReason.trim()}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:bg-gray-400"
                >
                  {processingRenewal ? 'Procesando...' : 'Rechazar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Prescription Detail Modal - Improved Design */}
        {selectedPrescription && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <BeakerIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Receta Médica</h3>
                      <p className="text-blue-100 text-sm">
                        {formatDate(selectedPrescription.created_at)}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedPrescription(null)}
                    className="text-white/80 hover:text-white p-1 hover:bg-white/20 rounded-lg transition"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Patient & Date */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-xs text-gray-500 uppercase font-medium mb-1">Paciente</p>
                    <p className="font-semibold text-gray-900">{getPatientName(selectedPrescription)}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-xs text-gray-500 uppercase font-medium mb-1">Fecha</p>
                    <p className="font-semibold text-gray-900">{formatFullDate(selectedPrescription.created_at)}</p>
                  </div>
                </div>

                {/* Diagnosis */}
                {selectedPrescription.diagnosis && (
                  <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
                    <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                      <ExclamationCircleIcon className="w-5 h-5" />
                      Diagnóstico
                    </h4>
                    <p className="text-blue-900">{selectedPrescription.diagnosis}</p>
                  </div>
                )}

                {/* Medications - Improved Display */}
                <div className="bg-green-50 border border-green-100 p-4 rounded-xl">
                  <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                    <BeakerIcon className="w-5 h-5" />
                    Medicamentos Prescritos
                  </h4>
                  <div className="space-y-3">
                    {parseMedications(selectedPrescription.medications).map((med, index) => {
                      const medName = med.medication || med.name || String(med);
                      
                      return (
                        <div key={index} className="bg-white p-4 rounded-lg border border-green-200 shadow-sm">
                          <div className="flex items-start justify-between">
                            <p className="font-bold text-gray-900 text-lg">
                              {index + 1}. {medName}
                            </p>
                            {med.dosage && (
                              <span className="bg-green-100 text-green-700 text-sm font-medium px-2 py-1 rounded">
                                {med.dosage}
                              </span>
                            )}
                          </div>
                          
                          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                            {med.frequency && (
                              <div className="bg-blue-50 p-2 rounded">
                                <span className="text-blue-600 font-medium block text-xs uppercase">Frecuencia</span>
                                <span className="text-blue-900">{med.frequency}</span>
                              </div>
                            )}
                            {med.duration && (
                              <div className="bg-purple-50 p-2 rounded">
                                <span className="text-purple-600 font-medium block text-xs uppercase">Duración</span>
                                <span className="text-purple-900">{med.duration}</span>
                              </div>
                            )}
                          </div>
                          
                          {med.instructions && (
                            <div className="mt-3 bg-yellow-50 p-2 rounded border-l-3 border-yellow-400">
                              <span className="text-yellow-700 font-medium text-xs uppercase block">Indicaciones</span>
                              <p className="text-yellow-900 text-sm">{med.instructions}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {/* General Duration - only show if no individual medication durations */}
                {selectedPrescription.duration && !parseMedications(selectedPrescription.medications).some(m => m.duration) && (
                  <div className="bg-purple-50 border border-purple-100 p-4 rounded-xl">
                    <h4 className="font-semibold text-purple-800 mb-2 flex items-center gap-2">
                      <ClockIcon className="w-5 h-5" />
                      Duración del Tratamiento
                    </h4>
                    <p className="text-purple-900 font-medium">{selectedPrescription.duration}</p>
                  </div>
                )}

                {/* Instructions */}
                {selectedPrescription.instructions && (
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl">
                    <h4 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
                      <DocumentTextIcon className="w-5 h-5" />
                      Indicaciones Generales
                    </h4>
                    <div className="bg-white p-3 rounded-lg border border-amber-200">
                      <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{selectedPrescription.instructions}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 p-6 pt-0">
                <button
                  onClick={() => downloadPrescriptionPDF(selectedPrescription)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition font-medium"
                >
                  <ArrowDownTrayIcon className="w-5 h-5" />
                  Descargar PDF
                </button>
                {(selectedPrescription.qr_url || selectedPrescription.has_qr) && (
                  <button
                    onClick={() => {
                      setQRPrescription(selectedPrescription);
                      setShowQRModal(true);
                      setSelectedPrescription(null);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition font-medium"
                  >
                    <QrCodeIcon className="w-5 h-5" />
                    Ver QR
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* QR Modal */}
        {showQRModal && qrPrescription && (
          <PrescriptionQRModal
            prescription={qrPrescription}
            onClose={() => {
              setShowQRModal(false);
              setQRPrescription(null);
            }}
          />
        )}

        {/* Create Prescription Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between rounded-t-2xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <DocumentTextIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">Nueva Receta Médica</h3>
                    <p className="text-sm text-gray-500">Complete los datos de la receta</p>
                  </div>
                </div>
                <button
                  onClick={closeCreateModal}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <XMarkIcon className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6">
                {/* Patient Selection */}
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
                  <label className="block text-sm font-semibold text-blue-800 mb-2">
                    <UserIcon className="w-4 h-4 inline mr-1" />
                    Seleccionar Paciente *
                  </label>
                  {loadingPatients ? (
                    <div className="flex items-center gap-2 text-blue-600">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
                      Cargando pacientes...
                    </div>
                  ) : myPatients.length === 0 ? (
                    <div className="text-amber-600 bg-amber-50 p-3 rounded-lg">
                      <ExclamationCircleIcon className="w-5 h-5 inline mr-1" />
                      No tiene pacientes registrados. Los pacientes aparecen aquí después de tener al menos una cita con usted.
                    </div>
                  ) : (
                    <select
                      value={createFormSelectedPatient}
                      onChange={(e) => setCreateFormSelectedPatient(e.target.value)}
                      className="w-full px-4 py-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                    >
                      <option value="">-- Seleccione un paciente --</option>
                      {myPatients.map((patient) => (
                        <option key={patient.user_id || patient.id} value={patient.user_id || patient.id}>
                          {patient.first_name} {patient.last_name} {patient.email ? `(${patient.email})` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Diagnosis */}
                <div>
                  <span className="block text-sm font-semibold text-gray-700 mb-2">
                    Diagnóstico (opcional)
                  </span>
                  <input
                    type="text"
                    value={generalDiagnosis}
                    onChange={(e) => setGeneralDiagnosis(e.target.value)}
                    placeholder="Ej: Infección respiratoria aguda"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                  />
                </div>

                {/* Medications Section */}
                <div className="bg-green-50 border border-green-100 p-4 rounded-xl">
                  <h4 className="font-semibold text-green-800 mb-4 flex items-center gap-2">
                    <BeakerIcon className="w-5 h-5" />
                    Medicamentos *
                  </h4>
                  
                  {/* Added Medications List */}
                  {newMedications.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {newMedications.map((med, index) => (
                        <div key={index} className="bg-white p-3 rounded-lg border border-green-200 flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-gray-800">
                              {med.medication} - <span className="text-green-600">{med.dosage}</span>
                            </p>
                            <div className="text-sm text-gray-600 mt-1 space-x-3">
                              {med.frequency && <span>📅 {med.frequency}</span>}
                              {med.duration && <span>⏱ {med.duration}</span>}
                            </div>
                            {med.instructions && (
                              <p className="text-sm text-gray-500 mt-1 italic">{med.instructions}</p>
                            )}
                          </div>
                          <button
                            onClick={() => handleRemoveMedication(index)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Medication Form */}
                  <div className="bg-white p-4 rounded-lg border border-green-200">
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <span className="block text-xs font-medium text-gray-600 mb-1">Medicamento *</span>
                        <input
                          type="text"
                          value={newMedication.medication}
                          onChange={(e) => setNewMedication({...newMedication, medication: e.target.value})}
                          placeholder="Ej: Amoxicilina"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-400 focus:border-green-400"
                        />
                      </div>
                      <div>
                        <span className="block text-xs font-medium text-gray-600 mb-1">Dosis *</span>
                        <input
                          type="text"
                          value={newMedication.dosage}
                          onChange={(e) => setNewMedication({...newMedication, dosage: e.target.value})}
                          placeholder="Ej: 500mg"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-400 focus:border-green-400"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <span className="block text-xs font-medium text-gray-600 mb-1">Frecuencia</span>
                        <input
                          type="text"
                          value={newMedication.frequency}
                          onChange={(e) => setNewMedication({...newMedication, frequency: e.target.value})}
                          placeholder="Ej: Cada 8 horas"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-400 focus:border-green-400"
                        />
                      </div>
                      <div>
                        <span className="block text-xs font-medium text-gray-600 mb-1">Duración</span>
                        <input
                          type="text"
                          value={newMedication.duration}
                          onChange={(e) => setNewMedication({...newMedication, duration: e.target.value})}
                          placeholder="Ej: 7 días"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-400 focus:border-green-400"
                        />
                      </div>
                    </div>
                    <div className="mb-3">
                      <span className="block text-xs font-medium text-gray-600 mb-1">Instrucciones específicas</span>
                      <input
                        type="text"
                        value={newMedication.instructions}
                        onChange={(e) => setNewMedication({...newMedication, instructions: e.target.value})}
                        placeholder="Ej: Tomar con alimentos"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-400 focus:border-green-400"
                      />
                    </div>
                    <button
                      onClick={handleAddMedication}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
                    >
                      <PlusIcon className="w-4 h-4" />
                      Agregar Medicamento
                    </button>
                  </div>
                </div>

                {/* General Instructions */}
                <div>
                  <span className="block text-sm font-semibold text-gray-700 mb-2">
                    Indicaciones Generales (opcional)
                  </span>
                  <textarea
                    value={generalInstructions}
                    onChange={(e) => setGeneralInstructions(e.target.value)}
                    placeholder="Indicaciones adicionales para el paciente..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 resize-none"
                  />
                </div>

                {/* General Duration */}
                <div>
                  <span className="block text-sm font-semibold text-gray-700 mb-2">
                    Duración General del Tratamiento (opcional)
                  </span>
                  <input
                    type="text"
                    value={generalDuration}
                    onChange={(e) => setGeneralDuration(e.target.value)}
                    placeholder="Ej: 2 semanas"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-gray-50 border-t p-4 flex gap-3 rounded-b-2xl">
                <button
                  onClick={closeCreateModal}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreatePrescription}
                  disabled={creatingPrescription || !createFormSelectedPatient || newMedications.length === 0}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {creatingPrescription ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      Creando...
                    </>
                  ) : (
                    <>
                      <CheckIcon className="w-5 h-5" />
                      Crear Receta
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