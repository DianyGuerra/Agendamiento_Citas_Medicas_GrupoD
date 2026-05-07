import {
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { formatCurrency } from '../hooks';

/**
 * Summary cards for billing overview
 */
export function BillingSummary({ totalCount, pendingTotal, paidTotal }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
      <div className="bg-white rounded-xl shadow-md p-4 md:p-6">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="p-2.5 md:p-3 bg-blue-100 rounded-lg flex-shrink-0">
            <DocumentTextIcon className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs md:text-sm text-gray-500">Total Facturas</p>
            <p className="text-xl md:text-2xl font-bold text-gray-800">{totalCount}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-4 md:p-6">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="p-2.5 md:p-3 bg-yellow-100 rounded-lg flex-shrink-0">
            <ClockIcon className="w-5 h-5 md:w-6 md:h-6 text-yellow-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs md:text-sm text-gray-500">Por Pagar</p>
            <p className="text-xl md:text-2xl font-bold text-yellow-600">{formatCurrency(pendingTotal)}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-4 md:p-6">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="p-2.5 md:p-3 bg-green-100 rounded-lg flex-shrink-0">
            <CheckCircleIcon className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs md:text-sm text-gray-500">Pagado</p>
            <p className="text-xl md:text-2xl font-bold text-green-600">{formatCurrency(paidTotal)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
