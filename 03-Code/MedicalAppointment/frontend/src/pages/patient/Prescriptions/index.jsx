import PatientLayout from '../../../layouts/PatientLayout';
import { useAuth } from '../../../context/AuthContext';
import jsPDF from 'jspdf';
import {
  CheckCircleIcon,
  XCircleIcon,
  BeakerIcon,
  ClockIcon,
  ExclamationCircleIcon,
  XMarkIcon,
  InboxIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { usePrescriptions, parseMedications, getExpiryDate, getDisplayDuration, processLineBreaks } from './hooks';
import { PrescriptionCard, RenewalCard, RenewalModal } from './components';

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('es-EC', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export default function PatientPrescriptions() {
  const { user } = useAuth();
  const {
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
  } = usePrescriptions();

  // PDF Generation
  const downloadPrescription = async (prescription) => {
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
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

    // Title
    y = 55;
    pdf.setTextColor(...secondaryColor);
    pdf.setFontSize(18);
    pdf.setFont(undefined, 'bold');
    pdf.text('RECETA MÉDICA', margin, y);
    y += 3;
    pdf.setDrawColor(...accentColor);
    pdf.setLineWidth(1);
    pdf.line(margin, y, pageWidth - margin, y);

    // Patient Info
    y += 12;
    pdf.setFillColor(245, 245, 245);
    pdf.rect(margin, y, pageWidth - 2 * margin, 25, 'F');
    y += 8;
    pdf.setTextColor(...secondaryColor);
    pdf.setFontSize(11);
    pdf.setFont(undefined, 'bold');
    pdf.text('PACIENTE', margin + 5, y);
    y += 7;
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    pdf.text(`Nombre: ${user.first_name} ${user.last_name}`, margin + 5, y);
    y += 6;
    pdf.text(`Fecha de emisión: ${formatDate(prescription.created_at)}`, margin + 5, y);

    // Doctor Info
    y += 12;
    pdf.setFillColor(245, 245, 245);
    pdf.rect(margin, y, pageWidth - 2 * margin, 25, 'F');
    y += 8;
    pdf.setFont(undefined, 'bold');
    pdf.text('MÉDICO TRATANTE', margin + 5, y);
    y += 7;
    pdf.setFont(undefined, 'normal');
    pdf.text(`Dr. ${prescription.doctor_first_name} ${prescription.doctor_last_name}`, margin + 5, y);
    y += 6;
    pdf.text(`Especialidad: ${prescription.specialty_name || 'Medicina General'}`, margin + 5, y);

    // Diagnosis
    if (prescription.diagnosis) {
      y += 12;
      pdf.setFont(undefined, 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor(...primaryColor);
      pdf.text('DIAGNÓSTICO', margin, y);
      y += 7;
      pdf.setTextColor(...secondaryColor);
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'normal');
      pdf.text(prescription.diagnosis, margin + 5, y);
    }

    // Medications
    y += 12;
    pdf.setFont(undefined, 'bold');
    pdf.setFontSize(12);
    pdf.setTextColor(...primaryColor);
    pdf.text('MEDICAMENTOS', margin, y);
    y += 8;
    pdf.setTextColor(...secondaryColor);
    pdf.setFontSize(10);

    const medications = parseMedications(prescription.medications);
    medications.forEach((med, index) => {
      const medName = med.medication || med.name || String(med);
      pdf.setFont(undefined, 'bold');
      pdf.text(`${index + 1}. ${medName}`, margin + 5, y);
      y += 6;
      pdf.setFont(undefined, 'normal');
      if (med.dosage) { pdf.text(`   Dosis: ${med.dosage}`, margin + 5, y); y += 5; }
      if (med.frequency) { pdf.text(`   Frecuencia: ${med.frequency}`, margin + 5, y); y += 5; }
      if (med.duration) { pdf.text(`   Duración: ${med.duration}`, margin + 5, y); y += 5; }
      if (med.instructions) { pdf.text(`   Indicaciones: ${med.instructions}`, margin + 5, y); y += 5; }
      y += 3;
    });

    // Instructions
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
      const instrLines = pdf.splitTextToSize(prescription.instructions, pageWidth - 2 * margin - 10);
      instrLines.forEach(line => { pdf.text(line, margin + 5, y); y += 6; });
    }

    // Footer
    const footerY = pageHeight - 25;
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.3);
    pdf.line(margin, footerY, pageWidth - margin, footerY);
    pdf.setTextColor(120, 120, 120);
    pdf.setFontSize(8);
    pdf.text(`Fecha de emisión: ${formatDate(prescription.created_at)}`, margin, footerY + 6);
    pdf.text('Receta válida por 30 días a partir de la fecha de emisión', margin, footerY + 11);

    const pdfBlob = pdf.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, '_blank');
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
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in max-w-md">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg ${
            notification.type === 'success' ? 'bg-green-500' :
            notification.type === 'error' ? 'bg-red-500' :
            notification.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
          } text-white`}>
            {notification.type === 'success' && <CheckCircleIcon className="h-5 w-5 flex-shrink-0" />}
            {notification.type === 'error' && <XCircleIcon className="h-5 w-5 flex-shrink-0" />}
            {notification.type === 'warning' && <ExclamationCircleIcon className="h-5 w-5 flex-shrink-0" />}
            <div className="flex-1">
              <span className="font-medium">{notification.message}</span>
              {notification.action && (
                <button
                  onClick={() => { notification.action.onClick(); setNotification(null); }}
                  className="ml-2 underline hover:no-underline font-semibold"
                >
                  {notification.action.label}
                </button>
              )}
            </div>
            <button onClick={() => setNotification(null)} className="ml-2 hover:bg-white/20 rounded p-1 flex-shrink-0">
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-2xl shadow-lg p-6 text-white">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <BeakerIcon className="h-8 w-8" />
                Mis Recetas Médicas
              </h1>
              <p className="mt-2 opacity-90">
                Consulta tus recetas activas y el historial completo de prescripciones
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-3">
                <p className="text-xs opacity-75">Total de recetas</p>
                <p className="text-2xl font-bold">{prescriptions.length}</p>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <ExclamationCircleIcon className="h-6 w-6 text-red-500" />
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-200">
            <div className="flex overflow-x-auto scrollbar-hide">
              <button
                onClick={() => setActiveTab('active')}
                className={`flex-1 min-w-0 px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-semibold transition-colors flex-shrink-0 ${
                  activeTab === 'active'
                    ? 'bg-purple-50 text-purple-700 border-b-2 border-purple-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <span className="flex items-center justify-center gap-1 md:gap-2">
                  <CheckCircleIcon className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
                  <span className="hidden sm:inline">Activas</span>
                  <span className="sm:hidden">Activas</span>
                  <span className="hidden md:inline"> ({prescriptions.filter(p => p.isActive).length})</span>
                  <span className="md:hidden">({prescriptions.filter(p => p.isActive).length})</span>
                </span>
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex-1 min-w-0 px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-semibold transition-colors flex-shrink-0 ${
                  activeTab === 'history'
                    ? 'bg-purple-50 text-purple-700 border-b-2 border-purple-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <span className="flex items-center justify-center gap-1 md:gap-1 md:gap-2">
                  <ClockIcon className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
                  <span>Historial</span>
                  <span>({prescriptions.filter(p => !p.isActive).length})</span>
                </span>
              </button>
              <button
                onClick={() => setActiveTab('renewals')}
                className={`flex-1 min-w-0 px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-semibold transition-colors flex-shrink-0 ${
                  activeTab === 'renewals'
                    ? 'bg-purple-50 text-purple-700 border-b-2 border-purple-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <span className="flex items-center justify-center gap-1 md:gap-2 relative">
                  <ArrowPathIcon className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
                  <span>Solicitudes</span>
                  <span>({renewals.length})</span>
                  {renewals.filter(r => r.status === 'pending').length > 0 && (
                    <span className="absolute -top-1 -right-2 bg-orange-500 text-white text-xs font-bold rounded-full h-4 w-4 md:h-5 md:w-5 flex items-center justify-center text-[10px] md:text-xs">
                      {renewals.filter(r => r.status === 'pending').length}
                    </span>
                  )}
                </span>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {activeTab === 'renewals' ? (
              renewals.length === 0 ? (
                <div className="text-center py-12">
                  <InboxIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay solicitudes de renovación</h3>
                  <p className="text-gray-600">Cuando solicites una renovación de receta, aparecerá aquí.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {renewals.map((renewal) => (
                    <RenewalCard
                      key={renewal.id}
                      renewal={renewal}
                      formatDate={formatDate}
                      onCancel={() => cancelRenewal(renewal.id)}
                    />
                  ))}
                </div>
              )
            ) : (
              filteredPrescriptions.length === 0 ? (
                <div className="text-center py-12">
                  <BeakerIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No hay recetas {activeTab === 'active' ? 'activas' : 'en el historial'}
                  </h3>
                  <p className="text-gray-600">
                    {activeTab === 'active'
                      ? 'No tienes recetas médicas activas en este momento.'
                      : 'No hay recetas vencidas en tu historial.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {filteredPrescriptions.map((prescription) => (
                    <PrescriptionCard
                      key={prescription.id}
                      prescription={prescription}
                      formatDate={formatDate}
                      getDisplayDuration={getDisplayDuration}
                      parseMedications={parseMedications}
                      getExpiryDate={getExpiryDate}
                      processLineBreaks={processLineBreaks}
                      onDownload={() => downloadPrescription(prescription)}
                      onRenew={() => renewPrescription(prescription)}
                      renewalLoading={renewalLoading === prescription.id}
                      hasPendingRenewal={hasPendingRenewal(prescription.id)}
                    />
                  ))}
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* Renewal Modal */}
      {showRenewalModal && renewalPrescription && (
        <RenewalModal
          prescription={renewalPrescription}
          reason={renewalReason}
          onReasonChange={setRenewalReason}
          onSubmit={() => submitRenewalRequest(formatDate)}
          onClose={() => { setShowRenewalModal(false); setRenewalPrescription(null); }}
          formatDate={formatDate}
        />
      )}
    </PatientLayout>
  );
}