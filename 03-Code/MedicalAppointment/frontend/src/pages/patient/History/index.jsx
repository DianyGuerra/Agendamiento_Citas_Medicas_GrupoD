import PatientLayout from '../../../layouts/PatientLayout';
import { useAuth } from '../../../context/AuthContext';
import jsPDF from 'jspdf';
import {
  DocumentTextIcon,
  CalendarIcon,
  ArrowDownTrayIcon,
  HeartIcon,
  BeakerIcon,
  ClipboardDocumentListIcon,
  ExclamationTriangleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { useHistory, parseNotesContent, formatDateTime } from './hooks';
import { InfoCard, ConsultationCard, HistoryFilters } from './components';

export default function PatientHistory() {
  const { user } = useAuth();
  const {
    loading,
    medicalRecord,
    filteredHistory,
    search,
    setSearch,
    year,
    setYear,
    specialty,
    setSpecialty,
    years,
    specialties,
    error,
  } = useHistory();

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return 'Fecha no válida';
    return d.toLocaleDateString('es-EC', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const generateConsultationPDF = (note) => {
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    let y = 20;

    const primaryColor = [41, 128, 185];
    const secondaryColor = [52, 73, 94];
    const accentColor = [46, 204, 113];

    // Header
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

    y = 55;
    pdf.setTextColor(...secondaryColor);
    pdf.setFontSize(18);
    pdf.setFont(undefined, 'bold');
    pdf.text('INFORME DE CONSULTA MÉDICA', margin, y);
    y += 3;
    pdf.setDrawColor(...accentColor);
    pdf.setLineWidth(1);
    pdf.line(margin, y, pageWidth - margin, y);

    // Patient info
    y += 12;
    pdf.setFillColor(245, 245, 245);
    pdf.rect(margin, y, pageWidth - 2 * margin, 25, 'F');
    y += 8;
    pdf.setTextColor(...secondaryColor);
    pdf.setFontSize(11);
    pdf.setFont(undefined, 'bold');
    pdf.text('DATOS DEL PACIENTE', margin + 5, y);
    y += 7;
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    pdf.text(`Paciente: ${user.first_name} ${user.last_name}`, margin + 5, y);
    y += 6;
    pdf.text(`Fecha de Consulta: ${formatDateTime(note.scheduled_start)}`, margin + 5, y);

    // Doctor info
    y += 12;
    pdf.setFillColor(245, 245, 245);
    pdf.rect(margin, y, pageWidth - 2 * margin, 25, 'F');
    y += 8;
    pdf.setFont(undefined, 'bold');
    pdf.text('DATOS DEL MÉDICO', margin + 5, y);
    y += 7;
    pdf.setFont(undefined, 'normal');
    pdf.text(`Médico Tratante: Dr. ${note.doctor_first_name} ${note.doctor_last_name}`, margin + 5, y);
    y += 6;
    pdf.text(`Especialidad: ${note.specialty_name || 'Medicina General'}`, margin + 5, y);

    y += 15;

    const addSection = (title, content) => {
      if (!content) return;
      pdf.setFont(undefined, 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor(...primaryColor);
      pdf.text(title, margin, y);
      y += 7;
      pdf.setTextColor(...secondaryColor);
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'normal');
      const lines = pdf.splitTextToSize(content, pageWidth - 2 * margin - 10);
      lines.forEach((line) => {
        if (y > 270) { pdf.addPage(); y = 20; }
        pdf.text(line, margin + 5, y);
        y += 6;
      });
      y += 5;
    };

    if (note.diagnosis) addSection('DIAGNÓSTICO', note.diagnosis);
    if (note.notes) addSection('OBSERVACIONES CLÍNICAS', parseNotesContent(note.notes));
    if (note.treatment_plan) addSection('PLAN DE TRATAMIENTO', note.treatment_plan);
    if (note.prescriptions_given) addSection('MEDICAMENTOS PRESCRITOS', note.prescriptions_given);

    const pdfBlob = pdf.output('blob');
    window.open(URL.createObjectURL(pdfBlob), '_blank');
  };

  const downloadFullHistory = () => {
    if (filteredHistory.length === 0) return;

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    const primaryColor = [41, 128, 185];
    const secondaryColor = [52, 73, 94];

    // Cover page
    pdf.setFillColor(...primaryColor);
    pdf.rect(0, 0, pageWidth, pdf.internal.pageSize.getHeight(), 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(28);
    pdf.setFont(undefined, 'bold');
    pdf.text('HISTORIAL MÉDICO', pageWidth / 2, 100, { align: 'center' });
    pdf.setFontSize(16);
    pdf.setFont(undefined, 'normal');
    pdf.text(`${user.first_name} ${user.last_name}`, pageWidth / 2, 120, { align: 'center' });
    pdf.setFontSize(12);
    pdf.text(`Generado el: ${formatDate(new Date().toISOString())}`, pageWidth / 2, 135, { align: 'center' });

    filteredHistory.forEach((note, index) => {
      pdf.addPage();
      let y = 20;
      pdf.setTextColor(...secondaryColor);
      pdf.setFontSize(16);
      pdf.setFont(undefined, 'bold');
      pdf.text(`CONSULTA #${index + 1}`, margin, y);
      y += 10;
      pdf.setFontSize(10);
      pdf.text(`Fecha: ${formatDateTime(note.scheduled_start)}`, margin, y);
      y += 6;
      pdf.text(`Doctor: Dr. ${note.doctor_first_name} ${note.doctor_last_name}`, margin, y);
      y += 6;
      pdf.text(`Especialidad: ${note.specialty_name || 'N/A'}`, margin, y);
      y += 10;
      pdf.setFont(undefined, 'normal');
      if (note.diagnosis) {
        pdf.setFont(undefined, 'bold');
        pdf.text('Diagnóstico:', margin, y);
        y += 6;
        pdf.setFont(undefined, 'normal');
        const lines = pdf.splitTextToSize(note.diagnosis, pageWidth - 2 * margin);
        lines.forEach((line) => { pdf.text(line, margin, y); y += 5; });
        y += 5;
      }
    });

    pdf.save(`historial-medico-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  if (loading) {
    return (
      <PatientLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
        </div>
      </PatientLayout>
    );
  }

  return (
    <PatientLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-lg p-6 text-white">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <ClipboardDocumentListIcon className="h-8 w-8" />
                Historial Médico
              </h1>
              <p className="mt-2 opacity-90">
                Consulta el historial completo de tus consultas y registros médicos
              </p>
            </div>
            <button
              onClick={downloadFullHistory}
              disabled={filteredHistory.length === 0}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-blue-600 hover:bg-blue-50 font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              type="button"
            >
              <ArrowDownTrayIcon className="h-5 w-5" />
              Descargar Historial Completo
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <HistoryFilters
          search={search}
          setSearch={setSearch}
          year={year}
          setYear={setYear}
          specialty={specialty}
          setSpecialty={setSpecialty}
          years={years}
          specialties={specialties}
          totalResults={filteredHistory.length}
        />

        {/* Medical Record */}
        {medicalRecord && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <DocumentTextIcon className="h-7 w-7" />
                Registro Médico General
              </h2>
              {medicalRecord.updated_at && (
                <p className="text-blue-100 mt-1 text-sm flex items-center gap-2">
                  <ClockIcon className="h-4 w-4" />
                  Última actualización: {formatDateTime(medicalRecord.updated_at)}
                </p>
              )}
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <InfoCard
                icon={<ExclamationTriangleIcon className="h-6 w-6" />}
                title="Alergias"
                content={medicalRecord.allergies}
                colorClass="bg-red-50 border-red-200"
                iconColorClass="text-red-600"
              />
              <InfoCard
                icon={<HeartIcon className="h-6 w-6" />}
                title="Condiciones Médicas"
                content={medicalRecord.medical_conditions}
                colorClass="bg-purple-50 border-purple-200"
                iconColorClass="text-purple-600"
              />
              <InfoCard
                icon={<BeakerIcon className="h-6 w-6" />}
                title="Medicamentos Actuales"
                content={medicalRecord.current_medications}
                colorClass="bg-green-50 border-green-200"
                iconColorClass="text-green-600"
              />
              <InfoCard
                icon={<DocumentTextIcon className="h-6 w-6" />}
                title="Diagnósticos"
                content={medicalRecord.diagnoses}
                colorClass="bg-blue-50 border-blue-200"
                iconColorClass="text-blue-600"
              />
              <InfoCard
                icon={<ClipboardDocumentListIcon className="h-6 w-6" />}
                title="Tratamientos"
                content={medicalRecord.treatments}
                colorClass="bg-yellow-50 border-yellow-200"
                iconColorClass="text-yellow-600"
              />
              <InfoCard
                icon={<ClockIcon className="h-6 w-6" />}
                title="Historial Médico"
                content={medicalRecord.medical_history}
                colorClass="bg-gray-50 border-gray-200"
                iconColorClass="text-gray-600"
                fullWidth
              />
            </div>
          </div>
        )}

        {/* Consultation Timeline */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <CalendarIcon className="h-7 w-7 text-blue-600" />
            Historial de Consultas
          </h2>

          {filteredHistory.length === 0 ? (
            <div className="text-center py-12">
              <DocumentTextIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay registros médicos</h3>
              <p className="text-gray-600">
                {search || year || specialty
                  ? 'No se encontraron consultas con los filtros aplicados.'
                  : 'Aún no tienes consultas médicas registradas en tu historial.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredHistory.map((note, index) => (
                <ConsultationCard
                  key={note.id}
                  note={note}
                  index={index}
                  formatDate={formatDateTime}
                  onViewPDF={() => generateConsultationPDF(note)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </PatientLayout>
  );
}
