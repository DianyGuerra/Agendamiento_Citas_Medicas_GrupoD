import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  XMarkIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

const STATUS_CONFIG = {
  pending: { label: 'Pendiente', color: 'bg-yellow-100 border-yellow-300 text-yellow-800', icon: ClockIcon },
  approved: { label: 'Aprobada', color: 'bg-green-100 border-green-300 text-green-800', icon: CheckCircleIcon },
  rejected: { label: 'Rechazada', color: 'bg-red-100 border-red-300 text-red-800', icon: XCircleIcon },
  cancelled: { label: 'Cancelada', color: 'bg-gray-100 border-gray-300 text-gray-800', icon: XMarkIcon },
};

export default function RenewalCard({ renewal, formatDate, onCancel }) {
  const config = STATUS_CONFIG[renewal.status] || STATUS_CONFIG.pending;
  const StatusIcon = config.icon;

  return (
    <div className="border-2 border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all bg-white">
      <div className="p-4 md:p-5 bg-gradient-to-r from-orange-50 to-white">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex items-start gap-3 md:gap-4 flex-1 min-w-0">
            <div className="bg-orange-500 p-2.5 md:p-3 rounded-xl flex-shrink-0">
              <ArrowPathIcon className="h-6 w-6 md:h-7 md:w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base md:text-lg font-bold text-gray-900 mb-1">
                Solicitud de Renovación
              </h3>
              <p className="text-sm text-gray-600">
                Dr. {renewal.doctor_first_name} {renewal.doctor_last_name}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {renewal.specialty_name || 'Medicina General'}
              </p>
            </div>
          </div>

          <span className={`self-start inline-flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs font-bold border-2 whitespace-nowrap flex-shrink-0 ${config.color}`}>
            <StatusIcon className="h-3.5 w-3.5 md:h-4 md:w-4" />
            {config.label}
          </span>
        </div>
      </div>

      <div className="p-4 md:p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-4">
          <div className="bg-gray-50 rounded-xl p-2.5 md:p-3 border border-gray-200">
            <p className="text-xs font-semibold text-gray-500 mb-1">Diagnóstico Original</p>
            <p className="text-xs md:text-sm font-medium text-gray-900">{renewal.original_diagnosis || 'N/A'}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-2.5 md:p-3 border border-gray-200">
            <p className="text-xs font-semibold text-gray-500 mb-1">Fecha de Solicitud</p>
            <p className="text-xs md:text-sm font-medium text-gray-900">{formatDate(renewal.requested_at)}</p>
          </div>
        </div>

        {renewal.request_reason && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
            <p className="text-xs font-semibold text-blue-700 mb-1">Razón de Solicitud</p>
            <p className="text-sm text-gray-700">{renewal.request_reason}</p>
          </div>
        )}

        {renewal.status === 'rejected' && renewal.rejection_reason && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
            <p className="text-xs font-semibold text-red-700 mb-1">Razón del Rechazo</p>
            <p className="text-sm text-gray-700">{renewal.rejection_reason}</p>
          </div>
        )}

        {renewal.status === 'approved' && renewal.doctor_response && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
            <p className="text-xs font-semibold text-green-700 mb-1">Respuesta del Doctor</p>
            <p className="text-sm text-gray-700">{renewal.doctor_response}</p>
          </div>
        )}

        {renewal.status === 'pending' && (
          <div className="flex gap-3 mt-4">
            <button
              onClick={onCancel}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 md:py-3 rounded-xl border-2 border-red-300 text-red-600 hover:bg-red-50 transition-colors font-semibold text-sm md:text-base"
            >
              <XMarkIcon className="h-4 w-4 md:h-5 md:w-5" />
              Cancelar Solicitud
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
