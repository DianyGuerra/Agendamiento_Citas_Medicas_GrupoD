import PatientLayout from '../../../layouts/PatientLayout';
import jsPDF from 'jspdf';
import {
  BeakerIcon,
  DocumentArrowDownIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { useLab, getStatusConfig, getParameterStatusClass } from './hooks';
import { LabResultCard, UploadModal } from './components';

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('es-EC', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export default function PatientLab() {
  const {
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
  } = useLab();

  // PDF Generation for single result
  const downloadLabResult = (report) => {
    try {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      let y = 20;

      const primaryColor = [41, 128, 185];
      const secondaryColor = [52, 73, 94];
      const accentColor = [46, 204, 113];
      const warningColor = [241, 196, 15];
      const dangerColor = [231, 76, 60];

      const checkPageBreak = (space) => {
        if (y + space > pageHeight - 25) { pdf.addPage(); y = 20; return true; }
        return false;
      };

      // Header
      pdf.setFillColor(...primaryColor);
      pdf.rect(0, 0, pageWidth, 50, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24);
      pdf.setFont(undefined, 'bold');
      pdf.text('CLÍNICA SAN MIGUEL', margin, 20);
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'normal');
      pdf.text('Laboratorio Clínico', margin, 28);
      pdf.text('Tel: (02) 2XXX-XXXX | Email: laboratorio@clinicasanmiguel.ec', margin, 34);
      pdf.text(`Fecha de Emisión: ${new Date().toLocaleDateString('es-ES')}`, margin, 40);

      y = 60;

      // Title
      pdf.setTextColor(...secondaryColor);
      pdf.setFontSize(18);
      pdf.setFont(undefined, 'bold');
      pdf.text('RESULTADO DE LABORATORIO', margin, y);
      y += 3;
      pdf.setDrawColor(...accentColor);
      pdf.setLineWidth(1);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 10;

      // Test Information
      pdf.setFillColor(245, 245, 245);
      pdf.rect(margin, y, pageWidth - 2 * margin, 30, 'F');
      y += 8;
      pdf.setFontSize(11);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(...primaryColor);
      pdf.text('INFORMACIÓN DEL EXAMEN', margin + 5, y);
      y += 7;
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'normal');
      pdf.setTextColor(...secondaryColor);
      pdf.text(`Examen: ${report.test_name || 'N/A'}`, margin + 5, y);
      y += 6;
      pdf.text(`Fecha de Orden: ${formatDate(report.order_date)}`, margin + 5, y);
      y += 6;
      pdf.text(`Ordenado por: ${report.doctor_full_name || 'Dr. Desconocido'}`, margin + 5, y);
      y += 15;

      // Results
      pdf.setFontSize(14);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(...primaryColor);
      pdf.text('RESULTADOS', margin, y);
      y += 8;

      if (report.lab_results && report.lab_results.length > 0) {
        pdf.setFillColor(...primaryColor);
        pdf.rect(margin, y, pageWidth - 2 * margin, 10, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(9);
        pdf.setFont(undefined, 'bold');
        const col1 = margin + 3, col2 = margin + 50, col3 = margin + 85, col4 = margin + 130;
        pdf.text('Parámetro', col1, y + 7);
        pdf.text('Resultado', col2, y + 7);
        pdf.text('Rango Normal', col3, y + 7);
        pdf.text('Estado', col4, y + 7);
        y += 10;
        pdf.setFont(undefined, 'normal');
        pdf.setFontSize(9);

        report.lab_results.forEach((param, index) => {
          checkPageBreak(12);
          if (index % 2 === 0) {
            pdf.setFillColor(250, 250, 250);
            pdf.rect(margin, y, pageWidth - 2 * margin, 10, 'F');
          }
          let statusColor = secondaryColor;
          const normalizedStatus = (param.status || '').toLowerCase();
          if (normalizedStatus === 'alto' || normalizedStatus === 'high') statusColor = dangerColor;
          else if (normalizedStatus === 'bajo' || normalizedStatus === 'low') statusColor = warningColor;
          else if (normalizedStatus === 'normal') statusColor = accentColor;

          pdf.setTextColor(...secondaryColor);
          pdf.text(param.parameter_name || 'N/A', col1, y + 7);
          pdf.setFont(undefined, 'bold');
          pdf.text(`${param.result_value || 'N/A'} ${param.unit || ''}`, col2, y + 7);
          pdf.setFont(undefined, 'normal');
          pdf.text(param.reference_range || 'N/A', col3, y + 7);
          pdf.setTextColor(...statusColor);
          pdf.setFont(undefined, 'bold');
          pdf.text(param.status || 'N/A', col4, y + 7);
          pdf.setFont(undefined, 'normal');
          y += 10;
        });
      } else {
        pdf.setTextColor(...secondaryColor);
        pdf.setFontSize(10);
        pdf.text('No hay resultados detallados disponibles', margin + 5, y);
        y += 10;
      }

      // Doctor notes
      if (report.doctor_notes) {
        y += 5;
        checkPageBreak(25);
        pdf.setDrawColor(...warningColor);
        pdf.setLineWidth(0.5);
        pdf.setFillColor(255, 250, 230);
        pdf.rect(margin, y, pageWidth - 2 * margin, 20, 'FD');
        y += 7;
        pdf.setFontSize(10);
        pdf.setFont(undefined, 'bold');
        pdf.setTextColor(...warningColor);
        pdf.text('NOTA DEL MÉDICO:', margin + 5, y);
        y += 6;
        pdf.setFont(undefined, 'normal');
        pdf.setTextColor(...secondaryColor);
        const notesLines = pdf.splitTextToSize(report.doctor_notes, pageWidth - 2 * margin - 10);
        notesLines.forEach((line) => { checkPageBreak(6); pdf.text(line, margin + 5, y); y += 5; });
      }

      // Footer
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text('Clínica San Miguel - Resultados de Laboratorio', pageWidth / 2, pageHeight - 15, { align: 'center' });
      pdf.text('Este documento es confidencial y está dirigido únicamente al paciente', pageWidth / 2, pageHeight - 10, { align: 'center' });

      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank');
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Error al generar el PDF');
    }
  };

  // PDF Generation for all results
  const downloadAllResults = () => {
    if (labResults.length === 0) {
      alert('No hay resultados para descargar');
      return;
    }
    // Similar logic as above but for all results with cover page
    alert('Descargando todos los resultados...');
  };

  if (loading) {
    return (
      <PatientLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Cargando resultados...</p>
          </div>
        </div>
      </PatientLayout>
    );
  }

  return (
    <PatientLayout>
      <div className="space-y-6">
        {/* Notification */}
        {notification && (
          <div className={`p-4 rounded-lg flex items-center gap-3 ${
            notification.type === 'success' ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-red-100 text-red-800 border border-red-300'
          }`}>
            {notification.type === 'success' ? <CheckCircleIcon className="h-5 w-5" /> : <ExclamationTriangleIcon className="h-5 w-5" />}
            {notification.message}
          </div>
        )}

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-4 md:p-8 text-white overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3 md:gap-4 min-w-0">
              <div className="bg-white/20 p-3 md:p-4 rounded-xl flex-shrink-0">
                <BeakerIcon className="h-8 w-8 md:h-10 md:w-10" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl md:text-3xl font-bold truncate">Resultados de Laboratorio</h1>
                <p className="text-blue-100 mt-1 text-sm md:text-base">Consulta y descarga tus exámenes médicos</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 md:gap-3">
              {labResults.filter(r => r.status !== 'pending').length > 0 && (
                <button
                  onClick={downloadAllResults}
                  className="inline-flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 bg-white text-blue-700 rounded-lg hover:bg-blue-50 transition-colors font-semibold shadow-lg text-sm md:text-base"
                >
                  <DocumentArrowDownIcon className="h-4 w-4 md:h-5 md:w-5" />
                  <span className="hidden sm:inline">Descargar Todos</span>
                  <span className="sm:hidden">Descargar</span>
                </button>
              )}
              <button
                onClick={loadLabResults}
                className="p-2 md:p-3 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                title="Actualizar"
              >
                <ArrowPathIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-red-800 text-center">{error}</p>
          </div>
        )}

        {/* Empty state */}
        {!error && labResults.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200">
            <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <BeakerIcon className="h-10 w-10 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No hay resultados de laboratorio</h3>
            <p className="text-gray-600">Aún no tienes resultados de laboratorio disponibles</p>
          </div>
        )}

        {/* Lab results cards */}
        {labResults.length > 0 && (
          <div className="space-y-4">
            {labResults.map((report) => {
              const statusConfig = getStatusConfig(report.status);
              const StatusIcon = report.status === 'completed' ? CheckCircleIcon : ClockIcon;
              return (
                <LabResultCard
                  key={report.id}
                  report={report}
                  statusConfig={{ ...statusConfig, icon: StatusIcon }}
                  formatDate={formatDate}
                  getParameterStatusClass={getParameterStatusClass}
                  onDownload={() => downloadLabResult(report)}
                  onUpload={() => openUploadModal(report)}
                />
              );
            })}
          </div>
        )}

        {/* Upload Modal */}
        {showUploadModal && selectedReport && (
          <UploadModal
            selectedReport={selectedReport}
            uploadData={uploadData}
            setUploadData={setUploadData}
            submitting={submitting}
            formatDate={formatDate}
            addParameter={addParameter}
            removeParameter={removeParameter}
            updateParameter={updateParameter}
            onSubmit={submitUpload}
            onClose={() => { setShowUploadModal(false); setSelectedReport(null); }}
          />
        )}
      </div>
    </PatientLayout>
  );
}