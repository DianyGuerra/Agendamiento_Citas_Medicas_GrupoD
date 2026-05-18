import {
  CheckCircleIcon,
  ClockIcon,
  UserCircleIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import { formatDate, formatCurrency, paymentMethodLabels } from '../hooks';
import PropTypes from 'prop-types';

/**
 * Modal for displaying billing details
 */
export function BillingDetailModal({ billing, user, onDownload, onClose }) {
  const subtotal =
    Number.parseFloat(billing.subtotal) ||
    Number.parseFloat(billing.base_amount) ||
    Number.parseFloat(billing.total_amount) ||
    0;
  const discount = Number.parseFloat(billing.insurance_discount_amount) || 0;
  const total = Number.parseFloat(billing.total_amount) || subtotal - discount;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold">Detalle de Factura</h3>
              <p className="opacity-90">
                {billing.invoice_number || `FAC-${billing.id?.slice(0, 8)}`}
              </p>
            </div>
            {billing.status === 'paid' ? (
              <div className="bg-green-500 text-white px-4 py-2 rounded-full flex items-center gap-2">
                <CheckCircleIcon className="w-5 h-5" />
                <span className="font-medium">Pagado</span>
              </div>
            ) : (
              <div className="bg-yellow-500 text-white px-4 py-2 rounded-full flex items-center gap-2">
                <ClockIcon className="w-5 h-5" />
                <span className="font-medium">Pendiente</span>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Patient Info */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <UserCircleIcon className="w-5 h-5 text-blue-600" />
              Datos del Paciente
            </h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">Nombre</span>
                <p className="font-medium">
                  {user?.first_name} {user?.last_name}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Correo</span>
                <p className="font-medium">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Medical Service Info */}
          {(billing.doctor_first_name || billing.specialty_name || billing.appointments) && (
            <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
              <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <DocumentTextIcon className="w-5 h-5 text-purple-600" />
                Servicio Médico
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {billing.doctor_first_name && (
                  <div>
                    <span className="text-gray-500">Doctor</span>
                    <p className="font-medium">
                      Dr. {billing.doctor_first_name} {billing.doctor_last_name}
                    </p>
                  </div>
                )}
                {billing.specialty_name && (
                  <div>
                    <span className="text-gray-500">Especialidad</span>
                    <p className="font-medium">{billing.specialty_name}</p>
                  </div>
                )}
                {billing.appointments?.scheduled_start && (
                  <div>
                    <span className="text-gray-500">Fecha de Consulta</span>
                    <p className="font-medium">{formatDate(billing.appointments.scheduled_start)}</p>
                  </div>
                )}
                {billing.appointments?.reason && (
                  <div className="col-span-2">
                    <span className="text-gray-500">Motivo de Consulta</span>
                    <p className="font-medium">{billing.appointments.reason}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Billing Breakdown */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <CurrencyDollarIcon className="w-5 h-5 text-green-600" />
              Desglose de Facturación
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Consulta Médica</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    Descuento Seguro ({billing.insurance_discount_percentage || 0}%)
                  </span>
                  <span className="font-medium text-green-600">-{formatCurrency(discount)}</span>
                </div>
              )}
              {billing.tax_amount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Impuestos</span>
                  <span className="font-medium">{formatCurrency(billing.tax_amount)}</span>
                </div>
              )}
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="font-bold text-xl text-gray-900">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Invoice Details */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-blue-600" />
              Información de Factura
            </h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">Fecha de Emisión</span>
                <p className="font-medium">{formatDate(billing.created_at)}</p>
              </div>
              <div>
                <span className="text-gray-500">N° Factura</span>
                <p className="font-medium">
                  {billing.invoice_number || `FAC-${billing.id?.slice(0, 8)}`}
                </p>
              </div>
              {billing.status === 'paid' && (
                <>
                  {billing.payment_date && (
                    <div>
                      <span className="text-gray-500">Fecha de Pago</span>
                      <p className="font-medium text-green-600">{formatDate(billing.payment_date)}</p>
                    </div>
                  )}
                  {billing.payment_method && (
                    <div>
                      <span className="text-gray-500">Método de Pago</span>
                      <p className="font-medium capitalize">
                        {paymentMethodLabels[billing.payment_method] || billing.payment_method}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Status Alerts */}
          {billing.status === 'pending' && (
            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <ClockIcon className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-yellow-800">Factura Pendiente de Pago</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Para realizar el pago, puede acercarse a la recepción de la clínica o contactarnos
                    al teléfono (02) 2XXX-XXXX.
                  </p>
                  <p className="text-sm text-yellow-600 mt-2">
                    Aceptamos efectivo, tarjeta de crédito/débito y transferencia bancaria.
                  </p>
                </div>
              </div>
            </div>
          )}

          {billing.status === 'paid' && (
            <div className="bg-green-50 border-2 border-green-300 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
                <div>
                  <p className="font-bold text-green-800">Factura Pagada</p>
                  <p className="text-sm text-green-700">
                    Este pago ha sido procesado correctamente. Gracias por su confianza.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50 flex gap-3 justify-between rounded-b-2xl">
          <button
            onClick={() => onDownload(billing)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <ArrowDownTrayIcon className="w-5 h-5" />
            Descargar PDF
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
BillingDetailModal.propTypes = {
  billing: PropTypes.object.isRequired,
  user: PropTypes.object.isRequired,   
  onDownload: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};
