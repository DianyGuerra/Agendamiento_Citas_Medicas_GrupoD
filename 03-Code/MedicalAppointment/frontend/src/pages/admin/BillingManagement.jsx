import React, { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import jsPDF from 'jspdf';
import {
  CurrencyDollarIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  BanknotesIcon,
  PrinterIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { BillingModel, AppointmentModel } from '../../models';

export default function BillingManagement() {
  const [billings, setBillings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [notification, setNotification] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    paid: 0,
    totalAmount: 0,
    pendingAmount: 0,
  });

  // Modal states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedBilling, setSelectedBilling] = useState(null);
  const [completedAppointments, setCompletedAppointments] = useState([]);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState('');
  const [generating, setGenerating] = useState(false);
  
  // Payment form
  const [paymentData, setPaymentData] = useState({
    payment_method: 'cash',
    reference_number: '',
    notes: '',
    insurance_provider_id: '',
    insurance_claim_number: '',
  });

  useEffect(() => {
    loadBillings();
  }, [statusFilter]);

  const loadBillings = async () => {
    try {
      setLoading(true);
      const params = statusFilter !== 'all' ? { status: statusFilter } : {};
      const response = await BillingModel.getAll(params);
      const data = response.data || response || [];
      setBillings(data);
      calculateStats(data);
    } catch (error) {
      console.error('Error loading billings:', error);
      showNotification('Error al cargar facturas', 'error');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    const pending = data.filter(b => b.status === 'pending');
    const paid = data.filter(b => b.status === 'paid');
    
    setStats({
      total: data.length,
      pending: pending.length,
      paid: paid.length,
      totalAmount: data.reduce((sum, b) => sum + (Number.parseFloat(b.total_amount) || 0), 0),
      pendingAmount: pending.reduce((sum, b) => sum + (Number.parseFloat(b.total_amount) || 0), 0),
    });
  };

  const handleProcessPayment = async () => {
    if (!selectedBilling) return;

    try {
      await BillingModel.processPayment(selectedBilling.id, paymentData);
      showNotification('Pago procesado exitosamente', 'success');
      setShowPaymentModal(false);
      setPaymentData({ payment_method: 'cash', reference_number: '', notes: '' });
      loadBillings();
    } catch (error) {
      console.error('Error processing payment:', error);
      showNotification('Error al procesar el pago', 'error');
    }
  };

  const openGenerateModal = async () => {
    try {
      // Load completed appointments that don't have a billing yet
      const response = await AppointmentModel.getUnbilled();
      const appointments = response.data || response || [];
      
      setCompletedAppointments(appointments);
      setShowGenerateModal(true);
    } catch (error) {
      console.error('Error loading appointments:', error);
      showNotification('Error al cargar citas', 'error');
    }
  };

  const handleGenerateInvoice = async () => {
    if (!selectedAppointmentId) {
      showNotification('Seleccione una cita', 'error');
      return;
    }

    try {
      setGenerating(true);
      await BillingModel.generateInvoice(selectedAppointmentId);
      showNotification('Factura generada exitosamente', 'success');
      setShowGenerateModal(false);
      setSelectedAppointmentId('');
      loadBillings();
    } catch (error) {
      console.error('Error generating invoice:', error);
      const message = error.message || 'Error al generar factura';
      showNotification(message.includes('ya existe') ? 'Ya existe una factura para esta cita' : message, 'error');
    } finally {
      setGenerating(false);
    }
  };

  const openPaymentModal = (billing) => {
    setSelectedBilling(billing);
    setShowPaymentModal(true);
  };

  const openDetailModal = (billing) => {
    setSelectedBilling(billing);
    setShowDetailModal(true);
  };

  const printInvoice = (billing) => {
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    let y = 20;

    const patientName = `${billing.patient?.first_name || ''} ${billing.patient?.last_name || ''}`.trim() || 'N/A';
    const patientEmail = billing.patient?.email || 'N/A';
    const doctorName = billing.doctor?.users?.first_name 
      ? `Dr. ${billing.doctor.users.first_name} ${billing.doctor.users.last_name}`
      : billing.doctor_name || 'N/A';
    const specialty = billing.doctor?.specialties?.name || billing.specialty_name || 'Consulta General';
    const paymentMethodLabels = {
      cash: 'Efectivo',
      card: 'Tarjeta de Crédito/Débito',
      transfer: 'Transferencia Bancaria',
      insurance: 'Seguro Médico'
    };
    
    // Calculate correct amounts
    const subtotal = Number.parseFloat(billing.subtotal) || Number.parseFloat(billing.base_amount) || Number.parseFloat(billing.total_amount) || 0;
    const discount = Number.parseFloat(billing.insurance_discount_amount) || 0;
    const total = Number.parseFloat(billing.total_amount) || (subtotal - discount);

    // Colors
    const primaryColor = [59, 130, 246]; // blue-500
    const textDark = [31, 41, 55]; // gray-800
    const textLight = [107, 114, 128]; // gray-500
    const greenColor = [22, 163, 74]; // green-600
    const yellowColor = [202, 138, 4]; // yellow-600

    // Header background
    pdf.setFillColor(...primaryColor);
    pdf.rect(0, 0, pageWidth, 40, 'F');

    // Logo and clinic name
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(22);
    pdf.setFont(undefined, 'bold');
    pdf.text('Clínica Médica', margin, 18);
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    pdf.text('Sistema de Facturación', margin, 26);
    pdf.text('Tel: (02) 2XXX-XXXX | info@clinicamedica.com', margin, 32);

    // Invoice number on the right
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
    
    // Patient section
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

    // Doctor section
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

    // Table header
    y += 8;
    pdf.setFillColor(248, 250, 252);
    pdf.rect(margin, y - 4, pageWidth - margin * 2, 10, 'F');
    pdf.setFontSize(9);
    pdf.setFont(undefined, 'bold');
    pdf.text('Concepto', margin + 5, y + 2);
    pdf.text('Monto', pageWidth - margin - 5, y + 2, { align: 'right' });

    // Consultation row
    y += 14;
    pdf.setFont(undefined, 'normal');
    pdf.text(`Consulta Médica (${specialty})`, margin + 5, y);
    pdf.text(formatCurrency(subtotal), pageWidth - margin - 5, y, { align: 'right' });

    // Discount row
    if (discount > 0) {
      y += 10;
      pdf.setTextColor(...greenColor);
      pdf.text(`Descuento Seguro (${billing.insurance_discount_percentage || 0}%)`, margin + 5, y);
      pdf.text(`-${formatCurrency(discount)}`, pageWidth - margin - 5, y, { align: 'right' });
    }

    // Total row
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

    // Payment info section
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
      pdf.text(`Método: ${paymentMethodLabels[billing.payment_method] || billing.payment_method || 'N/A'}`, margin + 80, y + 20);
    } else {
      pdf.setFillColor(254, 243, 199);
      pdf.roundedRect(margin, y, pageWidth - margin * 2, 25, 3, 3, 'F');
      pdf.setTextColor(...yellowColor);
      pdf.setFontSize(11);
      pdf.setFont(undefined, 'bold');
      pdf.text('FACTURA PENDIENTE DE PAGO', margin + 10, y + 10);
      pdf.setFontSize(9);
      pdf.setFont(undefined, 'normal');
      pdf.setTextColor(120, 80, 20);
      pdf.text('Esta factura está pendiente de pago. Realizar pago en recepción.', margin + 10, y + 18);
    }

    // Footer
    pdf.setTextColor(...textLight);
    pdf.setFontSize(8);
    pdf.text('Este documento es un comprobante oficial de facturación médica', pageWidth / 2, 280, { align: 'center' });
    pdf.text('Clínica Médica - Gracias por su confianza', pageWidth / 2, 285, { align: 'center' });

    // Open PDF in new tab
    const pdfBlob = pdf.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, '_blank');
  };

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('es-EC', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pendiente', icon: ClockIcon },
      paid: { color: 'bg-green-100 text-green-800', label: 'Pagado', icon: CheckCircleIcon },
      cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelado', icon: XCircleIcon },
      overdue: { color: 'bg-red-100 text-red-800', label: 'Vencido', icon: XCircleIcon },
    };
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3.5 h-3.5" />
        {config.label}
      </span>
    );
  };

  const filteredBillings = billings.filter(billing => {
    const searchLower = searchTerm.toLowerCase();
    const patientName = `${billing.patient?.first_name || ''} ${billing.patient?.last_name || ''}`.toLowerCase();
    const invoiceNumber = billing.invoice_number?.toLowerCase() || '';
    return patientName.includes(searchLower) || invoiceNumber.includes(searchLower);
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Notification */}
        {notification && (
          <div className={`p-4 rounded-lg ${
            notification.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {notification.message}
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Gestión de Facturación</h2>
            <p className="text-sm sm:text-base text-gray-600">Administra facturas y pagos</p>
          </div>
          <button
            onClick={openGenerateModal}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm sm:text-base"
          >
            <PlusIcon className="w-5 h-5" />
            <span className="hidden sm:inline">Generar Factura</span>
            <span className="sm:hidden">Generar</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 sm:p-3 bg-blue-100 rounded-lg">
                <DocumentTextIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-500">Total Facturas</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-800">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 sm:p-3 bg-yellow-100 rounded-lg">
                <ClockIcon className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-500">Pendientes</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-800">{stats.pending}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 sm:p-3 bg-green-100 rounded-lg">
                <CheckCircleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-500">Pagados</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-800">{stats.paid}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 sm:p-3 bg-purple-100 rounded-lg">
                <CurrencyDollarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-500">Por Cobrar</p>
                <p className="text-sm sm:text-2xl font-bold text-gray-800 truncate">{formatCurrency(stats.pendingAmount)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
          <div className="flex flex-col gap-3">
            <div className="relative">
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por paciente o número de factura..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                style={{ fontSize: '16px' }}
              />
            </div>
            <div className="flex items-center gap-2">
              <FunnelIcon className="w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                style={{ fontSize: '16px' }}
              >
                <option value="all">Todos</option>
                <option value="pending">Pendientes</option>
                <option value="paid">Pagados</option>
                <option value="overdue">Vencidos</option>
                <option value="cancelled">Cancelados</option>
              </select>
            </div>
          </div>
        </div>

        {/* Billings Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredBillings.length === 0 ? (
            <div className="text-center py-12">
              <DocumentTextIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-600">No hay facturas</h3>
              <p className="text-gray-400">Las facturas aparecerán aquí</p>
            </div>
          ) : (
            <>
              {/* Mobile Cards */}
              <div className="lg:hidden divide-y divide-gray-200">
                {filteredBillings.map((billing) => (
                  <div key={billing.id} className="p-3 sm:p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 text-sm truncate">
                          {billing.invoice_number || `#${billing.id?.slice(0, 8)}`}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {billing.patient?.first_name} {billing.patient?.last_name}
                        </p>
                      </div>
                      {getStatusBadge(billing.status)}
                    </div>
                    
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-gray-500">{formatDate(billing.created_at)}</span>
                      <span className="font-semibold text-gray-900">{formatCurrency(billing.total_amount)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openDetailModal(billing)}
                        className="flex-1 px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                      >
                        Ver detalle
                      </button>
                      {billing.status === 'pending' && (
                        <button
                          onClick={() => openPaymentModal(billing)}
                          className="flex-1 px-3 py-1.5 text-xs bg-green-50 text-green-600 rounded hover:bg-green-100"
                        >
                          Registrar pago
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Desktop Table */}
              <div className="hidden lg:block">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Factura
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Paciente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBillings.map((billing) => (
                  <tr key={billing.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {billing.invoice_number || `#${billing.id?.slice(0, 8)}`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {billing.patient?.first_name} {billing.patient?.last_name}
                      </div>
                      <div className="text-xs text-gray-500">{billing.patient?.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(billing.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatCurrency(billing.total_amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(billing.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openDetailModal(billing)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                          title="Ver detalle"
                        >
                          <EyeIcon className="w-5 h-5" />
                        </button>
                        {billing.status === 'pending' && (
                          <button
                            onClick={() => openPaymentModal(billing)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                            title="Registrar pago"
                          >
                            <BanknotesIcon className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
              </div>
            </>
          )}
        </div>

        {/* Payment Modal */}
        {showPaymentModal && selectedBilling && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-4 sm:p-6 border-b">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800">Registrar Pago</h3>
                <p className="text-xs sm:text-sm text-gray-500">
                  Factura: {selectedBilling.invoice_number || `#${selectedBilling.id?.slice(0, 8)}`}
                </p>
              </div>
              
              <div className="p-4 sm:p-6 space-y-4">
                <div className="bg-blue-50 rounded-lg p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-blue-600">Monto a Pagar</p>
                  <p className="text-xl sm:text-2xl font-bold text-blue-800">
                    {formatCurrency(selectedBilling.total_amount)}
                  </p>
                </div>

                <div>
                  <span className="block text-sm font-medium text-gray-700 mb-1">
                    Método de Pago
                  </span>
                  <select
                    value={paymentData.payment_method}
                    onChange={(e) => setPaymentData({...paymentData, payment_method: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    style={{ fontSize: '16px' }}
                  >
                    <option value="cash">Efectivo</option>
                    <option value="card">Tarjeta de Crédito/Débito</option>
                    <option value="transfer">Transferencia Bancaria</option>
                    <option value="insurance">Seguro Médico</option>
                  </select>
                </div>

                <div>
                  <span className="block text-sm font-medium text-gray-700 mb-1">
                    Número de Referencia (opcional)
                  </span>
                  <input
                    type="text"
                    value={paymentData.reference_number}
                    onChange={(e) => setPaymentData({...paymentData, reference_number: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: Número de transacción"
                    style={{ fontSize: '16px' }}
                  />
                </div>

                <div>
                  <span className="block text-sm font-medium text-gray-700 mb-1">
                    Notas (opcional)
                  </span>
                  <textarea
                    value={paymentData.notes}
                    onChange={(e) => setPaymentData({...paymentData, notes: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    style={{ fontSize: '16px' }}
                  />
                </div>
              </div>

              <div className="p-4 sm:p-6 border-t bg-gray-50 flex flex-col sm:flex-row gap-2 sm:gap-3 sm:justify-end">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-sm sm:text-base"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleProcessPayment}
                  className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm sm:text-base"
                >
                  Confirmar Pago
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Detail Modal */}
        {showDetailModal && selectedBilling && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-4 sm:p-6 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-800">Detalle de Factura</h3>
                  <p className="text-xs sm:text-sm text-gray-500">
                    {selectedBilling.invoice_number || `#${selectedBilling.id?.slice(0, 8)}`}
                  </p>
                </div>
                {getStatusBadge(selectedBilling.status)}
              </div>
              
              <div className="p-4 sm:p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Paciente</p>
                    <p className="font-medium text-sm sm:text-base">
                      {selectedBilling.patient?.first_name} {selectedBilling.patient?.last_name}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500 truncate">{selectedBilling.patient?.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Médico</p>
                    <p className="font-medium text-sm sm:text-base">
                      {selectedBilling.doctor?.users?.first_name 
                        ? `Dr. ${selectedBilling.doctor.users.first_name} ${selectedBilling.doctor.users.last_name}`
                        : selectedBilling.doctor_name || 'N/A'}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500">
                      {selectedBilling.doctor?.specialties?.name || selectedBilling.specialty_name || 'Consulta General'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Fecha de Emisión</p>
                    <p className="font-medium text-sm sm:text-base">{formatDate(selectedBilling.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Estado del Pago</p>
                    <p className="font-medium text-sm sm:text-base">
                      {selectedBilling.status === 'paid' ? (
                        <span className="text-green-600">✓ Pagado</span>
                      ) : (
                        <span className="text-yellow-600">⏳ Pendiente</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Desglose de Montos */}
                <div className="bg-gray-50 rounded-lg p-3 sm:p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">{formatCurrency(selectedBilling.subtotal || selectedBilling.base_amount)}</span>
                  </div>
                  {selectedBilling.insurance_discount_percentage > 0 && (
                    <div className="flex justify-between text-green-600 text-sm">
                      <span>Descuento Seguro ({selectedBilling.insurance_discount_percentage}%)</span>
                      <span>-{formatCurrency(selectedBilling.insurance_discount_amount)}</span>
                    </div>
                  )}
                  {selectedBilling.tax_amount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Impuestos ({selectedBilling.tax_percentage || 0}%)</span>
                      <span className="font-medium">{formatCurrency(selectedBilling.tax_amount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="font-semibold text-gray-800 text-sm sm:text-base">Total</span>
                    <span className="font-bold text-lg sm:text-xl">{formatCurrency(selectedBilling.total_amount || selectedBilling.amount)}</span>
                  </div>
                </div>

                {/* Información del Seguro */}
                {(selectedBilling.insurance_provider_id || selectedBilling.insurance_provider) && (
                  <div className="bg-blue-50 rounded-lg p-3 sm:p-4">
                    <h4 className="font-semibold text-blue-800 mb-2 text-sm sm:text-base">Información del Seguro</h4>
                    <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                      <div>
                        <p className="text-blue-600">Aseguradora</p>
                        <p className="font-medium text-blue-900">{selectedBilling.insurance_provider?.name || selectedBilling.insurance_provider || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-blue-600">% Descuento</p>
                        <p className="font-medium text-blue-900">{selectedBilling.insurance_discount_percentage || 0}%</p>
                      </div>
                      <div>
                        <p className="text-blue-600">N° de Claim</p>
                        <p className="font-medium text-blue-900">{selectedBilling.insurance_claim_number || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-blue-600">Monto Descuento</p>
                        <p className="font-medium text-blue-900">{formatCurrency(selectedBilling.insurance_discount_amount)}</p>
                      </div>
                    </div>
                  </div>
                )}

                {selectedBilling.payment_date && (
                  <div className="bg-green-50 rounded-lg p-3 sm:p-4">
                    <p className="text-xs sm:text-sm text-green-600">Pagado el</p>
                    <p className="font-medium text-green-800 text-sm sm:text-base">{formatDate(selectedBilling.payment_date)}</p>
                    {selectedBilling.payment_method && (
                      <p className="text-xs sm:text-sm text-green-700 mt-1">Método: {selectedBilling.payment_method}</p>
                    )}
                  </div>
                )}

                {selectedBilling.notes && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Notas</p>
                    <p className="text-gray-700 text-sm">{selectedBilling.notes}</p>
                  </div>
                )}
              </div>

              <div className="p-4 sm:p-6 border-t bg-gray-50 flex flex-col sm:flex-row gap-2 sm:gap-3 sm:justify-end">
                <button
                  onClick={() => printInvoice(selectedBilling)}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm sm:text-base"
                >
                  <PrinterIcon className="w-4 h-4" />
                  Imprimir Factura
                </button>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-sm sm:text-base"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Generate Invoice Modal */}
        {showGenerateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="p-4 sm:p-6 border-b">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800">Generar Factura</h3>
                <p className="text-xs sm:text-sm text-gray-500">
                  Seleccione una cita completada para generar su factura
                </p>
              </div>
              
              <div className="p-4 sm:p-6 space-y-4">
                {completedAppointments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <DocumentTextIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm">No hay citas completadas disponibles</p>
                  </div>
                ) : (
                  <div>
                    <span className="block text-sm font-medium text-gray-700 mb-2">
                      Seleccione una cita
                    </span>
                    <select
                      value={selectedAppointmentId}
                      onChange={(e) => setSelectedAppointmentId(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                      style={{ fontSize: '16px' }}
                    >
                      <option value="">-- Seleccione una cita --</option>
                      {completedAppointments.map((apt) => {
                        const patientName = apt.patient_first_name && apt.patient_last_name 
                          ? `${apt.patient_first_name} ${apt.patient_last_name}`
                          : apt.patient?.first_name 
                            ? `${apt.patient.first_name} ${apt.patient.last_name}`
                            : 'Paciente';
                        const doctorName = apt.doctor_first_name && apt.doctor_last_name
                          ? `Dr. ${apt.doctor_first_name} ${apt.doctor_last_name}`
                          : apt.doctors?.users?.first_name
                            ? `Dr. ${apt.doctors.users.first_name} ${apt.doctors.users.last_name}`
                            : '';
                        const specialty = apt.specialty_name || apt.doctors?.specialties?.name || '';
                        const dateStr = formatDate(apt.scheduled_start);
                        
                        return (
                          <option key={apt.id || apt.appointment_id} value={apt.id || apt.appointment_id}>
                            {dateStr} | {patientName} | {doctorName}{specialty ? ` (${specialty})` : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}
              </div>

              <div className="p-4 sm:p-6 border-t bg-gray-50 flex flex-col sm:flex-row gap-2 sm:gap-3 sm:justify-end">
                <button
                  onClick={() => {
                    setShowGenerateModal(false);
                    setSelectedAppointmentId('');
                  }}
                  className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-sm sm:text-base"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleGenerateInvoice}
                  disabled={!selectedAppointmentId || generating}
                  className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  {generating ? 'Generando...' : 'Generar Factura'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
