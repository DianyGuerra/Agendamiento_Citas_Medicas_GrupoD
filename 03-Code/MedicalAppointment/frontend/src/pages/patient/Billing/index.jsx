import PatientLayout from '../../../layouts/PatientLayout';
import { useAuth } from '../../../context/AuthContext';
import jsPDF from 'jspdf';
import { CurrencyDollarIcon } from '@heroicons/react/24/outline';
import { useBilling, formatCurrency, formatDate, paymentMethodLabels } from './hooks';
import { BillingSummary, BillingCard, BillingDetailModal } from './components';

export default function PatientBilling() {
  const { user } = useAuth();
  const {
    billings,
    loading,
    filter,
    setFilter,
    filteredBillings,
    pendingTotal,
    paidTotal,
    selectedBilling,
    showDetailModal,
    openDetail,
    closeDetail,
  } = useBilling();

  const downloadBillingPDF = (billing) => {
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    let y = 20;

    const patientName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim();
    const patientEmail = user?.email || '';
    const doctorName = billing.doctor_first_name
      ? `Dr. ${billing.doctor_first_name} ${billing.doctor_last_name}`
      : billing.doctor?.users?.first_name
        ? `Dr. ${billing.doctor.users.first_name} ${billing.doctor.users.last_name}`
        : 'N/A';
    const specialty = billing.specialty_name || billing.doctor?.specialties?.name || 'Consulta General';

    const subtotal =
      Number.parseFloat(billing.subtotal) ||
      Number.parseFloat(billing.base_amount) ||
      Number.parseFloat(billing.total_amount) ||
      0;
    const discount = Number.parseFloat(billing.insurance_discount_amount) || 0;
    const total = Number.parseFloat(billing.total_amount) || subtotal - discount;

    const primaryColor = [59, 130, 246];
    const textDark = [31, 41, 55];
    const textLight = [107, 114, 128];
    const greenColor = [22, 163, 74];
    const yellowColor = [202, 138, 4];

    // Header
    pdf.setFillColor(...primaryColor);
    pdf.rect(0, 0, pageWidth, 40, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(22);
    pdf.setFont(undefined, 'bold');
    pdf.text('Clínica Médica', margin, 18);
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    pdf.text('Sistema de Facturación', margin, 26);
    pdf.text('Tel: (02) 2XXX-XXXX | info@clinicamedica.com', margin, 32);

    pdf.setFontSize(12);
    pdf.setFont(undefined, 'bold');
    pdf.text(billing.invoice_number || 'BORRADOR', pageWidth - margin, 18, { align: 'right' });
    pdf.setFontSize(9);
    pdf.setFont(undefined, 'normal');
    pdf.text(`Emitida: ${formatDate(billing.created_at)}`, pageWidth - margin, 26, { align: 'right' });

    // Status badge
    y = 50;
    if (billing.status === 'paid') {
      pdf.setFillColor(220, 252, 231);
      pdf.roundedRect(pageWidth - margin - 35, y - 6, 35, 10, 2, 2, 'F');
      pdf.setTextColor(...greenColor);
      pdf.setFontSize(9);
      pdf.setFont(undefined, 'bold');
      pdf.text('PAGADA', pageWidth - margin - 17.5, y + 1, { align: 'center' });
    } else {
      pdf.setFillColor(254, 243, 199);
      pdf.roundedRect(pageWidth - margin - 35, y - 6, 35, 10, 2, 2, 'F');
      pdf.setTextColor(...yellowColor);
      pdf.setFontSize(9);
      pdf.setFont(undefined, 'bold');
      pdf.text('PENDIENTE', pageWidth - margin - 17.5, y + 1, { align: 'center' });
    }

    // Patient and Doctor sections
    y = 55;
    pdf.setFillColor(248, 250, 252);
    pdf.rect(margin, y, (pageWidth - margin * 2 - 5) / 2, 35, 'F');
    pdf.setTextColor(...textDark);
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'bold');
    pdf.text('DATOS DEL PACIENTE', margin + 5, y + 8);
    pdf.setFont(undefined, 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(...textLight);
    pdf.text('Nombre:', margin + 5, y + 16);
    pdf.text('Correo:', margin + 5, y + 24);
    pdf.setTextColor(...textDark);
    pdf.text(patientName, margin + 25, y + 16);
    pdf.text(patientEmail, margin + 25, y + 24);

    const rightColX = margin + (pageWidth - margin * 2 - 5) / 2 + 5;
    pdf.setFillColor(248, 250, 252);
    pdf.rect(rightColX, y, (pageWidth - margin * 2 - 5) / 2, 35, 'F');
    pdf.setTextColor(...textDark);
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'bold');
    pdf.text('SERVICIO MÉDICO', rightColX + 5, y + 8);
    pdf.setFont(undefined, 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(...textLight);
    pdf.text('Médico:', rightColX + 5, y + 16);
    pdf.text('Especialidad:', rightColX + 5, y + 24);
    pdf.setTextColor(...textDark);
    pdf.text(doctorName, rightColX + 30, y + 16);
    pdf.text(specialty, rightColX + 30, y + 24);

    // Billing breakdown
    y = 100;
    pdf.setTextColor(...textDark);
    pdf.setFontSize(11);
    pdf.setFont(undefined, 'bold');
    pdf.text('DESGLOSE DE FACTURACIÓN', margin, y);

    y += 8;
    pdf.setDrawColor(229, 231, 235);
    pdf.setLineWidth(0.5);
    pdf.line(margin, y, pageWidth - margin, y);

    y += 8;
    pdf.setFillColor(248, 250, 252);
    pdf.rect(margin, y - 4, pageWidth - margin * 2, 10, 'F');
    pdf.setFontSize(9);
    pdf.setFont(undefined, 'bold');
    pdf.text('Concepto', margin + 5, y + 2);
    pdf.text('Monto', pageWidth - margin - 5, y + 2, { align: 'right' });

    y += 14;
    pdf.setFont(undefined, 'normal');
    pdf.text(`Consulta Médica (${specialty})`, margin + 5, y);
    pdf.text(formatCurrency(subtotal), pageWidth - margin - 5, y, { align: 'right' });

    if (discount > 0) {
      y += 10;
      pdf.setTextColor(...greenColor);
      pdf.text(`Descuento Seguro (${billing.insurance_discount_percentage || 0}%)`, margin + 5, y);
      pdf.text(`-${formatCurrency(discount)}`, pageWidth - margin - 5, y, { align: 'right' });
    }

    y += 12;
    pdf.setDrawColor(...primaryColor);
    pdf.setLineWidth(0.8);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 10;
    pdf.setTextColor(...textDark);
    pdf.setFontSize(12);
    pdf.setFont(undefined, 'bold');
    pdf.text('TOTAL A PAGAR', margin + 5, y);
    pdf.setTextColor(...primaryColor);
    pdf.setFontSize(16);
    pdf.text(formatCurrency(total), pageWidth - margin - 5, y, { align: 'right' });

    // Payment info
    y += 20;
    if (billing.status === 'paid') {
      pdf.setFillColor(220, 252, 231);
      pdf.roundedRect(margin, y, pageWidth - margin * 2, 30, 3, 3, 'F');
      pdf.setTextColor(...greenColor);
      pdf.setFontSize(11);
      pdf.setFont(undefined, 'bold');
      pdf.text('✓ PAGO REGISTRADO', margin + 10, y + 12);
      pdf.setFontSize(9);
      pdf.setFont(undefined, 'normal');
      pdf.text(`Fecha de pago: ${formatDate(billing.payment_date)}`, margin + 10, y + 20);
      pdf.text(
        `Método: ${paymentMethodLabels[billing.payment_method] || billing.payment_method || 'N/A'}`,
        margin + 80,
        y + 20
      );
    } else {
      pdf.setFillColor(254, 243, 199);
      pdf.roundedRect(margin, y, pageWidth - margin * 2, 45, 3, 3, 'F');
      pdf.setTextColor(...yellowColor);
      pdf.setFontSize(11);
      pdf.setFont(undefined, 'bold');
      pdf.text('FACTURA PENDIENTE DE PAGO', margin + 10, y + 12);
      pdf.setFontSize(9);
      pdf.setFont(undefined, 'normal');
      pdf.setTextColor(120, 80, 20);
      pdf.text('Para realizar el pago, acérquese a la recepción de la clínica con esta factura.', margin + 10, y + 22);
    }

    // Footer
    pdf.setTextColor(...textLight);
    pdf.setFontSize(8);
    pdf.text('Este documento es un comprobante oficial de facturación médica', pageWidth / 2, 280, { align: 'center' });

    const pdfBlob = pdf.output('blob');
    window.open(URL.createObjectURL(pdfBlob), '_blank');
  };

  if (loading) {
    return (
      <PatientLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </PatientLayout>
    );
  }

  return (
    <PatientLayout>
      <div className="space-y-4 md:space-y-6 w-full min-w-0">
        {/* Header */}
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-800">Mis Facturas</h2>
          <p className="text-sm md:text-base text-gray-600">Historial de pagos y facturas pendientes</p>
        </div>

        {/* Summary */}
        <BillingSummary totalCount={billings.length} pendingTotal={pendingTotal} paidTotal={paidTotal} />

        {/* Filter Tabs */}
        <div className="bg-white rounded-xl shadow-md p-1.5 md:p-2 inline-flex gap-1 md:gap-2">
          {[
            { value: 'all', label: 'Todas' },
            { value: 'pending', label: 'Pendientes' },
            { value: 'paid', label: 'Pagadas' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium transition ${
                filter === tab.value ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Billings List */}
        <div className="space-y-4">
          {filteredBillings.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <CurrencyDollarIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-600">No hay facturas</h3>
              <p className="text-gray-400">Tus facturas aparecerán aquí</p>
            </div>
          ) : (
            filteredBillings.map((billing) => (
              <BillingCard
                key={billing.id}
                billing={billing}
                onViewDetail={openDetail}
                onDownload={downloadBillingPDF}
              />
            ))
          )}
        </div>

        {/* Detail Modal */}
        {showDetailModal && selectedBilling && (
          <BillingDetailModal
            billing={selectedBilling}
            user={user}
            onDownload={downloadBillingPDF}
            onClose={closeDetail}
          />
        )}
      </div>
    </PatientLayout>
  );
}
