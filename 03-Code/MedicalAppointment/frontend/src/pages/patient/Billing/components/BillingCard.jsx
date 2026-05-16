import {
  CalendarIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  ClockIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { formatDate, formatCurrency, getStatusInfo } from '../hooks';
import PropTypes from 'prop-types';

/**
 * Individual billing card
 */
export function BillingCard({ billing, onViewDetail, onDownload }) {
  const statusInfo = getStatusInfo(billing.status);
  const StatusIcon = billing.status === 'paid' ? CheckCircleIcon : ClockIcon;

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${statusInfo.color}`}
              >
                <StatusIcon className={`w-3.5 h-3.5 ${statusInfo.iconColor}`} />
                {statusInfo.label}
              </span>
              <span className="text-xs sm:text-sm text-gray-500 truncate">
                {billing.invoice_number || `Factura #${billing.id?.slice(0, 8)}`}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <CalendarIcon className="w-4 h-4 flex-shrink-0" />
                {formatDate(billing.created_at)}
              </div>
              {billing.doctor && (
                <span className="truncate">
                  Dr(a). {billing.doctor?.users?.first_name} {billing.doctor?.users?.last_name}
                </span>
              )}
            </div>

            {billing.description && <p className="text-gray-600 mt-2 text-sm">{billing.description}</p>}
          </div>

          <div className="text-left sm:text-right flex-shrink-0">
            <p className="text-xl sm:text-2xl font-bold text-gray-800">
              {formatCurrency(billing.total_amount)}
            </p>
            {billing.status === 'paid' && billing.payment_date && (
              <p className="text-xs text-green-600 mt-1">
                Pagado el {formatDate(billing.payment_date)}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-4 pt-4 border-t">
          <button
            onClick={() => onViewDetail(billing)}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition text-sm"
          >
            <EyeIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            Ver Detalle
          </button>
          <button
            onClick={() => onDownload(billing)}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition text-sm"
          >
            <ArrowDownTrayIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            Descargar PDF
          </button>
        </div>
      </div>
    </div>
  );
}
BillingCard.propTypes = {
  billing: PropTypes.object.isRequired,   
  onViewDetail: PropTypes.func.isRequired,
  onDownload: PropTypes.func.isRequired,
};