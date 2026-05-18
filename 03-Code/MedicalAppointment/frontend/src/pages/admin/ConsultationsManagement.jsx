import React, { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { crudApi } from '../../services/httpClient';
import jsPDF from 'jspdf';
import {
  ClipboardDocumentListIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
  CalendarIcon,
  UserIcon,
  HeartIcon,
} from '@heroicons/react/24/outline';

export default function ConsultationsManagement() {
  const [consultations, setConsultations] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [doctorFilter, setDoctorFilter] = useState('all');
  const [specialtyFilter, setSpecialtyFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  // Modal state
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [consultationDetails, setConsultationDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load completed appointments with consultation notes
      const [appointmentsRes, doctorsRes, specialtiesRes] = await Promise.all([
        crudApi.get('/appointments', { params: { status: 'completed' } }),
        crudApi.get('/doctors'),
        crudApi.get('/specialties'),
      ]);
      
      setConsultations(appointmentsRes.data.data || appointmentsRes.data || []);
      setDoctors(doctorsRes.data.data || doctorsRes.data || []);
      setSpecialties(specialtiesRes.data.data || specialtiesRes.data || []);
    } catch (error) {
      console.error('Error loading consultations:', error);
    } finally {
      setLoading(false);
    }
  };

  const openDetailModal = async (consultation) => {
    setSelectedConsultation(consultation);
    setShowDetailModal(true);
    setLoadingDetails(true);

    try {
      // Load consultation note details - use correct API paths
      const [noteRes, prescriptionsRes, labReportsRes] = await Promise.all([
        crudApi.get(`/consultation-notes/appointment/${consultation.id}`).catch(() => ({ data: null })),
        crudApi.get(`/prescriptions/appointment/${consultation.id}`).catch(() => ({ data: [] })),
        crudApi.get(`/medical-records/lab-reports/appointment/${consultation.id}`).catch(() => ({ data: [] })),
      ]);

      setConsultationDetails({
        note: noteRes.data?.data || noteRes.data,
        prescriptions: prescriptionsRes.data?.data || prescriptionsRes.data || [],
        labReports: labReportsRes.data?.data || labReportsRes.data || [],
      });
    } catch (error) {
      console.error('Error loading consultation details:', error);
      setConsultationDetails(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const hour = Number.parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Helper to parse medications from prescription
  const parseMedications = (prescription) => {
    if (!prescription.medications) return [];
    try {
      // medications can be a JSON string or already an array
      const meds = typeof prescription.medications === 'string' 
        ? JSON.parse(prescription.medications) 
        : prescription.medications;
      return Array.isArray(meds) ? meds : [meds];
    } catch (e) {
      // If it's a plain string, treat it as a single medication name
      return [{ medication: prescription.medications }];
    }
  };

  // Get all medications from all prescriptions as flat array
  const getAllMedications = (prescriptions) => {
    if (!prescriptions || prescriptions.length === 0) return [];
    return prescriptions.flatMap(rx => {
      const meds = parseMedications(rx);
      return meds.map(med => ({
        ...med,
        prescriptionInstructions: rx.instructions,
        prescriptionDuration: rx.duration
      }));
    });
  };

  const exportConsultationPDF = () => {
    if (!selectedConsultation) return;

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    let y = 20;

    const patientName = `${selectedConsultation.patient?.first_name || ''} ${selectedConsultation.patient?.last_name || ''}`.trim() || 'N/A';
    const doctorName = `Dr. ${selectedConsultation.doctor?.first_name || ''} ${selectedConsultation.doctor?.last_name || ''}`.trim();
    const specialty = selectedConsultation.specialty?.name || 'Consulta General';

    // Colors
    const primaryColor = [59, 130, 246];
    const textDark = [31, 41, 55];
    const textLight = [107, 114, 128];

    // Header
    pdf.setFillColor(...primaryColor);
    pdf.rect(0, 0, pageWidth, 40, 'F');

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(22);
    pdf.setFont(undefined, 'bold');
    pdf.text('Resumen de Consulta', margin, 18);
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    pdf.text('Clínica Médica - Sistema de Gestión', margin, 26);
    pdf.text(`Fecha: ${formatDate(selectedConsultation.appointment_date || selectedConsultation.scheduled_start)}`, margin, 32);

    // Patient and Doctor info
    y = 50;
    pdf.setFillColor(248, 250, 252);
    pdf.rect(margin, y, (pageWidth - margin * 2 - 5) / 2, 30, 'F');
    pdf.setTextColor(...textDark);
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'bold');
    pdf.text('PACIENTE', margin + 5, y + 8);
    pdf.setFont(undefined, 'normal');
    pdf.setFontSize(9);
    pdf.text(patientName, margin + 5, y + 16);
    pdf.setTextColor(...textLight);
    pdf.text(selectedConsultation.patient?.email || '', margin + 5, y + 23);

    const rightColX = margin + (pageWidth - margin * 2 - 5) / 2 + 5;
    pdf.setFillColor(248, 250, 252);
    pdf.rect(rightColX, y, (pageWidth - margin * 2 - 5) / 2, 30, 'F');
    pdf.setTextColor(...textDark);
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'bold');
    pdf.text('MÉDICO', rightColX + 5, y + 8);
    pdf.setFont(undefined, 'normal');
    pdf.setFontSize(9);
    pdf.text(doctorName, rightColX + 5, y + 16);
    pdf.setTextColor(...textLight);
    pdf.text(specialty, rightColX + 5, y + 23);

    y = 90;

    // Consultation notes
    if (consultationDetails?.note) {
      pdf.setTextColor(...textDark);
      pdf.setFontSize(11);
      pdf.setFont(undefined, 'bold');
      pdf.text('NOTAS DE CONSULTA', margin, y);
      y += 8;

      const addSection = (title, content) => {
        if (!content) return;
        pdf.setFontSize(9);
        pdf.setFont(undefined, 'bold');
        pdf.setTextColor(...primaryColor);
        pdf.text(title, margin, y);
        y += 5;
        pdf.setFont(undefined, 'normal');
        pdf.setTextColor(...textDark);
        const lines = pdf.splitTextToSize(content, pageWidth - margin * 2);
        pdf.text(lines, margin, y);
        y += lines.length * 4 + 5;
      };

      addSection('Subjetivo:', consultationDetails.note.subjective);
      addSection('Objetivo:', consultationDetails.note.objective);
      addSection('Diagnóstico:', consultationDetails.note.diagnosis);
      addSection('Plan de Tratamiento:', consultationDetails.note.treatment_plan);

      if (consultationDetails.note.follow_up_required) {
        addSection('Seguimiento:', `Requerido - ${formatDate(consultationDetails.note.follow_up_date)}`);
      }
    }

    // Prescriptions
    const allMeds = getAllMedications(consultationDetails?.prescriptions);
    if (allMeds.length > 0) {
      y += 5;
      pdf.setTextColor(...textDark);
      pdf.setFontSize(11);
      pdf.setFont(undefined, 'bold');
      pdf.text('PRESCRIPCIONES', margin, y);
      y += 10;

      // Table header
      pdf.setFillColor(248, 250, 252);
      pdf.rect(margin, y - 4, pageWidth - margin * 2, 8, 'F');
      pdf.setFontSize(8);
      pdf.setFont(undefined, 'bold');
      pdf.text('Medicamento', margin + 2, y);
      pdf.text('Dosis', margin + 50, y);
      pdf.text('Frecuencia', margin + 80, y);
      pdf.text('Duración', margin + 115, y);
      y += 6;

      pdf.setFont(undefined, 'normal');
      allMeds.forEach((med) => {
        pdf.setFontSize(8);
        pdf.text(med.medication || '-', margin + 2, y);
        pdf.text(med.dosage || '-', margin + 50, y);
        pdf.text(med.frequency || '-', margin + 80, y);
        pdf.text(med.duration || med.prescriptionDuration || '-', margin + 115, y);
        y += 5;
        if (med.instructions) {
          pdf.setTextColor(...textLight);
          pdf.setFontSize(7);
          const instrLines = pdf.splitTextToSize(`Instrucciones: ${med.instructions}`, pageWidth - margin * 2 - 10);
          pdf.text(instrLines, margin + 5, y);
          y += instrLines.length * 3 + 2;
          pdf.setTextColor(...textDark);
        }
      });
    }

    // Lab reports
    if (consultationDetails?.labReports?.length > 0) {
      y += 5;
      pdf.setTextColor(...textDark);
      pdf.setFontSize(11);
      pdf.setFont(undefined, 'bold');
      pdf.text('ÓRDENES DE LABORATORIO', margin, y);
      y += 8;

      consultationDetails.labReports.forEach((lab, idx) => {
        pdf.setFontSize(9);
        pdf.setFont(undefined, 'normal');
        pdf.text(`${idx + 1}. ${lab.test_name} - ${lab.status === 'completed' ? 'Completado' : 'Pendiente'}`, margin, y);
        y += 5;
      });
    }

    // Footer
    pdf.setTextColor(...textLight);
    pdf.setFontSize(8);
    pdf.text('Este documento es un resumen de la consulta médica', pageWidth / 2, 280, { align: 'center' });
    pdf.text('Clínica Médica - Documento generado automáticamente', pageWidth / 2, 285, { align: 'center' });

    // Open PDF
    const pdfBlob = pdf.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, '_blank');
  };

  const filteredConsultations = consultations.filter(consultation => {
    const search = searchTerm.toLowerCase();
    const patientName = `${consultation.patient?.first_name || ''} ${consultation.patient?.last_name || ''}`.toLowerCase();
    const doctorName = `${consultation.doctor?.first_name || ''} ${consultation.doctor?.last_name || ''}`.toLowerCase();
    
    const matchesSearch = patientName.includes(search) || doctorName.includes(search);
    const matchesDoctor = doctorFilter === 'all' || consultation.doctor_id?.toString() === doctorFilter;
    const matchesSpecialty = specialtyFilter === 'all' || consultation.specialty_id?.toString() === specialtyFilter;
    
    let matchesDate = true;
    if (dateFrom) {
      matchesDate = matchesDate && new Date(consultation.appointment_date) >= new Date(dateFrom);
    }
    if (dateTo) {
      matchesDate = matchesDate && new Date(consultation.appointment_date) <= new Date(dateTo);
    }
    
    return matchesSearch && matchesDoctor && matchesSpecialty && matchesDate;
  });

  const stats = {
    total: consultations.length,
    thisMonth: consultations.filter(c => {
      const date = new Date(c.appointment_date);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length,
    withFollowUp: consultations.filter(c => c.consultation_note?.follow_up_required).length,
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Consultas Médicas</h2>
            <p className="text-sm sm:text-base text-gray-600">Vista de consultas completadas (solo lectura)</p>
          </div>
          <button
            onClick={loadData}
            className="flex items-center justify-center gap-2 px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <ArrowPathIcon className="w-5 h-5" />
            <span className="hidden sm:inline">Actualizar</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 sm:p-3 bg-blue-100 rounded-full">
                <ClipboardDocumentListIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-500 truncate">Total Consultas</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-800">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 sm:p-3 bg-green-100 rounded-full">
                <CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-500 truncate">Este Mes</p>
                <p className="text-lg sm:text-2xl font-bold text-green-600">{stats.thisMonth}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 sm:p-3 bg-yellow-100 rounded-full">
                <HeartIcon className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-500 truncate">Con Seguimiento</p>
                <p className="text-lg sm:text-2xl font-bold text-yellow-600">{stats.withFollowUp}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="flex items-center gap-2">
              <FunnelIcon className="w-5 h-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Filtros:</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="relative">
                <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar paciente o doctor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
                  style={{ fontSize: '16px' }}
                />
              </div>
              
              <select
                value={doctorFilter}
                onChange={(e) => setDoctorFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
                style={{ fontSize: '16px' }}
              >
                <option value="all">Todos los doctores</option>
                {doctors.map(doc => (
                  <option key={doc.id} value={doc.id}>
                    Dr. {doc.first_name} {doc.last_name}
                  </option>
                ))}
              </select>
              
              <select
                value={specialtyFilter}
                onChange={(e) => setSpecialtyFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
                style={{ fontSize: '16px' }}
              >
                <option value="all">Todas las especialidades</option>
                {specialties.map(sp => (
                  <option key={sp.id} value={sp.id}>{sp.name}</option>
                ))}
              </select>
              
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-2 sm:px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
                  style={{ fontSize: '16px' }}
                />
                <span className="text-gray-400 hidden sm:inline">a</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-2 sm:px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
                  style={{ fontSize: '16px' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Consultations Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
            </div>
          ) : filteredConsultations.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <ClipboardDocumentListIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No se encontraron consultas</p>
            </div>
          ) : (
            <>
              {/* Mobile Cards */}
              <div className="lg:hidden divide-y divide-gray-200">
                {filteredConsultations.map((consultation) => (
                  <div key={consultation.id} className="p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-medium text-gray-900">
                          {consultation.patient?.first_name} {consultation.patient?.last_name}
                        </p>
                        <p className="text-sm text-gray-500">{formatDate(consultation.appointment_date)} - {formatTime(consultation.start_time)}</p>
                      </div>
                      <button
                        onClick={() => openDetailModal(consultation)}
                        className="p-2 text-gray-400 hover:text-primary-600 rounded-lg hover:bg-gray-100"
                      >
                        <EyeIcon className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-gray-500">Doctor</p>
                        <p className="text-gray-700 truncate">Dr. {consultation.doctor?.first_name} {consultation.doctor?.last_name}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Especialidad</p>
                        <span className="px-2 py-0.5 bg-primary-50 text-primary-700 rounded-full text-xs">
                          {consultation.specialty?.name || '-'}
                        </span>
                      </div>
                    </div>
                    {consultation.consultation_note?.diagnosis && (
                      <div className="mt-2 text-sm">
                        <p className="text-gray-500">Diagnóstico</p>
                        <p className="text-gray-700 truncate">{consultation.consultation_note.diagnosis}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paciente</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Doctor</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Especialidad</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Diagnóstico</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredConsultations.map((consultation) => (
                    <tr key={consultation.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{formatDate(consultation.appointment_date)}</div>
                        <div className="text-sm text-gray-500">{formatTime(consultation.start_time)}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <UserIcon className="w-4 h-4 text-gray-500" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {consultation.patient?.first_name} {consultation.patient?.last_name}
                            </div>
                            <div className="text-sm text-gray-500">{consultation.patient?.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        Dr. {consultation.doctor?.first_name} {consultation.doctor?.last_name}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-primary-50 text-primary-700 rounded-full text-xs">
                          {consultation.specialty?.name || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">
                        {consultation.consultation_note?.diagnosis || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => openDetailModal(consultation)}
                          className="p-2 text-gray-400 hover:text-primary-600 rounded-lg hover:bg-gray-100"
                          title="Ver detalle"
                        >
                          <EyeIcon className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </>
          )}
        </div>

        {/* Detail Modal */}
        {showDetailModal && selectedConsultation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="p-4 sm:p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800">Detalle de Consulta</h3>
                  <p className="text-xs sm:text-sm text-gray-500">
                    {formatDate(selectedConsultation.appointment_date)} - {formatTime(selectedConsultation.start_time)}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedConsultation(null);
                    setConsultationDetails(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                {loadingDetails ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
                    <p className="mt-2 text-gray-500">Cargando detalles...</p>
                  </div>
                ) : (
                  <>
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-6">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                          <UserIcon className="w-5 h-5" />
                          Paciente
                        </h4>
                        <p className="text-gray-700">
                          {selectedConsultation.patient?.first_name} {selectedConsultation.patient?.last_name}
                        </p>
                        <p className="text-sm text-gray-500">{selectedConsultation.patient?.email}</p>
                        <p className="text-sm text-gray-500">{selectedConsultation.patient?.phone}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                          <UserIcon className="w-5 h-5" />
                          Doctor
                        </h4>
                        <p className="text-gray-700">
                          Dr. {selectedConsultation.doctor?.first_name} {selectedConsultation.doctor?.last_name}
                        </p>
                        <p className="text-sm text-gray-500">{selectedConsultation.specialty?.name}</p>
                      </div>
                    </div>

                    {/* Vital Signs */}
                    {consultationDetails?.note?.vital_signs && (
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-3">Signos Vitales</h4>
                        <div className="grid grid-cols-4 gap-4">
                          {Object.entries(consultationDetails.note.vital_signs).map(([key, value]) => (
                            <div key={key} className="bg-blue-50 p-3 rounded-lg text-center">
                              <p className="text-xs text-gray-500 capitalize">{key.replace('_', ' ')}</p>
                              <p className="font-bold text-primary-700">{value}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* SOAP Notes */}
                    {consultationDetails?.note && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 border border-gray-200 rounded-lg">
                          <h5 className="font-medium text-gray-700 mb-2">Subjetivo</h5>
                          <p className="text-sm text-gray-600">{consultationDetails.note.subjective || '-'}</p>
                        </div>
                        <div className="p-4 border border-gray-200 rounded-lg">
                          <h5 className="font-medium text-gray-700 mb-2">Objetivo</h5>
                          <p className="text-sm text-gray-600">{consultationDetails.note.objective || '-'}</p>
                        </div>
                        <div className="p-4 border border-gray-200 rounded-lg">
                          <h5 className="font-medium text-gray-700 mb-2">Evaluación/Diagnóstico</h5>
                          <p className="text-sm text-gray-600">{consultationDetails.note.diagnosis || '-'}</p>
                        </div>
                        <div className="p-4 border border-gray-200 rounded-lg">
                          <h5 className="font-medium text-gray-700 mb-2">Plan de Tratamiento</h5>
                          <p className="text-sm text-gray-600">{consultationDetails.note.treatment_plan || '-'}</p>
                        </div>
                      </div>
                    )}

                    {/* Follow Up */}
                    {consultationDetails?.note?.follow_up_required && (
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <h5 className="font-medium text-yellow-800 mb-2">Seguimiento Requerido</h5>
                        <p className="text-sm text-yellow-700">
                          Fecha sugerida: {formatDate(consultationDetails.note.follow_up_date)}
                        </p>
                        {consultationDetails.note.follow_up_notes && (
                          <p className="text-sm text-yellow-700 mt-1">
                            {consultationDetails.note.follow_up_notes}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Prescriptions */}
                    {consultationDetails?.prescriptions?.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-3">Prescripciones</h4>
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-3 py-2 text-left text-xs text-gray-500">Medicamento</th>
                                <th className="px-3 py-2 text-left text-xs text-gray-500">Dosis</th>
                                <th className="px-3 py-2 text-left text-xs text-gray-500">Frecuencia</th>
                                <th className="px-3 py-2 text-left text-xs text-gray-500">Duración</th>
                                <th className="px-3 py-2 text-left text-xs text-gray-500">Instrucciones</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {getAllMedications(consultationDetails.prescriptions).map((med, idx) => (
                                <tr key={idx}>
                                  <td className="px-3 py-2 font-medium">{med.medication || '-'}</td>
                                  <td className="px-3 py-2">{med.dosage || '-'}</td>
                                  <td className="px-3 py-2">{med.frequency || '-'}</td>
                                  <td className="px-3 py-2">{med.duration || '-'}</td>
                                  <td className="px-3 py-2 text-gray-500 text-xs max-w-xs truncate">{med.instructions || '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Lab Reports */}
                    {consultationDetails?.labReports?.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-3">Órdenes de Laboratorio</h4>
                        <div className="space-y-2">
                          {consultationDetails.labReports.map((lab, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div>
                                <p className="font-medium text-gray-800">{lab.test_name}</p>
                                <p className="text-sm text-gray-500">{lab.doctor_notes}</p>
                              </div>
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                lab.status === 'completed' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {lab.status === 'completed' ? 'Completado' : 'Pendiente'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
              
              <div className="p-6 border-t border-gray-200 flex justify-end gap-3 sticky bottom-0 bg-white">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedConsultation(null);
                    setConsultationDetails(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cerrar
                </button>
                <button
                  onClick={exportConsultationPDF}
                  className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 flex items-center gap-2"
                >
                  <DocumentArrowDownIcon className="w-5 h-5" />
                  Exportar PDF
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
